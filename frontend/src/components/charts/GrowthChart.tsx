import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

const T = {
  bg: '#F8F7F5',
  surface: '#FFFFFF',
  border: '#EDE8E1',
  borderStrong: '#E0D9CF',
  ink: '#1A1918',
  body: '#4A4037',
  muted: '#6B6158',
  accent: '#82694E',
  accentSoft: '#B39C82',
  dark: '#453B33',
  success: '#1E7D3F',
  info: '#2E5B8A',
};

interface GrowthDataPoint {
  month: string;
  projects: number;
  clients: number;
  invoices: number;
}

interface GrowthChartProps {
  data: GrowthDataPoint[];
  height?: number;
}

export const GrowthChart: React.FC<GrowthChartProps> = ({
  data,
  height = 220,
}) => {
  const hasNoData = !data || data.length === 0 || data.every(d => d.projects === 0 && d.clients === 0);

  if (hasNoData) {
    return (
      <div
        className="flex flex-col items-center justify-center rounded-xl border border-dashed px-6 py-10 text-center"
        style={{ borderColor: T.borderStrong, backgroundColor: T.bg, minHeight: Math.min(height, 280) }}
      >
        <div className="flex items-end gap-1.5 mb-4" aria-hidden>
          {[28, 44, 36, 58, 46, 68].map((h, i) => (
            <div
              key={i}
              className="w-6 rounded-t-md"
              style={{
                height: h,
                backgroundColor: i === 5 ? 'rgba(130,105,78,0.35)' : 'rgba(179,156,130,0.18)',
              }}
            />
          ))}
        </div>
        <p className="text-sm font-semibold mb-1" style={{ color: T.ink }}>
          Your growth chart starts here
        </p>
        <p className="text-xs max-w-xs leading-relaxed" style={{ color: T.muted }}>
          As you add clients, create projects, and send invoices, your workspace growth builds this chart automatically.
        </p>
      </div>
    );
  }

  const FULL_MONTHS: Record<string, string> = {
    Jan: 'January', Feb: 'February', Mar: 'March', Apr: 'April', May: 'May',
    Jun: 'June', Jul: 'July', Aug: 'August', Sep: 'September', Oct: 'October',
    Nov: 'November', Dec: 'December'
  };

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="gradProjects" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={T.accent} stopOpacity={0.25} />
            <stop offset="95%" stopColor={T.accent} stopOpacity={0.02} />
          </linearGradient>
          <linearGradient id="gradClients" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={T.info} stopOpacity={0.25} />
            <stop offset="95%" stopColor={T.info} stopOpacity={0.02} />
          </linearGradient>
          <linearGradient id="gradInvoices" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={T.success} stopOpacity={0.25} />
            <stop offset="95%" stopColor={T.success} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="4 4" vertical={false} stroke={T.border} />
        <XAxis
          dataKey="month"
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 11, fill: T.muted }}
          dy={10}
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 11, fill: T.muted }}
          allowDecimals={false}
          width={30}
        />
        <Tooltip
          content={({ active, payload, label }: any) => {
            if (active && payload && payload.length) {
              return (
                <div className="rounded-xl shadow-lg px-3.5 py-2.5 border" style={{ backgroundColor: T.surface, borderColor: T.borderStrong }}>
                  <p className="text-[11px] font-semibold mb-1" style={{ color: T.muted }}>{FULL_MONTHS[label] || label}</p>
                  {payload.map((entry: any) => (
                    <p key={entry.name} className="text-xs font-medium" style={{ color: entry.color }}>
                      {entry.name}: {entry.value}
                    </p>
                  ))}
                </div>
              );
            }
            return null;
          }}
        />
        <Legend
          wrapperStyle={{ fontSize: '11px' }}
          iconType="circle"
          iconSize={8}
        />
        <Area
          type="monotone"
          dataKey="clients"
          name="Clients"
          stroke={T.info}
          strokeWidth={2}
          fill="url(#gradClients)"
          dot={{ fill: T.info, r: 3 }}
          activeDot={{ r: 5 }}
        />
        <Area
          type="monotone"
          dataKey="projects"
          name="Projects"
          stroke={T.accent}
          strokeWidth={2.5}
          fill="url(#gradProjects)"
          dot={{ fill: T.accent, r: 3 }}
          activeDot={{ r: 5 }}
        />
        <Area
          type="monotone"
          dataKey="invoices"
          name="Invoices"
          stroke={T.success}
          strokeWidth={2}
          fill="url(#gradInvoices)"
          dot={{ fill: T.success, r: 3 }}
          activeDot={{ r: 5 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};
