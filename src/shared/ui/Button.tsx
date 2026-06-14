import type { ButtonHTMLAttributes, ReactNode } from 'react';
import clsx from 'clsx';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'danger';
};

export function Button({ children, className, variant = 'primary', ...props }: ButtonProps) {
  return (
    <button
      className={clsx(
        'inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium focus:ring-2 focus:ring-neutral-950 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50',
        variant === 'primary' && 'bg-neutral-950 text-white hover:bg-neutral-800',
        variant === 'secondary' && 'border border-neutral-300 bg-white text-neutral-900 hover:bg-neutral-100',
        variant === 'danger' && 'border border-red-600 bg-white text-red-600 hover:bg-red-50',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
