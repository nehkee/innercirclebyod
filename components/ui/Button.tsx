'use client';

import { cn } from '@/lib/utils';
import { forwardRef } from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  href?: string;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ children, className, variant = 'primary', size = 'md', loading, disabled, ...props }, ref) => {
    const base = 'relative inline-flex items-center justify-content gap-2 font-bebas tracking-widest uppercase transition-all duration-300 overflow-hidden group';

    const variants = {
      primary:   'btn-primary',
      secondary: 'btn-secondary',
      ghost:     'border-0 bg-transparent text-ic-gold hover:text-white font-bebas tracking-widest uppercase cursor-none',
      danger:    'border border-ic-red text-ic-red hover:bg-ic-red hover:text-white cursor-none transition-all duration-300 font-bebas tracking-widest uppercase',
    };

    const sizes = {
      sm: 'px-4 py-2 text-sm',
      md: 'px-8 py-3 text-base',
      lg: 'px-12 py-4 text-lg',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(base, variants[variant], sizes[size], className)}
        {...props}
      >
        {loading && (
          <span className="w-4 h-4 border border-current border-t-transparent rounded-full animate-spin" />
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
