import React from 'react';

/* ── Design tokens (consistent with app) ── */
const T = {
  bg: '#F8F7F5',
  surface: '#FFFFFF',
  surfaceWarm: '#FAF8F5',
  border: '#EDE8E1',
  borderStrong: '#E0D9CF',
  ink: '#1A1918',
  body: '#6B6158',
  muted: '#8C8278',
  accent: '#82694E',
};

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
  shimmer?: boolean;
}

/**
 * Base skeleton block with a smooth shimmer animation.
 * Uses warm neutral tones that match the app palette.
 */
export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  variant = 'rounded',
  shimmer = true,
  ...props
}) => {
  const variantStyles = {
    text: 'h-3.5 w-full rounded-md',
    circular: 'rounded-full',
    rectangular: 'rounded-none',
    rounded: 'rounded-xl'
  };

  return (
    <div
      className={`relative overflow-hidden ${variantStyles[variant]} ${className}`}
      style={{ backgroundColor: T.border }}
      {...props}
    >
      {shimmer && (
        <div
          className="absolute inset-0 skeleton-shimmer"
          style={{
            background: `linear-gradient(90deg, transparent 0%, ${T.surfaceWarm}80 50%, transparent 100%)`,
            backgroundSize: '200% 100%',
          }}
        />
      )}
    </div>
  );
};

/**
 * KPI card skeleton — matches the dashboard KPI card layout.
 */
export const MetricsSkeleton: React.FC = () => {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {[1, 2, 3, 4].map(i => (
        <div
          key={i}
          className="p-3.5 rounded-xl border"
          style={{ backgroundColor: T.surface, borderColor: T.border }}
        >
          <div className="flex items-center gap-2.5">
            <Skeleton variant="rounded" className="w-8 h-8 shrink-0" />
            <div className="space-y-1.5 flex-1">
              <Skeleton variant="text" className="w-16" />
              <Skeleton variant="text" className="w-20 h-5" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

/**
 * Table skeleton — matches the clients/invoices table layout.
 */
export const TableSkeleton: React.FC<{ rows?: number; cols?: number }> = ({
  rows = 5,
}) => {
  return (
    <div
      className="rounded-xl border overflow-hidden"
      style={{ backgroundColor: T.surface, borderColor: T.border }}
    >
      {/* Header */}
      <div
        className="px-5 py-3 border-b flex items-center justify-between"
        style={{ backgroundColor: T.surfaceWarm, borderColor: T.border }}
      >
        <Skeleton variant="text" className="w-28 h-3" />
        <Skeleton variant="text" className="w-16 h-3" />
      </div>

      {/* Rows */}
      <div>
        {Array.from({ length: rows }).map((_, rIdx) => (
          <div
            key={rIdx}
            className="px-5 py-3 flex items-center justify-between gap-4 border-b last:border-0"
            style={{ borderColor: `${T.border}80` }}
          >
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <Skeleton variant="circular" className="w-8 h-8 shrink-0" />
              <div className="space-y-1.5 flex-1 min-w-0">
                <Skeleton variant="text" className="w-3/5 max-w-[180px]" />
                <Skeleton variant="text" className="w-2/5 max-w-[120px] h-2.5" />
              </div>
            </div>

            <div className="hidden sm:flex items-center gap-4">
              <Skeleton variant="text" className="w-16 h-3" />
              <Skeleton variant="rounded" className="w-14 h-5" />
            </div>

            <Skeleton variant="rounded" className="w-14 h-7 shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Card skeleton — generic card with header and content lines.
 */
export const CardSkeleton: React.FC<{ lines?: number }> = ({ lines = 4 }) => {
  return (
    <div
      className="p-5 rounded-xl border space-y-4"
      style={{ backgroundColor: T.surface, borderColor: T.border }}
    >
      <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: T.border }}>
        <Skeleton variant="text" className="w-32 h-4" />
        <Skeleton variant="text" className="w-14 h-3" />
      </div>
      <div className="space-y-2.5">
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton
            key={i}
            variant="text"
            className={`${i % 3 === 0 ? 'w-full' : i % 3 === 1 ? 'w-4/5' : 'w-3/5'}`}
          />
        ))}
      </div>
    </div>
  );
};

/**
 * Dashboard skeleton — full-page skeleton matching the dashboard layout exactly.
 */
export const DashboardSkeleton: React.FC = () => {
  return (
    <div className="space-y-5 max-w-7xl mx-auto animate-pulse">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-2">
          <Skeleton variant="text" className="w-20 h-2" />
          <Skeleton variant="text" className="w-48 h-6" />
          <Skeleton variant="text" className="w-56 h-3" />
        </div>
        <Skeleton variant="rounded" className="w-24 h-8" />
      </div>

      {/* KPI row */}
      <MetricsSkeleton />

      {/* Chart + sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div
          className="lg:col-span-2 rounded-xl border p-5"
          style={{ backgroundColor: T.surface, borderColor: T.border }}
        >
          <Skeleton variant="text" className="w-28 h-3 mb-4" />
          <div className="flex items-end gap-2 h-40">
            {[40, 60, 50, 75, 55, 80].map((h, i) => (
              <Skeleton
                key={i}
                variant="rounded"
                className="flex-1"
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
        </div>
        <div
          className="rounded-xl border p-4"
          style={{ backgroundColor: T.surface, borderColor: T.border }}
        >
          <Skeleton variant="text" className="w-20 h-3 mb-4" />
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton variant="rounded" className="w-7 h-7 shrink-0" />
                <Skeleton variant="text" className="flex-1 h-3" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map(i => (
          <div
            key={i}
            className="rounded-xl border p-4"
            style={{ backgroundColor: T.surface, borderColor: T.border }}
          >
            <Skeleton variant="text" className="w-16 h-3 mb-4" />
            <div className="space-y-3">
              {[1, 2, 3].map(j => (
                <div key={j} className="flex items-center gap-2.5">
                  <Skeleton variant="circular" className="w-4 h-4 shrink-0" />
                  <Skeleton variant="text" className="flex-1 h-3" />
                  <Skeleton variant="text" className="w-10 h-2" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Client page skeleton — matches the client list layout.
 */
export const ClientListSkeleton: React.FC = () => {
  return (
    <div className="space-y-4">
      {/* Header + search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1.5">
          <Skeleton variant="text" className="w-24 h-2" />
          <Skeleton variant="text" className="w-36 h-6" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton variant="rounded" className="w-48 h-8" />
          <Skeleton variant="rounded" className="w-24 h-8" />
        </div>
      </div>

      {/* Table */}
      <TableSkeleton rows={6} />
    </div>
  );
};
