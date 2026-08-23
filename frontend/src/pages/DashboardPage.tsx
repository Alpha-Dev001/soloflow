import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Plus,
  ChevronDown,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Calendar as CalendarIcon,
  FileText,
  Receipt,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Send,
  Eye,
  Sparkles,
  FolderKanban,
  Users
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import type { DashboardMetrics, User, Invoice, Project, Proposal } from '../types';
import type { NavPage } from '../components/layout/Sidebar';

interface DashboardPageProps {
  metrics: DashboardMetrics;
  user: User | null;
  invoices: Invoice[];
  projects: Project[];
  proposals: Proposal[];
  onNavigate: (page: NavPage, param?: string) => void;
  onOpenQuickCreate?: (type: 'client' | 'project' | 'proposal' | 'invoice') => void;
}

/* ── Design tokens (matched to landing & auth pages) ── */
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
  dark: '#453B33'
};

const currencySymbols: Record<string, string> = {
  USD: '$', EUR: '€', GBP: '£', RWF: 'RF ', KES: 'KSh ', NGN: '₦', CAD: 'C$', AUD: 'A$'
};

export const DashboardPage: React.FC<DashboardPageProps> = ({
  metrics,
  user,
  invoices,
  projects,
  proposals,
  onNavigate,
  onOpenQuickCreate
}) => {
  const [showNewMenu, setShowNewMenu] = useState(false);
  const [menuPos, setMenuPos] = useState({ top: 0, right: 0 });
  const newBtnRef = useRef<HTMLDivElement>(null);
  const [timePeriod, setTimePeriod] = useState<'30D' | '90D' | '6M' | '1Y'>('90D');

  // Greeting adapts to the visitor's local time of day
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);

  // Onboarding answers personalize the dashboard
  const onboarding = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('soloflow_onboarding') || 'null');
    } catch {
      return null;
    }
  }, []);

  const cur = currencySymbols[onboarding?.currency || user?.currency || 'USD'] || '$';

  // ── Derived actionable data ──
  const overdueInvoices = useMemo(
    () => invoices.filter(i => i.status === 'Overdue'),
    [invoices]
  );

  const pendingInvoices = useMemo(
    () => invoices.filter(i => i.status === 'Pending' || i.status === 'Sent'),
    [invoices]
  );

  const awaitingProposals = useMemo(
    () => proposals.filter(p => p.status === 'Sent' || p.status === 'Viewed'),
    [proposals]
  );

  // Attention items — what needs action right now
  const attentionItems = useMemo(() => {
    const items: { id: string; label: string; detail: string; action: string; onClick: () => void }[] = [];

    overdueInvoices.slice(0, 2).forEach(inv => {
      const days = Math.ceil((Date.now() - new Date(inv.updatedAt).getTime()) / (1000 * 60 * 60 * 24));
      items.push({
        id: `inv-${inv.id}`,
        label: `Invoice ${inv.invoiceNumber} is ${days}d overdue`,
        detail: `$${inv.total.toLocaleString()} from ${inv.clientName}`,
        action: 'View invoice',
        onClick: () => onNavigate('invoice-detail', inv.id)
      });
    });

    if (awaitingProposals.length > 0) {
      const prop = awaitingProposals[0];
      items.push({
        id: `prop-${prop.id}`,
        label: `Proposal ${prop.proposalNumber} awaiting response`,
        detail: `for ${prop.clientName}`,
        action: 'Follow up',
        onClick: () => onNavigate('proposal-editor', prop.id)
      });
    }

    // Upcoming deadlines from projects
    const upcomingDeadlines = projects
      .filter(p => p.status === 'In Progress' || p.status === 'To Do')
      .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
      .slice(0, 2);

    upcomingDeadlines.forEach(proj => {
      items.push({
        id: `proj-${proj.id}`,
        label: `${proj.title} deadline approaching`,
        detail: `for ${proj.clientName}`,
        action: 'Open project',
        onClick: () => onNavigate('projects')
      });
    });

    return items.slice(0, 3);
  }, [overdueInvoices, awaitingProposals, projects, onNavigate]);

  // ── KPI cards (actionable, not just vanity metrics) ──
  const kpiCards = [
    {
      label: 'This month',
      value: `${cur}${metrics.totalRevenue.toLocaleString()}`,
      delta: `+${metrics.revenueGrowthPercent}%`,
      up: true,
      note: 'vs. last month'
    },
    {
      label: 'To collect',
      value: `${cur}${metrics.pendingPayments.toLocaleString()}`,
      delta: `${pendingInvoices.length} invoices`,
      up: false,
      note: 'awaiting payment'
    },
    {
      label: 'Active projects',
      value: `${metrics.activeProjects}`,
      delta: `${projects.filter(p => p.status === 'In Progress').length} in progress`,
      up: true,
      note: 'on track'
    },
    {
      label: 'Deadlines',
      value: `${metrics.upcoming.length}`,
      delta: `${overdueInvoices.length} overdue`,
      up: false,
      note: 'next 30 days'
    }
  ];

  // ── Project pipeline (compact) ──
  const pipelineProjects = projects
    .filter(p => p.status !== 'Cancelled' && p.status !== 'On Hold')
    .sort((a, b) => {
      const order = { 'To Do': 0, 'In Progress': 1, 'Review': 2, 'Completed': 3 };
      return (order[a.status as keyof typeof order] ?? 99) - (order[b.status as keyof typeof order] ?? 99);
    })
    .slice(0, 2); // compact — only show top 2

  // ── Revenue chart data ──
  const allTimelineData = metrics.revenueOverview.timeline;
  const timelineData = timePeriod === '30D'
    ? allTimelineData.slice(-3)
    : timePeriod === '6M'
      ? allTimelineData.slice(-6)
      : timePeriod === '1Y'
        ? allTimelineData
        : allTimelineData.slice(-6);
  const maxVal = Math.max(...timelineData.map(d => d.amount), 1);
  const chartWidth = 620;
  const chartHeight = 120; // super sleek line height

  const points = timelineData.map((d, i) => {
    const x = timelineData.length === 1 ? chartWidth / 2 : (i / (timelineData.length - 1)) * (chartWidth - 48) + 24;
    const y = chartHeight - (d.amount / maxVal) * (chartHeight - 48) - 24;
    return { x, y, month: d.month, amount: d.amount };
  });

  const pathD = points.reduce((acc, p, i, arr) => {
    if (i === 0) return `M ${p.x} ${p.y}`;
    const prev = arr[i - 1];
    const cx = (prev.x + p.x) / 2;
    return `${acc} C ${cx} ${prev.y}, ${cx} ${p.y}, ${p.x} ${p.y}`;
  }, '');

  const areaD = points.length ? `${pathD} L ${points[points.length - 1].x} ${chartHeight} L ${points[0].x} ${chartHeight} Z` : '';

  // ── Today's tasks (from upcoming + overdue) ──
  const todayItems = useMemo(() => {
    const items: { id: string; time: string; title: string; subtitle: string; icon: React.ReactNode; onClick: () => void }[] = [];

    overdueInvoices.slice(0, 2).forEach(inv => {
      items.push({
        id: `today-inv-${inv.id}`,
        time: 'Overdue',
        title: `Follow up: ${inv.invoiceNumber}`,
        subtitle: `${inv.clientName} · ${cur}${inv.total.toLocaleString()}`,
        icon: <Receipt className="w-3.5 h-3.5" style={{ color: '#B4552F' }} />,
        onClick: () => onNavigate('invoice-detail', inv.id)
      });
    });

    metrics.upcoming.slice(0, 3).forEach(item => {
      items.push({
        id: `today-${item.id}`,
        time: `${item.dayNumber} ${item.monthShort}`,
        title: item.title,
        subtitle: item.subtitle,
        icon: <CalendarIcon className="w-3.5 h-3.5" style={{ color: T.accent }} />,
        onClick: () => onNavigate('calendar')
      });
    });

    return items.slice(0, 4);
  }, [overdueInvoices, metrics.upcoming, onNavigate, cur]);

  // ── Upcoming (next 7 days) ──
  const upcomingItems = metrics.upcoming.slice(0, 5);

  // ── Business health indicators ──
  const healthIndicators = [
    {
      label: 'Cash flow',
      status: metrics.pendingPayments < metrics.totalRevenue * 0.3 ? 'Healthy' : 'Needs attention',
      color: metrics.pendingPayments < metrics.totalRevenue * 0.3 ? '#1E7D3F' : '#B4552F'
    },
    {
      label: 'Client pipeline',
      status: proposals.filter(p => p.status === 'Sent' || p.status === 'Viewed').length > 0 ? 'Good' : 'Low',
      color: proposals.filter(p => p.status === 'Sent' || p.status === 'Viewed').length > 0 ? '#1E7D3F' : '#937A62'
    },
    {
      label: 'Overdue invoices',
      status: overdueInvoices.length > 0 ? 'Needs attention' : 'All clear',
      color: overdueInvoices.length > 0 ? '#B4552F' : '#1E7D3F'
    },
    {
      label: 'Project workload',
      status: metrics.activeProjects > 8 ? 'High' : metrics.activeProjects > 4 ? 'Medium' : 'Manageable',
      color: metrics.activeProjects > 8 ? '#B4552F' : metrics.activeProjects > 4 ? '#937A62' : '#1E7D3F'
    }
  ];

  const newActions = [
    { label: 'Client', type: 'client' as const, fallback: 'clients' as NavPage },
    { label: 'Project', type: 'project' as const, fallback: 'projects' as NavPage },
    { label: 'Invoice', type: 'invoice' as const, fallback: 'invoice-new' as NavPage },
    { label: 'Proposal', type: 'proposal' as const, fallback: 'proposal-new' as NavPage },
    { label: 'Task', type: 'project' as const, fallback: 'calendar' as NavPage },
    { label: 'Meeting', type: 'project' as const, fallback: 'calendar' as NavPage },
    { label: 'Expense', type: 'invoice' as const, fallback: 'analytics' as NavPage }
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* ══ Header: Greeting (Professional and Minimalistic) ══ */}
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.16em] font-semibold mb-2.5" style={{ color: T.accent }}>
            {onboarding?.businessName || 'Workspace overview'}
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-[-0.02em]" style={{ color: T.ink }}>
            {greeting}, {user?.name?.split(' ')[0] || 'Alpha'}.
          </h1>
          <p className="text-sm font-medium mt-1.5" style={{ color: T.body }}>
            {attentionItems.length > 0
              ? `You have ${attentionItems.length} action item${attentionItems.length === 1 ? '' : 's'} waiting for you.`
              : 'All caught up — your workspace is looking clear.'}
          </p>
        </div>

        {/* Dropdown "+ New" Button */}
        <div className="relative" ref={newBtnRef}>
          <Button
            onClick={() => {
              const rect = newBtnRef.current?.getBoundingClientRect();
              if (rect) {
                setMenuPos({
                  top: rect.bottom + 8,
                  right: window.innerWidth - rect.right,
                });
              }
              setShowNewMenu(!showNewMenu);
            }}
            variant="primary"
            size="sm"
            icon={<Plus className="w-3.5 h-3.5" />}
            iconRight={<ChevronDown className="w-3 h-3 opacity-70" />}
          >
            <span>New action</span>
          </Button>

          {showNewMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowNewMenu(false)} />
              <div
                className="fixed w-48 border rounded-xl shadow-xl p-1 z-50 animate-in fade-in zoom-in-95 duration-100"
                style={{
                  top: menuPos.top,
                  right: menuPos.right,
                  backgroundColor: T.surface,
                  borderColor: T.borderStrong,
                }}
              >
                {newActions.map(action => (
                  <button
                    key={action.label}
                    onClick={() => {
                      setShowNewMenu(false);
                      onOpenQuickCreate ? onOpenQuickCreate(action.type) : onNavigate(action.fallback);
                    }}
                    className="w-full px-3 py-2 text-[13px] font-medium rounded-lg text-left transition-colors duration-150 cursor-pointer hover:bg-[#F1EDE7]"
                    style={{ color: T.body }}
                  >
                    New {action.label.toLowerCase()}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ══ KPI Cards — actionable metrics ══ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map(m => (
          <Card key={m.label} className="p-5 transition-all duration-300 hover:-translate-y-0.5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: T.muted }}>
                {m.label}
              </span>
              <span
                className="inline-flex items-center text-[11px] font-semibold px-1.5 py-0.5 rounded-md"
                style={
                  m.up
                    ? { color: '#1E7D3F', backgroundColor: 'rgba(30,125,63,0.10)' }
                    : { color: '#B4552F', backgroundColor: 'rgba(180,85,47,0.08)' }
                }
              >
                {m.up ? <ArrowUpRight className="w-3 h-3 mr-0.5" /> : <ArrowDownRight className="w-3 h-3 mr-0.5" />}
                {m.delta}
              </span>
            </div>
            <div className="text-[26px] font-bold tracking-tight leading-none" style={{ color: T.ink }}>
              {m.value}
            </div>
            <p className="text-[11px] font-medium mt-2" style={{ color: T.muted }}>{m.note}</p>
          </Card>
        ))}
      </div>

      {/* ══ Graph + Attention Split Layout (Compact, Minimalistic & Professional) ══ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Revenue Chart (takes 2/3 of space on desktop) */}
        <Card className="lg:col-span-2 p-5 sm:p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4">
              <div>
                <h3 className="font-semibold text-sm" style={{ color: T.ink }}>Revenue trajectory</h3>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-xl font-bold tracking-tight" style={{ color: T.ink }}>
                    {cur}{metrics.revenueOverview.total.toLocaleString()}
                  </span>
                  <span className="text-[11px] font-semibold" style={{ color: '#1E7D3F' }}>
                    +{metrics.revenueOverview.growthPercent}%
                  </span>
                </div>
              </div>

              <div className="segmented-control shrink-0">
                {(['30D', '90D', '6M', '1Y'] as const).map(period => (
                  <button
                    key={period}
                    onClick={() => setTimePeriod(period)}
                    className={`px-2.5 py-1 text-[11px] rounded-md transition-all cursor-pointer ${timePeriod === period ? 'bg-white font-medium shadow-2xs' : ''}`}
                    style={{ color: timePeriod === period ? T.ink : T.muted }}
                  >
                    {period}
                  </button>
                ))}
              </div>
            </div>

            {/* SVG Smooth Curve Line Chart */}
            <div className="w-full pt-1">
              <div className="flex gap-2">
                <div className="h-40 flex flex-col justify-between text-[9px] tabular-nums py-1 shrink-0" style={{ color: T.muted }}>
                  <span>${Math.round(maxVal / 1000)}k</span>
                  <span>${Math.round(maxVal * .5 / 1000)}k</span>
                  <span>$0</span>
                </div>
                <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-40 overflow-visible" role="img" aria-label={`Revenue over the selected ${timePeriod} period`}>
                  <defs>
                    <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={T.accent} stopOpacity="0.18" />
                      <stop offset="100%" stopColor={T.accent} stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Subtle horizontal grid lines */}
                  {[0.25, 0.5, 0.75, 1].map(r => (
                    <line
                      key={r}
                      x1="0"
                      y1={chartHeight * r}
                      x2={chartWidth}
                      y2={chartHeight * r}
                      stroke={T.border}
                      strokeDasharray="3 4"
                    />
                  ))}

                  {/* Shaded Area */}
                  <path d={areaD} fill="url(#revenueGrad)" />

                  {/* Line Path */}
                  <path
                    d={pathD}
                    fill="none"
                    stroke={T.accent}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />

                  {/* Data Points */}
                  {points.map(p => (
                    <g key={p.month} className="group">
                      <circle
                        cx={p.x}
                        cy={p.y}
                        r="3.5"
                        fill="#FFFFFF"
                        stroke={T.accent}
                        strokeWidth="2"
                        className="transition-all cursor-pointer"
                      />
                      <text
                        x={p.x}
                        y={p.y - 8}
                        textAnchor="middle"
                        className="text-[9px] font-medium opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                        fill={T.body}
                      >
                        ${(p.amount / 1000).toFixed(1)}k
                      </text>
                    </g>
                  ))}
                </svg>
              </div>
            </div>
          </div>

          {/* X-Axis labels (placed cleanly at the bottom) */}
          <div className="flex justify-between px-2 pt-2.5 mt-2 border-t text-[11px] font-medium" style={{ borderColor: T.bg, color: T.muted }}>
            {timelineData.map(d => (
              <span key={d.month}>{d.month}</span>
            ))}
          </div>
        </Card>

        {/* Quick Actions — compact, short-height card that keeps the chart row balanced */}
        <Card className="lg:col-span-1 p-4 sm:p-5 flex flex-col justify-between">
          <div>
            <div className="pb-2.5 border-b flex items-center justify-between" style={{ borderColor: T.border }}>
              <h3 className="font-semibold text-xs uppercase tracking-wider" style={{ color: T.muted }}>Quick actions</h3>
              <Sparkles className="w-3.5 h-3.5" style={{ color: T.accentSoft }} />
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2">
              {[
                { label: 'Invoice', icon: <Receipt className="w-3.5 h-3.5" />, page: 'invoice-new' as NavPage },
                { label: 'Proposal', icon: <FileText className="w-3.5 h-3.5" />, page: 'proposal-new' as NavPage },
                { label: 'Project', icon: <FolderKanban className="w-3.5 h-3.5" />, page: 'projects' as NavPage },
                { label: 'Client', icon: <Users className="w-3.5 h-3.5" />, page: 'clients' as NavPage }
              ].map(action => (
                <button
                  key={action.label}
                  onClick={() => onOpenQuickCreate
                    ? onOpenQuickCreate(action.label.toLowerCase() as 'client' | 'project' | 'proposal' | 'invoice')
                    : onNavigate(action.page)}
                  className="group flex flex-col items-start gap-2 p-2.5 rounded-xl border cursor-pointer transition-all duration-200 hover:shadow-[0_2px_8px_rgba(74,59,50,0.06)]"
                  style={{ backgroundColor: '#FAF8F5', borderColor: T.border }}
                >
                  <span
                    className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors duration-200"
                    style={{ backgroundColor: '#FFFFFF', border: `1px solid ${T.border}`, color: T.accent }}
                  >
                    {action.icon}
                  </span>
                  <span className="text-[11px] font-semibold group-hover:text-amber-900 transition-colors" style={{ color: T.body }}>
                    New {action.label.toLowerCase()}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Compact AI status strip */}
          <button
            onClick={() => onNavigate('ai-assistant')}
            className="mt-3 w-full flex items-center gap-2.5 px-3 py-2 rounded-xl border text-left cursor-pointer transition-all duration-200 hover:shadow-[0_2px_8px_rgba(74,59,50,0.06)]"
            style={{ background: 'linear-gradient(135deg, #2E2620 0%, #453B33 100%)', borderColor: 'transparent' }}
          >
            <Sparkles className="w-3.5 h-3.5 shrink-0" style={{ color: '#D9C4A5' }} />
            <div className="min-w-0 flex-1">
              <div className="text-[11px] font-semibold truncate" style={{ color: '#F8F4EE' }}>AI Copilot ready</div>
              <div className="text-[9.5px] truncate" style={{ color: 'rgba(248,244,238,0.55)' }}>Draft proposals in seconds →</div>
            </div>
          </button>
        </Card>
      </div>

      {/* ══ Overview Row (One elegant, very clean, non-overloaded 3-column row) ══ */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Column 1: Today's Agenda (Concise) */}
        <Card className="p-4 sm:p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2.5 border-b" style={{ borderColor: T.border }}>
              <h3 className="font-semibold text-xs uppercase tracking-wider text-amber-900/60" style={{ color: T.muted }}>Today's Agenda</h3>
              <button
                onClick={() => onNavigate('calendar')}
                className="text-[10px] font-bold hover:underline cursor-pointer transition-colors"
                style={{ color: T.accent }}
              >
                Calendar →
              </button>
            </div>

            <div className="mt-3.5 space-y-3.5">
              {todayItems.length > 0 ? (
                todayItems.slice(0, 3).map(item => (
                  <div
                    key={item.id}
                    className="flex items-start gap-2.5 cursor-pointer group transition-colors"
                    onClick={item.onClick}
                  >
                    <div className="flex items-center justify-center w-4 h-4 shrink-0 mt-0.5" style={{ color: T.accent }}>
                      {item.icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[11.5px] font-semibold truncate group-hover:text-amber-900 transition-colors" style={{ color: T.ink }}>{item.title}</div>
                      <div className="text-[10.5px] mt-0.5 truncate" style={{ color: T.muted }}>{item.subtitle}</div>
                    </div>
                    <span className="text-[9.5px] font-bold shrink-0 mt-0.5 uppercase tracking-wide px-1.5 py-0.2 bg-[#FAF8F5] border rounded-md" style={{ borderColor: T.border, color: T.muted }}>{item.time}</span>
                  </div>
                ))
              ) : (
                <div className="text-center py-6">
                  <CheckCircle className="w-5 h-5 mx-auto mb-1.5" style={{ color: '#1E7D3F' }} />
                  <p className="text-[11px] font-semibold" style={{ color: T.ink }}>Nothing today</p>
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 pt-2.5 border-t" style={{ borderColor: T.border }}>
            <button
              onClick={() => onNavigate('calendar')}
              className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider cursor-pointer hover:text-amber-900 transition-colors"
              style={{ color: T.accent }}
            >
              <Plus className="w-3 h-3" />
              Schedule event
            </button>
          </div>
        </Card>

        {/* Column 2: Project Pipeline (Very compact) */}
        <Card className="p-4 sm:p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2.5 border-b" style={{ borderColor: T.border }}>
              <h3 className="font-semibold text-xs uppercase tracking-wider text-amber-900/60" style={{ color: T.muted }}>Active Pipeline</h3>
              <button
                onClick={() => onNavigate('projects')}
                className="text-[10px] font-bold hover:underline cursor-pointer transition-colors"
                style={{ color: T.accent }}
              >
                Projects →
              </button>
            </div>

            <div className="mt-3.5 space-y-3.5">
              {pipelineProjects.length > 0 ? (
                pipelineProjects.map(proj => {
                  const progress = proj.tasks && proj.tasks.length > 0
                    ? Math.round((proj.tasks.filter(t => t.completed).length / proj.tasks.length) * 100)
                    : proj.status === 'Completed' ? 100 : proj.status === 'In Progress' ? 60 : 30;
                  return (
                    <div key={proj.id} className="space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <div className="text-[11.5px] font-semibold truncate" style={{ color: T.ink }}>{proj.title}</div>
                          <div className="text-[10px] mt-0.5 truncate" style={{ color: T.muted }}>{proj.clientName}</div>
                        </div>
                        <span className="text-[10px] font-bold shrink-0" style={{ color: T.ink }}>{progress}%</span>
                      </div>
                      <div className="w-full h-1 rounded-full" style={{ backgroundColor: T.border }}>
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${progress}%`,
                            background: `linear-gradient(90deg, ${T.accent} 0%, ${T.accentSoft} 100%)`
                          }}
                        />
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-6 text-xs" style={{ color: T.muted }}>
                  <p>No active projects</p>
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 pt-2.5 border-t" style={{ borderColor: T.border }}>
            <button
              onClick={() => onNavigate('projects')}
              className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider cursor-pointer hover:text-amber-900 transition-colors"
              style={{ color: T.accent }}
            >
              <Plus className="w-3 h-3" />
              New project
            </button>
          </div>
        </Card>

        {/* Column 3: Business Health (Sleek and typography-focused) */}
        <Card className="p-4 sm:p-5 flex flex-col justify-between">
          <div>
            <div className="pb-2.5 border-b" style={{ borderColor: T.border }}>
              <h3 className="font-semibold text-xs uppercase tracking-wider text-amber-900/60" style={{ color: T.muted }}>Vitals & Health</h3>
            </div>
            <div className="mt-3.5 space-y-3">
              {healthIndicators.map(h => (
                <div key={h.label} className="flex items-center justify-between text-[11px] pb-1 border-b border-[#FAF8F5]/80 last:border-b-0">
                  <span className="font-medium" style={{ color: T.body }}>{h.label}</span>
                  <span className="font-bold px-1.5 py-0.2 rounded text-[10px]" style={{ color: h.color, backgroundColor: `${h.color}0D` }}>
                    {h.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-2.5 border-t flex justify-between items-center text-[10px]" style={{ borderColor: T.border }}>
            <span style={{ color: T.muted }}>Auto-reconciled daily</span>
            <button
              onClick={() => onNavigate('analytics')}
              className="font-bold uppercase tracking-wider hover:underline cursor-pointer"
              style={{ color: T.accent }}
            >
              Analytics →
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
};
