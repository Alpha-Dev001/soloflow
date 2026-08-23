import React, { forwardRef } from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: React.ReactNode;
  rightElement?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({
  label,
  error,
  helperText,
  icon,
  rightElement,
  className = '',
  id,
  disabled,
  ...props
}, ref) => {
  const inputId = id || (label ? `input-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);

  return (
    <div className="w-full space-y-1.5 text-left">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-xs font-semibold text-[#4A3E34] uppercase tracking-wider select-none"
        >
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {icon && (
          <div className="absolute left-3.5 text-[#9C9084] pointer-events-none flex items-center">
            {icon}
          </div>
        )}
        <input
          ref={ref}
          id={inputId}
          disabled={disabled}
          className={`w-full bg-[#FAF8F5] text-sm text-[#1A1918] placeholder-[#9C9084] py-2.5 rounded-xl border transition-all duration-150 focus:bg-white focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed ${
            icon ? 'pl-10' : 'pl-3.5'
          } ${
            rightElement ? 'pr-10' : 'pr-3.5'
          } ${
            error
              ? 'border-[#FDA29B] focus:border-[#D92D20] focus:ring-2 focus:ring-[#D92D20]/10 bg-[#FFFBFB]'
              : 'border-[#E5DFD7] focus:border-[#4A3B32] focus:ring-2 focus:ring-[#4A3B32]/10'
          } ${className}`}
          {...props}
        />
        {rightElement && (
          <div className="absolute right-3.5 flex items-center text-[#9C9084]">
            {rightElement}
          </div>
        )}
      </div>
      {error && (
        <p className="text-xs text-[#D92D20] font-medium mt-1">{error}</p>
      )}
      {helperText && !error && (
        <p className="text-xs text-[#7A6E63] mt-1">{helperText}</p>
      )}
    </div>
  );
});

Input.displayName = 'Input';
