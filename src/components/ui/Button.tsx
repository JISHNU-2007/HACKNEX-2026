import React from 'react';
import { cn } from '../../lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'icon';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled}
        className={cn(
          'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-teal-500/50 disabled:opacity-50 disabled:cursor-not-allowed select-none',
          // Variants
          variant === 'primary' && 'bg-teal-600 hover:bg-teal-500 active:bg-teal-700 text-white shadow-sm shadow-teal-900/30 border border-teal-500/30',
          variant === 'secondary' && 'bg-[#18202B] hover:bg-[#243041] active:bg-[#121821] text-[#E6EDF3] border border-[#243041]',
          variant === 'outline' && 'bg-transparent hover:bg-[#18202B] text-[#E6EDF3] border border-[#243041]',
          variant === 'ghost' && 'bg-transparent hover:bg-[#18202B] text-[#8B98A9] hover:text-[#E6EDF3]',
          variant === 'danger' && 'bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/30',
          // Sizes
          size === 'sm' && 'h-8 px-3 text-xs gap-1.5',
          size === 'md' && 'h-9 px-4 text-sm gap-2',
          size === 'lg' && 'h-11 px-6 text-base gap-2.5',
          size === 'icon' && 'h-8 w-8 p-0 text-sm',
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';
