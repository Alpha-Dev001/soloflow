import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'danger-solid' | 'dark-brown';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
  isIconOnly?: boolean;
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  iconRight,
  isIconOnly = false,
  isLoading = false,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-medium tracking-tight select-none transition-all duration-150 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8B7355]/30 focus-visible:ring-offset-1 focus-visible:ring-offset-[#F4F0EA] disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none whitespace-nowrap cursor-pointer';

  const sizeStyles = {
    xs: isIconOnly
      ? 'w-6 h-6 p-0 rounded-md text-[11px]'
      : 'h-7 px-2 text-[11px] rounded-md gap-1 font-medium',
    sm: isIconOnly
      ? 'w-7 h-7 p-0 rounded-lg text-xs'
      : 'h-8 px-2.5 text-xs rounded-lg gap-1.5 font-medium',
    md: isIconOnly
      ? 'w-9 h-9 p-0 rounded-lg text-sm'
      : 'h-9 px-4 text-xs sm:text-[13px] rounded-lg gap-2 font-medium',
    lg: isIconOnly
      ? 'w-11 h-11 p-0 rounded-xl text-base'
      : 'h-11 px-5 text-sm rounded-xl gap-2.5 font-medium'
  };

  const variantStyles = {
    primary: 'btn-apple-primary',
    'dark-brown': 'btn-apple-primary',
    secondary: 'btn-apple-secondary',
    outline: 'btn-apple-outline',
    ghost: 'btn-apple-ghost',
    danger: 'btn-apple-danger',
    'danger-solid': 'btn-apple-danger-solid'
  };

  return (
    <button
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <svg
          className="animate-spin h-3.5 w-3.5 text-current shrink-0"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="3"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      ) : icon ? (
        <span className="shrink-0 flex items-center justify-center pointer-events-none">{icon}</span>
      ) : null}

      {children && <span className="truncate flex items-center">{children}</span>}

      {iconRight && !isLoading && (
        <span className="shrink-0 flex items-center justify-center pointer-events-none">{iconRight}</span>
      )}
    </button>
  );
};
