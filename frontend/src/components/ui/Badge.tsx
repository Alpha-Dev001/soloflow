import React from 'react';

export interface BadgeProps {
  children: React.ReactNode;
  variant?:
    | 'paid'
    | 'completed'
    | 'active'
    | 'in-progress'
    | 'pending'
    | 'to-do'
    | 'overdue'
    | 'rejected'
    | 'cancelled'
    | 'sent'
    | 'viewed'
    | 'lead'
    | 'draft'
    | 'expired'
    | 'on-hold'
    | 'success'
    | 'primary'
    | 'default';
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  className = ''
}) => {
  const sizeStyles = {
    sm: 'text-[10px] px-1.5 py-0.5 font-medium rounded-md',
    md: 'text-[11px] px-2 py-0.5 font-medium rounded-md'
  };

  const getVariantStyles = (v: string) => {
    const key = v.toLowerCase().replace(/_/g, '-');
    if (['paid', 'completed', 'active', 'accepted', 'success'].includes(key)) {
      return 'bg-[#34C759]/10 text-[#248A3D] border border-[#34C759]/20';
    }
    if (['in-progress', 'in progress', 'pending', 'to-do', 'to do'].includes(key)) {
      return 'bg-[#FF9500]/10 text-[#C97100] border border-[#FF9500]/20';
    }
    if (['overdue', 'rejected', 'cancelled'].includes(key)) {
      return 'bg-[#FF3B30]/10 text-[#D70015] border border-[#FF3B30]/20';
    }
    if (['sent', 'viewed', 'lead', 'primary'].includes(key)) {
      return 'bg-[#0071E3]/10 text-[#0071E3] border border-[#0071E3]/20';
    }
    if (['draft', 'expired', 'on-hold', 'on hold', 'inactive'].includes(key)) {
      return 'bg-[#8E8E93]/10 text-[#636366] border border-[#8E8E93]/20';
    }
    return 'bg-[#8E8E93]/10 text-[#1A1918] border border-[#8E8E93]/20';
  };

  return (
    <span
      className={`inline-flex items-center justify-center tracking-tight whitespace-nowrap select-none ${sizeStyles[size]} ${getVariantStyles(variant)} ${className}`}
    >
      {children}
    </span>
  );
};
