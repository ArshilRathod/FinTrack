import clsx from 'clsx';
import type { ButtonHTMLAttributes, PropsWithChildren } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

export const Button = ({
  children,
  className = '',
  variant = 'primary',
  size = 'md',
  ...props
}: PropsWithChildren<ButtonProps>) => (
  <button
    className={clsx(
      'rounded-2xl font-semibold transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 flex items-center justify-center gap-2',
      {
        'bg-slate-950 text-white shadow-soft hover:bg-slate-900 dark:bg-accent dark:hover:bg-accent/90': variant === 'primary',
        'border border-slate-200 bg-white text-slate-950 hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10': variant === 'outline',
        'text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-white': variant === 'ghost',
        'bg-red-500 text-white shadow-soft hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700': variant === 'danger',
        'px-3 py-1.5 text-xs': size === 'sm',
        'px-4 py-2.5 text-sm sm:px-5 sm:py-3': size === 'md',
        'px-5 py-3.5 text-base sm:px-7 sm:py-4': size === 'lg',
      },
      className
    )}
    {...props}
  >
    {children}
  </button>
);
