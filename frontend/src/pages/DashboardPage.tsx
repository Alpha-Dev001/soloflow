import React, { useMemo } from 'react';
import {
  Plus,
  Calendar as CalendarIcon,
  Receipt,
  FolderKanban,
  Users,
  TrendingUp,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Avatar } from '../components/ui/Avatar';
import { GrowthChart } from '../components/charts/GrowthChart';
import type { DashboardMetrics, User, Client, Invoice, Project } from '../types';
import type { NavPage } from '../components/layout/Sidebar';

interface DashboardPageProps {
  metrics: DashboardMetrics;
  user: User | null;
  clients: Client[];
  invoices: Invoice[];
  projects: Project[];
  isLoading?: boolean;
  onNavigate: (page: NavPage, param?: string) => void;
  onOpenQuickCreate?: (type: 'client' | 'project' | 'invoice') => void;
}

const T = {
  bg: '#F8F7F5',
  surface: '#FFFFFF',
  surfaceWarm: '#FAF8F5',
  border: '#EDE8E1',
  borderStrong: '#E0D9CF',
  ink: '#1A1918',
  body: '#4A4037',
  muted: '#6B6158',
  accent: '#82694E',
  accentSoft: '#B39C82',
  dark: '#453B33',
  success: '#1E7D3F',
  warning: '#B4552F'
};

const cur = '$';

/* ── Loading Skeleton — matches the real layout exactly ── */
function DashboardSkeleton() {
  return (
    <div className="space-y-5 max-w-7xl mx-auto animate-pulse">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-2">
          <div className="h-2.5 w-24 rounded-full" style={{ backgroundColor: T.border }} />
          <div className="h-6 w-48 rounded-lg" style={{ backgroundColor: T.border }} />
          <div className="h-3 w-64 rounded-full" style={{ backgroundColor: T.border }} />
        </div>
        <div className="h-8 w-28 rounded-lg" style={{ backgroundColor: T.border }} />
      </div>

      {/* KPI Row — compact 4-col */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="rounded-xl p-3.5 border" style={{ backgroundColor: T.surface, borderColor: T.border }}>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg shrink-0" style={{ backgroundColor: T.bg }} />
              <div className="space-y-1.5 flex-1">
                <div className="h-2 w-14 rounded-full" style={{ backgroundColor: T.bg }} />
                <div className="h-5 w-16 rounded" style={{ backgroundColor: T.bg }} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Chart + Side */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-xl border p-5 h-56" style={{ backgroundColor: T.surface, borderColor: T.border }}>
          <div className="h-3 w-28 rounded-full mb-4" style={{ backgroundColor: T.bg }} />
          <div className="h-36 rounded-lg" style={{ backgroundColor: T.bg }} />
        </div>
        <div className="rounded-xl border p-4 h-56" style={{ backgroundColor: T.surface, borderColor: T.border }}>
          <div className="h-3 w-20 rounded-full mb-4" style={{ backgroundColor: T.bg }} />
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-10 rounded-lg" style={{ backgroundColor: T.bg }} />
            ))}
          </div>
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="rounded-xl border p-4 h-40" style={{ backgroundColor: T.surface, borderColor: T.border }}>
            <div className="h-3 w-20 rounded-full mb-4" style={{ backgroundColor: T.bg }} />
            <div className="space-y-2.5">
              {[1, 2, 3].map(j => (
                <div key={j} className="h-8 rounded-lg" style={{ backgroundColor: T.bg }} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  metrics,
  user,
  clients,
  invoices,
  projects,
  isLoading = false,
  onNavigate,
  onOpenQuickCreate,
}) => {
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);

  const overdueInvoices = useMemo(() => invoices.filter(i => i.status === 'Overdue'), [invoices]);
  const pendingInvoices = useMemo(() => invoices.filter(i => i.status === 'Pending' || i.status === 'Sent'), [invoices]);
  const attentionItems = useMemo(() => {
    const items: { id: string; label: string; detail: string; onClick: () => void }[] = [];
    overdueInvoices.slice(0, 1).forEach(inv => {
      items.push({
        id: `inv-${inv.id}`,
        label: `Invoice ${inv.invoiceNumber} overdue`,
        detail: `$${inv.total.toLocaleString()} from ${inv.clientName}`,
        onClick: () => onNavigate('client-detail', inv.clientId)
      });
    });
    projects.filter(p => p.status === 'In Progress').sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime()).slice(0, 1).forEach(proj => {
      items.push({
        id: `proj-${proj.id}`,
        label: `${proj.title} deadline approaching`,
        detail: `for ${proj.clientName}`,
        onClick: () => onNavigate('client-detail', proj.clientId)
      });
    });
    return items.slice(0, 3);
  }, [overdueInvoices, projects, onNavigate]);

  // Build growth data from workspace entities (projects, clients, invoices by month)
  const growthData = useMemo(() => {
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const now = new Date();
    const points: { month: string; projects: number; clients: number; invoices: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mIdx = d.getMonth();
      const y = d.getFullYear();
      const monthStart = new Date(y, mIdx, 1).getTime();
      const monthEnd = new Date(y, mIdx + 1, 0, 23, 59, 59).getTime();
      const projCount = projects.filter(p => {
        const t = new Date(p.createdAt).getTime();
        return t >= monthStart && t <= monthEnd;
      }).length;
      const clientCount = clients.filter(c => {
        const t = new Date(c.createdAt).getTime();
        return t >= monthStart && t <= monthEnd;
      }).length;
      const invCount = invoices.filter(inv => {
        const t = new Date(inv.createdAt).getTime();
        return t >= monthStart && t <= monthEnd;
      }).length;
      points.push({ month: months[mIdx], projects: projCount, clients: clientCount, invoices: invCount });
    }
    return points;
  }, [projects, clients, invoices]);

  const todayItems = useMemo(() => {
    const items: { id: string; time: string; title: string; subtitle: string; icon: React.ReactNode; onClick: () => void }[] = [];
    overdueInvoices.slice(0, 1).forEach(inv => {
      items.push({
        id: `today-inv-${inv.id}`,
        time: 'Overdue',
        title: `Follow up: ${inv.invoiceNumber}`,
        subtitle: `${inv.clientName} · $${inv.total.toLocaleString()}`,
        icon: <Receipt className="w-3.5 h-3.5" style={{ color: T.warning }} />,
        onClick: () => onNavigate('client-detail', inv.clientId)
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
  }, [overdueInvoices, metrics.upcoming, onNavigate]);

  const pipelineProjects = useMemo(() => {
    return projects
      .filter(p => p.status !== 'Cancelled' && p.status !== 'On Hold')
      .sort((a, b) => {
        const order: Record<string, number> = { 'To Do': 0, 'In Progress': 1, 'Completed': 2 };
        return (order[a.status] ?? 99) - (order[b.status] ?? 99);
      })
      .slice(0, 3);
  }, [projects]);

  if (isLoading) return <DashboardSkeleton />;

  const isEmpty = metrics.totalRevenue === 0 && metrics.activeProjects === 0 && projects.length === 0;

  /* ════════════════════════════════════════════════════════════════════
     EMPTY STATE — skeleton-style layout matching the real dashboard,
     with interactive cards in place of each placeholder section.
     ════════════════════════════════════════════════════════════════════ */
  if (isEmpty) {
    return (
      <div className="space-y-5 max-w-7xl mx-auto">
        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-[0.16em] font-semibold" style={{ color: T.accent }}>Workspace</p>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight" style={{ color: T.ink }}>{greeting}, {user?.name?.split(' ')[0] || 'there'}.</h1>
            <p className="text-xs mt-0.5" style={{ color: T.muted }}>Your command center is ready — let's get started.</p>
          </div>
        </div>

        {/* ── KPI Cards — interactive placeholders mirroring real layout ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: 'Revenue', icon: <TrendingUp className="w-3.5 h-3.5" />, bg: '#F0E9E0', fg: '#82694E', hint: '$0 earned', action: () => onNavigate('clients') },
            { label: 'To collect', icon: <Receipt className="w-3.5 h-3.5" />, bg: '#F5EDED', fg: '#B4552F', hint: 'No invoices yet', action: () => onNavigate('clients') },
            { label: 'Active projects', icon: <FolderKanban className="w-3.5 h-3.5" />, bg: '#EEF0EC', fg: '#5A6B5D', hint: 'Start your first', action: () => onNavigate('clients') },
            { label: 'Deadlines', icon: <Clock className="w-3.5 h-3.5" />, bg: '#EFEDF0', fg: '#6B5F73', hint: 'Zero upcoming', action: () => onNavigate('calendar') },
          ].map(m => (
            <button key={m.label} onClick={m.action} className="text-left cursor-pointer">
              <div className="p-3 rounded-xl border transition-all hover:shadow-sm" style={{ borderColor: T.border, backgroundColor: T.surface }}>
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: m.bg, color: m.fg }}>{m.icon}</div>
                  <div className="min-w-0">
                    <div className="text-[10px] uppercase font-medium tracking-wide" style={{ color: T.muted }}>{m.label}</div>
                    <div className="text-lg font-bold tracking-tight leading-none" style={{ color: T.ink }}>—</div>
                  </div>
                </div>
                <p className="text-[10px] mt-2 font-medium" style={{ color: T.muted }}>{m.hint}</p>
              </div>
            </button>
          ))}
        </div>

        {/* ── Growth Chart + Quick Actions ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="lg:col-span-2 p-5">
            <div className="flex items-center justify-between pb-3">
              <div>
                <h3 className="font-semibold text-xs" style={{ color: T.ink }}>Workspace Growth</h3>
                <p className="text-[10px] mt-0.5" style={{ color: T.muted }}>Projects, clients & invoices added over time</p>
              </div>
            </div>
            <GrowthChart data={growthData} height={200} />
          </Card>

          <Card className="p-4 flex flex-col">
            <div className="pb-2.5 border-b" style={{ borderColor: T.bg }}>
              <h3 className="font-semibold text-xs" style={{ color: T.ink }}>Quick Actions</h3>
            </div>
            <div className="space-y-1.5 pt-2.5 flex-1">
              {[
              { label: 'Clients', icon: <Users className="w-3.5 h-3.5" />, onClick: () => onNavigate('clients') },
              { label: 'Calendar', icon: <CalendarIcon className="w-3.5 h-3.5" />, onClick: () => onNavigate('calendar') },
              { label: 'Analytics', icon: <TrendingUp className="w-3.5 h-3.5" />, onClick: () => onNavigate('analytics') },
            ].map(a => (
              <button key={a.label} onClick={a.onClick} className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium cursor-pointer transition-colors hover:bg-[#F1EDE7]" style={{ color: T.body }}>
                <span className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: T.surfaceWarm, border: `1px solid ${T.border}`, color: T.accent }}>{a.icon}</span>
                {a.label}
              </button>
            ))}
          </div>
        </Card>
      </div>

      {/* ── Bottom Row: Agenda + Pipeline + Health (all empty, matching real sections) ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Agenda */}
          <Card className="p-4">
            <div className="flex items-center justify-between pb-2.5 border-b" style={{ borderColor: T.bg }}>
              <h3 className="font-semibold text-xs uppercase tracking-wider" style={{ color: T.muted }}>Agenda</h3>
              <button onClick={() => onNavigate('calendar')} className="text-[10px] font-bold hover:underline cursor-pointer" style={{ color: T.accent }}>Calendar</button>
            </div>
            <div className="py-4 text-center">
              <CalendarIcon className="w-4 h-4 mx-auto mb-1.5" style={{ color: T.borderStrong }} />
              <p className="text-[11px]" style={{ color: T.muted }}>Nothing scheduled</p>
              <p className="text-[10px] mt-0.5" style={{ color: T.muted }}>Events will show up here</p>
            </div>
          </Card>

          {/* Pipeline */}
          <Card className="p-4">
            <div className="flex items-center justify-between pb-2.5 border-b" style={{ borderColor: T.bg }}>
              <h3 className="font-semibold text-xs uppercase tracking-wider" style={{ color: T.muted }}>Pipeline</h3>
              <button onClick={() => onNavigate('clients')} className="text-[10px] font-bold hover:underline cursor-pointer" style={{ color: T.accent }}>Clients</button>
            </div>
            <div className="py-4 text-center">
              <FolderKanban className="w-4 h-4 mx-auto mb-1.5" style={{ color: T.borderStrong }} />
              <p className="text-[11px]" style={{ color: T.muted }}>No active projects</p>
              <p className="text-[10px] mt-0.5" style={{ color: T.muted }}>Create a project to track progress</p>
            </div>
          </Card>

          {/* Health */}
          <Card className="p-4">
            <div className="flex items-center justify-between pb-2.5 border-b" style={{ borderColor: T.bg }}>
              <h3 className="font-semibold text-xs uppercase tracking-wider" style={{ color: T.muted }}>Health</h3>
              <span className="text-[10px] font-bold" style={{ color: T.muted }}>&nbsp;</span>
            </div>
            <div className="space-y-2.5 pt-2.5">
              {[
                { label: 'Cash flow', status: 'N/A', color: T.muted },
                { label: 'Pipeline', status: 'N/A', color: T.muted },
                { label: 'Overdue', status: 'N/A', color: T.muted },
                { label: 'Workload', status: 'N/A', color: T.muted },
              ].map(h => (
                <div key={h.label} className="flex items-center justify-between text-[11px]">
                  <span className="font-medium" style={{ color: T.body }}>{h.label}</span>
                  <span className="font-bold text-[10px] px-1.5 py-0.5 rounded" style={{ color: h.color, backgroundColor: `${h.color}0D` }}>{h.status}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    );
  }

  /* ════════════════════════════════════════════════════════════════════
     LOADED STATE — compact, professional, daily-use dashboard
     ════════════════════════════════════════════════════════════════════ */
  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      {/* ══ Header ══ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.16em] font-semibold" style={{ color: T.accent }}>Workspace</p>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight" style={{ color: T.ink }}>{greeting}, {user?.name?.split(' ')[0] || 'there'}.</h1>
          <p className="text-xs mt-0.5" style={{ color: T.muted }}>
            {attentionItems.length > 0 ? `${attentionItems.length} item${attentionItems.length === 1 ? '' : 's'} need${attentionItems.length === 1 ? 's' : ''} attention` : 'All caught up'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => onNavigate('clients')} variant="primary" size="sm" icon={<Plus className="w-3.5 h-3.5" />}>New</Button>
        </div>
      </div>

      {/* ══ KPI Cards — compact, icon + value + delta ══ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Revenue', value: `${cur}${metrics.totalRevenue.toLocaleString()}`, delta: `+${metrics.revenueGrowthPercent}%`, up: true, icon: <TrendingUp className="w-3.5 h-3.5" />, bg: '#F0E9E0', fg: '#82694E', onClick: () => onNavigate('clients') },
          { label: 'To collect', value: `${cur}${metrics.pendingPayments.toLocaleString()}`, delta: `${pendingInvoices.length} inv.`, up: false, icon: <Receipt className="w-3.5 h-3.5" />, bg: '#F5EDED', fg: '#B4552F', onClick: () => onNavigate('clients') },
          { label: 'Active projects', value: String(metrics.activeProjects), delta: `${projects.filter(p => p.status === 'In Progress').length} in progress`, up: true, icon: <FolderKanban className="w-3.5 h-3.5" />, bg: '#EEF0EC', fg: '#5A6B5D', onClick: () => onNavigate('clients') },
          { label: 'Deadlines', value: String(metrics.upcoming.length), delta: `${overdueInvoices.length} overdue`, up: overdueInvoices.length === 0, icon: <Clock className="w-3.5 h-3.5" />, bg: '#EFEDF0', fg: '#6B5F73', onClick: () => onNavigate('calendar') },
        ].map(m => (
          <button key={m.label} onClick={m.onClick} className="text-left cursor-pointer">
            <div className="p-3 rounded-xl border transition-all hover:shadow-sm" style={{ borderColor: T.border, backgroundColor: T.surface }}>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: m.bg, color: m.fg }}>{m.icon}</div>
                <div className="min-w-0">
                  <div className="text-[10px] uppercase font-medium tracking-wide" style={{ color: T.muted }}>{m.label}</div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-lg font-bold tracking-tight leading-none" style={{ color: T.ink }}>{m.value}</span>
                    <span className="text-[10px] font-semibold px-1 py-0.5 rounded" style={{ color: m.up ? T.success : T.warning, backgroundColor: m.up ? 'rgba(30,125,63,0.08)' : 'rgba(180,85,47,0.08)' }}>
                      {m.up ? '+' : ''}{m.delta}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* ══ Attention Bar ══ */}
      {attentionItems.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
          {attentionItems.map(item => (
            <button key={item.id} onClick={item.onClick} className="flex items-center gap-2 px-3 py-2 rounded-lg border text-left cursor-pointer transition-colors hover:bg-[#F1EDE7]/60" style={{ borderColor: T.border, backgroundColor: T.surface }}>
              <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: T.warning }} />
              <div className="min-w-0">
                <span className="text-[11px] font-semibold" style={{ color: T.ink }}>{item.label}</span>
                <span className="text-[10px] ml-1.5" style={{ color: T.muted }}>{item.detail}</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* ══ Growth Chart + Quick Actions ══ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 p-4">
          <div className="flex items-center justify-between pb-3">
            <div>
              <h3 className="font-semibold text-xs" style={{ color: T.ink }}>Workspace Growth</h3>
              <p className="text-[10px] mt-0.5" style={{ color: T.muted }}>Projects, clients & invoices added over time</p>
            </div>
          </div>
          <GrowthChart data={growthData} height={200} />
        </Card>

        <Card className="p-4 flex flex-col">
          <div className="pb-2.5 border-b" style={{ borderColor: T.bg }}>
            <h3 className="font-semibold text-xs" style={{ color: T.ink }}>Quick Actions</h3>
          </div>
          <div className="space-y-1.5 pt-2.5 flex-1">
            {[
              { label: 'Clients', icon: <Users className="w-3.5 h-3.5" />, onClick: () => onNavigate('clients') },
              { label: 'Calendar', icon: <CalendarIcon className="w-3.5 h-3.5" />, onClick: () => onNavigate('calendar') },
              { label: 'Analytics', icon: <TrendingUp className="w-3.5 h-3.5" />, onClick: () => onNavigate('analytics') },
            ].map(a => (
              <button key={a.label} onClick={a.onClick} className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium cursor-pointer transition-colors hover:bg-[#F1EDE7]" style={{ color: T.body }}>
                <span className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: T.surfaceWarm, border: `1px solid ${T.border}`, color: T.accent }}>{a.icon}</span>
                {a.label}
              </button>
            ))}
          </div>
        </Card>
      </div>

      {/* ══ Bottom Row: Agenda + Pipeline + Health ══ */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Today's Agenda */}
        <Card className="p-4">
          <div className="flex items-center justify-between pb-2.5 border-b" style={{ borderColor: T.bg }}>
            <h3 className="font-semibold text-xs uppercase tracking-wider" style={{ color: T.muted }}>Agenda</h3>
            <button onClick={() => onNavigate('calendar')} className="text-[10px] font-bold hover:underline cursor-pointer" style={{ color: T.accent }}>Calendar</button>
          </div>
          <div className="space-y-2.5 pt-2.5">
            {todayItems.length > 0 ? todayItems.map(item => (
              <div key={item.id} className="flex items-start gap-2 cursor-pointer group" onClick={item.onClick}>
                <span className="mt-0.5 shrink-0">{item.icon}</span>
                <div className="min-w-0 flex-1">
                  <div className="text-[11px] font-semibold truncate group-hover:text-amber-900 transition-colors" style={{ color: T.ink }}>{item.title}</div>
                  <div className="text-[10px] truncate" style={{ color: T.muted }}>{item.subtitle}</div>
                </div>
                <span className="text-[9px] font-bold shrink-0 mt-0.5 uppercase tracking-wide px-1.5 py-0.5 rounded border" style={{ borderColor: T.border, color: T.muted }}>{item.time}</span>
              </div>
            )) : (
              <div className="py-4 text-center">
                <CalendarIcon className="w-4 h-4 mx-auto mb-1.5" style={{ color: T.borderStrong }} />
                <p className="text-[11px]" style={{ color: T.muted }}>Nothing scheduled</p>
              </div>
            )}
          </div>
        </Card>

        {/* Project Pipeline */}
        <Card className="p-4">
          <div className="flex items-center justify-between pb-2.5 border-b" style={{ borderColor: T.bg }}>
            <h3 className="font-semibold text-xs uppercase tracking-wider" style={{ color: T.muted }}>Pipeline</h3>
            <button onClick={() => onNavigate('clients')} className="text-[10px] font-bold hover:underline cursor-pointer" style={{ color: T.accent }}>Clients</button>
          </div>
          <div className="space-y-3 pt-2.5">
            {pipelineProjects.length > 0 ? pipelineProjects.map(proj => {
              const progress = proj.status === 'Completed' ? 100 : proj.status === 'In Progress' ? 60 : 30;
              return (
                <div key={proj.id} className="space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-[11px] font-semibold truncate" style={{ color: T.ink }}>{proj.title}</div>
                      <div className="text-[10px] truncate" style={{ color: T.muted }}>{proj.clientName}</div>
                    </div>
                    <span className="text-[10px] font-bold shrink-0" style={{ color: T.ink }}>{progress}%</span>
                  </div>
                  <div className="w-full h-1 rounded-full" style={{ backgroundColor: T.border }}>
                    <div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, background: `linear-gradient(90deg, ${T.accent} 0%, ${T.accentSoft} 100%)` }} />
                  </div>
                </div>
              );
            }) : (
              <div className="py-4 text-center">
                <FolderKanban className="w-4 h-4 mx-auto mb-1.5" style={{ color: T.borderStrong }} />
                <p className="text-[11px]" style={{ color: T.muted }}>No active projects</p>
              </div>
            )}
          </div>
        </Card>

        {/* Business Health */}
        <Card className="p-4">
          <div className="flex items-center justify-between pb-2.5 border-b" style={{ borderColor: T.bg }}>
            <h3 className="font-semibold text-xs uppercase tracking-wider" style={{ color: T.muted }}>Health</h3>
            <span className="text-[10px] font-bold" style={{ color: T.muted }}>&nbsp;</span>
          </div>
          <div className="space-y-2.5 pt-2.5">
            {[
              { label: 'Cash flow', status: metrics.pendingPayments < metrics.totalRevenue * 0.3 ? 'Healthy' : 'Watch', color: metrics.pendingPayments < metrics.totalRevenue * 0.3 ? T.success : T.warning },
              { label: 'Pipeline', status: 'Low', color: T.muted },
              { label: 'Overdue', status: overdueInvoices.length > 0 ? `${overdueInvoices.length} overdue` : 'Clear', color: overdueInvoices.length > 0 ? T.warning : T.success },
              { label: 'Workload', status: metrics.activeProjects > 8 ? 'High' : metrics.activeProjects > 4 ? 'Medium' : 'Light', color: metrics.activeProjects > 8 ? T.warning : metrics.activeProjects > 4 ? T.accent : T.success },
            ].map(h => (
              <div key={h.label} className="flex items-center justify-between text-[11px]">
                <span className="font-medium" style={{ color: T.body }}>{h.label}</span>
                <span className="font-bold text-[10px] px-1.5 py-0.5 rounded" style={{ color: h.color, backgroundColor: `${h.color}0D` }}>{h.status}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};
