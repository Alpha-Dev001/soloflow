import React from 'react';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  variant = 'rounded',
  ...props
}) => {
  const variantStyles = {
    text: 'h-4 w-full rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-none',
    rounded: 'rounded-xl'
  };

  return (
    <div
      className={`animate-pulse bg-[#EFEBE5]/80 bg-gradient-to-r from-[#EFEBE5] via-[#E8E2D9] to-[#EFEBE5] bg-[length:200%_100%] ${variantStyles[variant]} ${className}`}
      {...props}
    />
  );
};

export const MetricsSkeleton: React.FC = () => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="bg-white p-5 rounded-2xl border border-[#ECE7E1] shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-24" />
            <Skeleton variant="circular" className="w-8 h-8" />
          </div>
          <Skeleton className="h-8 w-32" />
          <div className="flex items-center gap-2 pt-1">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
      ))}
    </div>
  );
};

export const TableSkeleton: React.FC<{ rows?: number; cols?: number }> = ({
  rows = 5,
  cols = 5
}) => {
  return (
    <div className="bg-white rounded-2xl border border-[#ECE7E1] shadow-2xs overflow-hidden">
      {/* Header bar skeleton */}
      <div className="bg-[#FAF8F5] px-5 py-3.5 border-b border-[#ECE7E1] flex items-center justify-between">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-20" />
      </div>

      {/* Row skeletons */}
      <div className="divide-y divide-[#F4EFEA]">
        {Array.from({ length: rows }).map((_, rIdx) => (
          <div key={rIdx} className="p-4 sm:px-5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <Skeleton variant="circular" className="w-9 h-9 shrink-0" />
              <div className="space-y-1.5 flex-1 min-w-0">
                <Skeleton className="h-4 w-3/5 max-w-xs" />
                <Skeleton className="h-3 w-2/5 max-w-xxs" />
              </div>
            </div>

            <div className="hidden sm:flex items-center gap-4">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>

            <Skeleton className="h-8 w-16 rounded-lg shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
};

export const CardSkeleton: React.FC<{ lines?: number }> = ({ lines = 4 }) => {
  return (
    <div className="bg-white p-6 rounded-2xl border border-[#ECE7E1] shadow-2xs space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-[#F4EFEA]">
        <Skeleton className="h-5 w-36" />
        <Skeleton className="h-4 w-16" />
      </div>
      <div className="space-y-2.5">
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton key={i} className={`h-4 ${i % 2 === 0 ? 'w-full' : 'w-4/5'}`} />
        ))}
      </div>
    </div>
  );
};
