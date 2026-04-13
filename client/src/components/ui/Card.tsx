import clsx from 'clsx';
import type { HTMLAttributes } from 'react';

export const Card = ({ children, className = '', ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div
    {...props}
    className={clsx(
      'min-w-0 rounded-[22px] border border-white/70 bg-white/92 p-4 shadow-panel backdrop-blur sm:rounded-[26px] sm:p-6 dark:border-slate-700/70 dark:bg-slate-900/70 dark:shadow-[0_18px_50px_rgba(2,8,23,0.38)]',
      className
    )}
  >
    {children}
  </div>
);
