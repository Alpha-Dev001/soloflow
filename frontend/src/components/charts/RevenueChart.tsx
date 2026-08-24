import React from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

/* ── Design tokens (matched to dashboard) ── */
const T = {
  bg: '#F8F7F5',
  surface: '#FFFFFF',
  border: '#EDE8E1',
  borderStrong: '#E0D9CF',
  hairline: 'rgba(74,59,50,0.32)',
  ink: '#1A1918',
  body: '#4A4037',
  muted: '#6B6158',
  accent: '#82694E',
  accentSoft: '#B39C82',
  dark: '#453B33',
  success: '#1E7D3F',
  warning: '#B4552F',
  info: '#2E5B8A'
};

const COLORS = [T.accent, T.success, T.warning, T.info, T.accentSoft];

interface RevenueDataPoint {
  month: string;
  amount: number;
  target?: number;
}

interface RevenueChartProps {
  data: RevenueDataPoint[];
  currency?: string;
  height?: number;
  showTarget?: boolean;
}

export const RevenueChart: React.FC<RevenueChartProps> = ({
  data,
  currency = '$',
  height = 320,
  showTarget = false
}) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 rounded-xl border border-dashed" style={{ borderColor: T.borderStrong, backgroundColor: T.bg }}>
        <div className="w-12 h-12 rounded-full flex items-center justify-center mb-3" style={{ backgroundColor: T.border }}>
          <svg className="w-6 h-6" style={{ color: T.borderStrong }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <p className="text-sm font-semibold mb-1" style={{ color: T.ink }}>No revenue data yet</p>
        <p className="text-xs" style={{ color: T.muted }}>Record paid invoices to see your chart</p>
      </div>
    );
  }

  const maxValue = Math.max(...data.map(d => d.amount), 1);
  const formatCurrency = (value: number) => {
    if (value >= 1000) {
      return `${currency}${(value / 1000).toFixed(1)}k`;
    }
    return `${currency}${value}`;
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-lg shadow-lg px-3 py-2 border" style={{ backgroundColor: T.surface, borderColor: T.borderStrong }}>
          <p className="text-xs font-semibold mb-1" style={{ color: T.muted }}>{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm font-bold" style={{ color: entry.color }}>
              {entry.name}: {formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={T.accent} stopOpacity={0.3}/>
            <stop offset="95%" stopColor={T.accent} stopOpacity={0}/>
          </linearGradient>
          {showTarget && (
            <linearGradient id="colorTarget" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={T.success} stopOpacity={0.2}/>
              <stop offset="95%" stopColor={T.success} stopOpacity={0}/>
            </linearGradient>
          )}
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={T.border} />
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
          tickFormatter={formatCurrency}
          width={45}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend 
          wrapperStyle={{ fontSize: '11px', color: T.muted }}
          iconType="circle"
        />
        <Area 
          type="monotone" 
          dataKey="amount" 
          name="Revenue"
          stroke={T.accent} 
          strokeWidth={2.5}
          fillOpacity={1} 
          fill="url(#colorRevenue)"
        />
        {showTarget && (
          <Area 
            type="monotone" 
            dataKey="target" 
            name="Target"
            stroke={T.success} 
            strokeWidth={2}
            strokeDasharray="5 5"
            fillOpacity={1} 
            fill="url(#colorTarget)"
          />
        )}
      </AreaChart>
    </ResponsiveContainer>
  );
};

interface ProjectStatusData {
  name: string;
  value: number;
  color: string;
}

interface ProjectStatusChartProps {
  data: ProjectStatusData[];
  size?: number;
}

export const ProjectStatusChart: React.FC<ProjectStatusChartProps> = ({
  data,
  size = 200
}) => {
  if (!data || data.length === 0 || data.every(d => d.value === 0)) {
    return (
      <div className="flex flex-col items-center justify-center h-48 rounded-xl border border-dashed" style={{ borderColor: T.borderStrong, backgroundColor: T.bg }}>
        <div className="w-10 h-10 rounded-full flex items-center justify-center mb-2" style={{ backgroundColor: T.border }}>
          <svg className="w-5 h-5" style={{ color: T.borderStrong }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
        <p className="text-xs font-semibold" style={{ color: T.ink }}>No projects yet</p>
      </div>
    );
  }

  const RADIAN = Math.PI / 180;
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return percent > 0.05 ? (
      <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize={11} fontWeight="bold">
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    ) : null;
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-lg shadow-lg px-3 py-2 border" style={{ backgroundColor: T.surface, borderColor: T.borderStrong }}>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm font-semibold" style={{ color: entry.payload.color }}>
              {entry.name}: {entry.value} projects
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex items-center justify-center">
      <ResponsiveContainer width={size} height={size}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderCustomizedLabel}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

interface ClientRevenueData {
  name: string;
  revenue: number;
  projects: number;
}

interface TopClientsChartProps {
  data: ClientRevenueData[];
  currency?: string;
  height?: number;
}

export const TopClientsChart: React.FC<TopClientsChartProps> = ({
  data,
  currency = '$',
  height = 280
}) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 rounded-xl border border-dashed" style={{ borderColor: T.borderStrong, backgroundColor: T.bg }}>
        <div className="w-10 h-10 rounded-full flex items-center justify-center mb-2" style={{ backgroundColor: T.border }}>
          <svg className="w-5 h-5" style={{ color: T.borderStrong }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </div>
        <p className="text-xs font-semibold" style={{ color: T.ink }}>No clients yet</p>
      </div>
    );
  }

  const formatCurrency = (value: number) => {
    if (value >= 1000) {
      return `${currency}${(value / 1000).toFixed(1)}k`;
    }
    return `${currency}${value}`;
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const dataPoint = data.find(d => d.name === label);
      return (
        <div className="rounded-lg shadow-lg px-3 py-2 border" style={{ backgroundColor: T.surface, borderColor: T.borderStrong }}>
          <p className="text-xs font-semibold mb-1" style={{ color: T.ink }}>{label}</p>
          <p className="text-sm font-bold" style={{ color: T.accent }}>
            Revenue: {formatCurrency(payload[0].value)}
          </p>
          {dataPoint && (
            <p className="text-xs" style={{ color: T.muted }}>
              Projects: {dataPoint.projects}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={T.border} />
        <XAxis 
          dataKey="name" 
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 10, fill: T.muted }}
          angle={-45}
          textAnchor="end"
          height={60}
          dy={10}
        />
        <YAxis 
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 11, fill: T.muted }}
          tickFormatter={formatCurrency}
          width={45}
        />
        <Tooltip content={<CustomTooltip />} />
        <Bar 
          dataKey="revenue" 
          name="Revenue"
          fill={T.accent}
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
};

interface MonthlyComparisonData {
  month: string;
  current: number;
  previous: number;
}

interface MonthlyComparisonChartProps {
  data: MonthlyComparisonData[];
  currency?: string;
  height?: number;
}

export const MonthlyComparisonChart: React.FC<MonthlyComparisonChartProps> = ({
  data,
  currency = '$',
  height = 280
}) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 rounded-xl border border-dashed" style={{ borderColor: T.borderStrong, backgroundColor: T.bg }}>
        <p className="text-xs font-semibold" style={{ color: T.ink }}>No comparison data</p>
      </div>
    );
  }

  const formatCurrency = (value: number) => {
    if (value >= 1000) {
      return `${currency}${(value / 1000).toFixed(1)}k`;
    }
    return `${currency}${value}`;
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-lg shadow-lg px-3 py-2 border" style={{ backgroundColor: T.surface, borderColor: T.borderStrong }}>
          <p className="text-xs font-semibold mb-2" style={{ color: T.muted }}>{label}</p>
          {payload.map((entry: any) => (
            <p key={entry.name} className="text-sm font-bold" style={{ color: entry.color }}>
              {entry.name}: {formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={T.border} />
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
          tickFormatter={formatCurrency}
          width={45}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend 
          wrapperStyle={{ fontSize: '11px', color: T.muted }}
          iconType="circle"
        />
        <Line 
          type="monotone" 
          dataKey="current" 
          name="Current Period"
          stroke={T.accent} 
          strokeWidth={2.5}
          dot={{ fill: T.accent, r: 4 }}
          activeDot={{ r: 6 }}
        />
        <Line 
          type="monotone" 
          dataKey="previous" 
          name="Previous Period"
          stroke={T.muted} 
          strokeWidth={2}
          strokeDasharray="5 5"
          dot={{ fill: T.muted, r: 4 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};
