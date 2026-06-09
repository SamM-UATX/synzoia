"""Google Fit OAuth + data sync routes.

Flow:
  1. GET  /api/google-fit/auth?token=USER_TOKEN  → redirect to Google consent
  2. GET  /api/google-fit/callback?code=&state=  → exchange code, store tokens, sync
  3. POST /api/google-fit/sync                   → manual re-sync (body: {token})
  4. GET  /api/google-fit/status?token=          → connection status
"""

import base64
import json
import os
import time
from datetime import datetime, timezone
from typing import Any
from urllib.parse import urlencode

import httpx
from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import RedirectResponse
from pydantic import BaseModel
from sqlalchemy import text

from backend.app import db

router = APIRouter(prefix="/api/google-fit", tags=["google-fit"])

CLIENT_ID     = os.environ["GOOGLE_CLIENT_ID"]
CLIENT_SECRET = os.environ["GOOGLE_CLIENT_SECRET"]
REDIRECT_URI  = os.environ.get("GOOGLE_REDIRECT_URI", "http://localhost:8000/api/google-fit/callback")
APP_URL       = os.environ.get("APP_URL",              "http://localhost:5173")

SCOPES = " ".join([
    "https://www.googleapis.com/auth/fitness.activity.read",
    "https://www.googleapis.com/auth/fitness.sleep.read",
    "https://www.googleapis.com/auth/fitness.heart_rate.read",
    "https://www.googleapis.com/auth/fitness.body.read",
])

GOOGLE_AUTH_URL  = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_FIT_URL   = "https://fitness.googleapis.com/fitness/v1/users/me/dataset:aggregate"


# ── Helpers ──────────────────────────────────────────────────────────

def encode_state(user_id: int) -> str:
    payload = json.dumps({"uid": user_id, "ts": int(time.time())})
    return base64.urlsafe_b64encode(payload.encode()).decode()

def decode_state(state: str) -> dict:
    payload = base64.urlsafe_b64decode(state.encode() + b"==").decode()
    return json.loads(payload)

def user_by_token(token: str, engine) -> dict:
    with engine.connect() as conn:
        row = conn.execute(
            text("SELECT id, username FROM profiles WHERE token = :t LIMIT 1"),
            {"t": token}
        ).mappings().first()
    if not row:
        raise HTTPException(status_code=401, detail="Invalid token.")
    return dict(row)

async def exchange_code(code: str) -> dict:
    async with httpx.AsyncClient() as client:
        r = await client.post(GOOGLE_TOKEN_URL, data={
            "code":          code,
            "client_id":     CLIENT_ID,
            "client_secret": CLIENT_SECRET,
            "redirect_uri":  REDIRECT_URI,
            "grant_type":    "authorization_code",
        })
    r.raise_for_status()
    return r.json()

async def refresh_access_token(refresh_token: str) -> dict:
    async with httpx.AsyncClient() as client:
        r = await client.post(GOOGLE_TOKEN_URL, data={
            "refresh_token": refresh_token,
            "client_id":     CLIENT_ID,
            "client_secret": CLIENT_SECRET,
            "grant_type":    "refresh_token",
        })
    r.raise_for_status()
    return r.json()

def store_tokens(user_id: int, token_data: dict, engine) -> None:
    expires_at = datetime.fromtimestamp(
        time.time() + token_data.get("expires_in", 3600), tz=timezone.utc
    )
    with engine.begin() as conn:
        conn.execute(text("""
            INSERT INTO google_fit_tokens (user_id, access_token, refresh_token, expires_at, scopes, updated_at)
            VALUES (:uid, :at, :rt, :exp, :sc, NOW())
            ON CONFLICT (user_id) DO UPDATE SET
              access_token = EXCLUDED.access_token,
              refresh_token = COALESCE(EXCLUDED.refresh_token, google_fit_tokens.refresh_token),
              expires_at   = EXCLUDED.expires_at,
              scopes       = EXCLUDED.scopes,
              updated_at   = NOW()
        """), {
            "uid": user_id,
            "at":  token_data["access_token"],
            "rt":  token_data.get("refresh_token"),
            "exp": expires_at,
            "sc":  token_data.get("scope"),
        })

def get_stored_tokens(user_id: int, engine) -> dict | None:
    with engine.connect() as conn:
        row = conn.execute(
            text("SELECT * FROM google_fit_tokens WHERE user_id = :uid LIMIT 1"),
            {"uid": user_id}
        ).mappings().first()
    return dict(row) if row else None

async def get_valid_access_token(user_id: int, engine) -> str:
    tokens = get_stored_tokens(user_id, engine)
    if not tokens:
        raise HTTPException(status_code=400, detail="Google Fit not connected.")
    if tokens["expires_at"].replace(tzinfo=timezone.utc) < datetime.now(tz=timezone.utc):
        refreshed = await refresh_access_token(tokens["refresh_token"])
        store_tokens(user_id, refreshed, engine)
        return refreshed["access_token"]
    return tokens["access_token"]


# ── Google Fit data fetch ─────────────────────────────────────────────

def ms_range_30_days() -> tuple[int, int]:
    now_ms  = int(time.time() * 1000)
    ago_ms  = now_ms - 30 * 24 * 3600 * 1000
    return ago_ms, now_ms

async def fetch_fit_data(access_token: str, data_type: str) -> list[dict]:
    start_ms, end_ms = ms_range_30_days()
    body = {
        "aggregateBy":   [{"dataTypeName": data_type}],
        "bucketByTime":  {"durationMillis": 86400000},
        "startTimeMillis": str(start_ms),
        "endTimeMillis":   str(end_ms),
    }
    async with httpx.AsyncClient() as client:
        r = await client.post(
            GOOGLE_FIT_URL,
            json=body,
            headers={"Authorization": f"Bearer {access_token}"},
        )
    if r.status_code != 200:
        return []
    return r.json().get("bucket", [])

def bucket_date(bucket: dict) -> str:
    ms = int(bucket["startTimeMillis"])
    return datetime.fromtimestamp(ms / 1000, tz=timezone.utc).strftime("%Y-%m-%d")

def bucket_steps(bucket: dict) -> int:
    total = 0
    for ds in bucket.get("dataset", []):
        for pt in ds.get("point", []):
            for v in pt.get("value", []):
                total += v.get("intVal", 0)
    return total

def bucket_sleep(bucket: dict) -> dict[str, int]:
    # Google Fit sleep values: 1=awake,2=asleep,3=outOfBed,4=light,5=deep,6=rem
    minutes: dict[str, int] = {"total": 0, "rem": 0, "deep": 0, "light": 0, "awake": 0}
    for ds in bucket.get("dataset", []):
        for pt in ds.get("point", []):
            start_ns = int(pt.get("startTimeNanos", 0))
            end_ns   = int(pt.get("endTimeNanos", 0))
            dur_min  = (end_ns - start_ns) // 60_000_000_000
            val      = pt.get("value", [{}])[0].get("intVal", 2)
            if val in (2, 4):   minutes["light"] += dur_min; minutes["total"] += dur_min
            elif val == 5:      minutes["deep"]  += dur_min; minutes["total"] += dur_min
            elif val == 6:      minutes["rem"]   += dur_min; minutes["total"] += dur_min
            elif val == 1:      minutes["awake"] += dur_min
    return minutes

def bucket_hr(bucket: dict) -> float | None:
    vals = []
    for ds in bucket.get("dataset", []):
        for pt in ds.get("point", []):
            for v in pt.get("value", []):
                fv = v.get("fpVal")
                if fv:
                    vals.append(fv)
    return round(sum(vals) / len(vals), 1) if vals else None


# ── Sync logic ────────────────────────────────────────────────────────

async def sync_user(user_id: int, engine) -> dict[str, int]:
    access_token = await get_valid_access_token(user_id, engine)

    steps_buckets, sleep_buckets, hr_buckets = await asyncio.gather(
        fetch_fit_data(access_token, "com.google.step_count.delta"),
        fetch_fit_data(access_token, "com.google.sleep.segment"),
        fetch_fit_data(access_token, "com.google.heart_rate.bpm"),
    )

    steps_written = sleep_written = 0

    with engine.begin() as conn:
        for b in steps_buckets:
            total = bucket_steps(b)
            if total <= 0:
                continue
            date = bucket_date(b)
            conn.execute(text("""
                INSERT INTO steps (user_id, timestamp, total)
                VALUES (:uid, :ts::timestamptz, :total)
                ON CONFLICT DO NOTHING
            """), {"uid": user_id, "ts": f"{date}T12:00:00+00:00", "total": total})
            steps_written += 1

        for b in sleep_buckets:
            mins = bucket_sleep(b)
            if mins["total"] <= 30:
                continue
            date = bucket_date(b)
            conn.execute(text("""
                INSERT INTO sleep
                  (user_id, night_of, duration_min, rem_minutes, deep_minutes,
                   core_minutes, awake_minutes, status, session_type, source)
                VALUES
                  (:uid, :date, :dur, :rem, :deep, :core, :awake, 'final', 'night', 'google_fit')
                ON CONFLICT (user_id, night_of) DO UPDATE SET
                  duration_min  = EXCLUDED.duration_min,
                  rem_minutes   = EXCLUDED.rem_minutes,
                  deep_minutes  = EXCLUDED.deep_minutes,
                  core_minutes  = EXCLUDED.core_minutes,
                  awake_minutes = EXCLUDED.awake_minutes,
                  source        = 'google_fit'
            """), {
                "uid":   user_id, "date": date,
                "dur":   mins["total"], "rem":  mins["rem"],
                "deep":  mins["deep"],  "core": mins["light"],
                "awake": mins["awake"],
            })
            sleep_written += 1

        conn.execute(text(
            "UPDATE google_fit_tokens SET last_sync_at = NOW() WHERE user_id = :uid"
        ), {"uid": user_id})

    return {"steps_days": steps_written, "sleep_nights": sleep_written}


# ── Routes ────────────────────────────────────────────────────────────

@router.get("/auth")
def google_auth(token: str):
    """Redirect user to Google OAuth consent screen."""
    engine = db.get_engine()
    user   = user_by_token(token, engine)
    state  = encode_state(user["id"])
    params = urlencode({
        "client_id":     CLIENT_ID,
        "redirect_uri":  REDIRECT_URI,
        "response_type": "code",
        "scope":         SCOPES,
        "access_type":   "offline",
        "prompt":        "consent",
        "state":         state,
    })
    return RedirectResponse(f"{GOOGLE_AUTH_URL}?{params}")


@router.get("/callback")
async def google_callback(code: str = "", state: str = "", error: str = ""):
    """Google redirects here after the user grants permission."""
    if error:
        return RedirectResponse(f"{APP_URL}/feed?gfit=error&msg={error}")
    try:
        payload = decode_state(state)
        user_id = payload["uid"]
    except Exception:
        return RedirectResponse(f"{APP_URL}/feed?gfit=error&msg=bad_state")

    engine = db.get_engine()
    token_data = await exchange_code(code)
    store_tokens(user_id, token_data, engine)

    import asyncio
    result = await sync_user(user_id, engine)
    return RedirectResponse(
        f"{APP_URL}/feed?gfit=connected&steps={result['steps_days']}&sleep={result['sleep_nights']}"
    )


class SyncRequest(BaseModel):
    token: str

@router.post("/sync")
async def google_sync(body: SyncRequest):
    """Manually re-sync the last 30 days from Google Fit."""
    engine = db.get_engine()
    user   = user_by_token(body.token, engine)
    import asyncio
    result = await sync_user(user["id"], engine)
    return {"ok": True, **result}


@router.get("/status")
def google_status(token: str):
    """Check if a user has Google Fit connected."""
    engine = db.get_engine()
    user   = user_by_token(token, engine)
    stored = get_stored_tokens(user["id"], engine)
    if not stored:
        return {"connected": False}
    return {
        "connected":    True,
        "last_sync_at": stored.get("last_sync_at"),
        "scopes":       stored.get("scopes"),
    }
