import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type Props = {
  className?: string;
  children: ReactNode;
};

export function Card({ className, children }: Props) {
  return (
    <div className={cn('surface-glass rounded-2xl p-5', className)}>{children}</div>
  );
}

export default Card;
