import React from 'react';
import { cn } from '../../lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, icon, type, ...props }, ref) => {
    return (
      <div className="relative flex items-center w-full">
        {icon && <div className="absolute left-3 text-[#8B98A9] pointer-events-none">{icon}</div>}
        <input
          type={type}
          ref={ref}
          className={cn(
            'w-full bg-[#0B0F14] border border-[#243041] rounded-lg px-3 py-2 text-sm text-[#E6EDF3] placeholder-[#8B98A9] focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 transition-colors',
            icon && 'pl-9',
            className
          )}
          {...props}
        />
      </div>
    );
  }
);
Input.displayName = 'Input';
