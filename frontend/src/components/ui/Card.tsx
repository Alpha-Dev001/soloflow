import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  padding = 'md',
  ...props
}) => {
  const paddingStyles = {
    none: '',
    sm: 'p-3.5',
    md: 'p-4 sm:p-5',
    lg: 'p-5 sm:p-6'
  };

  return (
    <div
      className={`relative overflow-hidden texture-light bg-white rounded-xl sm:rounded-2xl border border-[#E0D9CF] shadow-[0_1px_2px_rgba(74,59,50,0.04)] transition-all duration-150 ${paddingStyles[padding]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
