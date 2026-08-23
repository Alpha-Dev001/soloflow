import React from 'react';

export interface AvatarProps {
  name?: string;
  src?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
  name = 'User',
  src,
  size = 'md',
  className = ''
}) => {
  const sizeStyles = {
    sm: 'w-7 h-7 text-xs',
    md: 'w-9 h-9 text-sm',
    lg: 'w-11 h-11 text-base',
    xl: 'w-14 h-14 text-lg'
  };

  const initial = (name.trim().charAt(0) || 'U').toUpperCase();

  // Subtle earthy palette for client initial avatars
  const charCode = (name.charCodeAt(0) || 0) % 5;
  const bgColors = [
    'bg-[#5C4A3E] text-[#FBF9F6]',
    'bg-[#4A3B32] text-[#FBF9F6]',
    'bg-[#6E5A4D] text-[#FBF9F6]',
    'bg-[#544337] text-[#FBF9F6]',
    'bg-[#635043] text-[#FBF9F6]'
  ];
  const colorClass = bgColors[charCode];

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={`rounded-full object-cover shrink-0 ${sizeStyles[size]} ${className}`}
        referrerPolicy="no-referrer"
      />
    );
  }

  return (
    <div
      className={`rounded-full flex items-center justify-center font-semibold shrink-0 select-none shadow-xs ${sizeStyles[size]} ${colorClass} ${className}`}
    >
      {initial}
    </div>
  );
};
