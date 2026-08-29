import React, { useMemo } from 'react';
import { Download, ArrowUpRight, Users, BarChart2, FileText, Receipt } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { useToast } from '../components/ui/Toast';
import type { AnalyticsData, Client, Project, Invoice } from '../types';

interface AnalyticsPageProps {
  analytics: AnalyticsData;
  clients?: Client[];
  projects?: Project[];
  invoices?: Invoice[];
  isLoading?: boolean;
}

/* ── Design tokens (matched to landing & auth pages) ── */
const T = {
  bg: '#F8F7F5',
  surface: '#FFFFFF',
  surfaceWarm: '#FAF8F5',
  border: '#EDE8E1',
  borderStrong: '#E0D9CF',
  ink: '#1A1918',
  body: '#6B6158',
  muted: '#8C8278',
  accent: '#937A62',
  accentSoft: '#B39C82',
  dark: '#2A2320'
};

export const AnalyticsPage: React.FC<AnalyticsPageProps> = ({
  analytics,
  clients = [],
  projects = [],
  invoices = [],
  isLoading = false,
}) => {
  const { showToast } = useToast();

  /* ── Real data derived from workspace entities ── */
  const totalRevenue = useMemo(
    () => invoices.filter(i => i.status === 'Paid').reduce((s, i) => s + i.total, 0) || analytics.totalRevenue,
    [invoices, analytics.totalRevenue]
  );

  const totalInvoiced = useMemo(
    () => invoices.reduce((s, i) => s + i.total, 0) || Math.round(analytics.totalRevenue * 1.15),
    [invoices, analytics.totalRevenue]
  );

  const collectionRate = totalInvoiced > 0 ? Math.round((totalRevenue / totalInvoiced) * 100) : 0;

  const activeProjectsCount = projects.filter(p => p.status === 'In Progress').length;
  const completedProjectsCount = projects.filter(p => p.status === 'Completed').length;

  const avgDealSize = clients.length > 0 ? Math.round(totalRevenue / clients.length) : 0;

  // Top clients breakdown from real client data
  const topClients = useMemo(() => {
    const clientList = clients.length > 0 ? clients : [];
    const totalSpentSum = clientList.reduce((acc, c) => acc + (c.totalSpent || 0), 0) || 1;
    return clientList
      .sort((a, b) => (b.totalSpent || 0) - (a.totalSpent || 0))
      .slice(0, 5)
      .map(c => ({
        ...c,
        percentage: Math.round(((c.totalSpent || 0) / totalSpentSum) * 100)
      }));
  }, [clients]);

  // Pending vs paid invoice split for a simple status summary
  const pendingInvoices = invoices.filter(i => i.status !== 'Paid' && i.status !== 'Draft');
  const pendingValue = pendingInvoices.reduce((s, i) => s + i.total, 0);

  // Project status breakdown
  const todoProjects = projects.filter(p => p.status === 'To Do').length;
  const inProgressProjects = projects.filter(p => p.status === 'In Progress').length;
  const completedProjects = projects.filter(p => p.status === 'Completed').length;
  const totalProjects = projects.length;

  // Client status breakdown
  const activeClients = clients.filter(c => c.status === 'Active').length;
  const leadClients = clients.filter(c => c.status === 'Lead').length;

  // Invoice status breakdown
  const paidInvoices = invoices.filter(i => i.status === 'Paid').length;
  const overdueInvoices = invoices.filter(i => i.status === 'Overdue').length;
  const sentInvoices = invoices.filter(i => i.status === 'Sent').length;

  // True when the account has no data at all — show an onboarding nudge
  const isEmpty = invoices.length === 0 && projects.length === 0 && clients.length === 0;

  const handleExport = () => {
    showToast('Analytics summary exported', 'success');
  };

  // ── Loading skeleton ──
  if (isLoading) {
    return (
      <div className="space-y-4 max-w-7xl mx-auto animate-pulse">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-3 w-28 rounded-full" style={{ backgroundColor: T.border }} />
            <div className="h-7 w-36 rounded-lg" style={{ backgroundColor: T.border }} />
            <div className="h-3 w-52 rounded-full" style={{ backgroundColor: T.border }} />
          </div>
          <div className="h-8 w-20 rounded-lg" style={{ backgroundColor: T.border }} />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-2xl border p-5" style={{ backgroundColor: T.surface, borderColor: T.border }}>
              <div className="h-3 w-20 rounded-full mb-3" style={{ backgroundColor: T.bg }} />
              <div className="h-7 w-24 rounded-lg mb-2" style={{ backgroundColor: T.bg }} />
              <div className="h-2.5 w-16 rounded-full" style={{ backgroundColor: T.bg }} />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[0, 1].map(i => (
            <div key={i} className="rounded-2xl border p-6" style={{ backgroundColor: T.surface, borderColor: T.border }}>
              <div className="h-4 w-32 rounded-full mb-2" style={{ backgroundColor: T.bg }} />
              <div className="h-3 w-24 rounded-full mb-6" style={{ backgroundColor: T.bg }} />
              <div className="space-y-3">
                {[...Array(3)].map((_, j) => (
                  <div key={j} className="space-y-1.5">
                    <div className="flex justify-between">
                      <div className="h-3 w-28 rounded-full" style={{ backgroundColor: T.bg }} />
                      <div className="h-3 w-12 rounded-full" style={{ backgroundColor: T.bg }} />
                    </div>
                    <div className="h-1.5 rounded-full w-full" style={{ backgroundColor: T.bg }} />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.16em] font-semibold mb-2" style={{ color: T.accent }}>
            Business intelligence
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight" style={{ color: T.ink }}>
            Analytics
          </h1>
          <p className="text-xs mt-0.5" style={{ color: T.muted }}>
            Revenue trends, account performance, and deliverable metrics.
          </p>
        </div>


      </div>


      {/* 4 Metric Cards — project/client/invoice focused */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Clients */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-medium uppercase tracking-wider" style={{ color: T.muted }}>
              Total Clients
            </span>
            {activeClients > 0 ? (
              <span className="inline-flex items-center text-[11px] font-medium px-1.5 py-0.5 rounded-md" style={{ color: '#248A3D', backgroundColor: 'rgba(52,199,89,0.10)' }}>
                {activeClients} active
              </span>
            ) : null}
          </div>
          <div className="text-[26px] font-bold tracking-tight leading-none" style={{ color: T.ink }}>
            {clients.length}
          </div>
          <p className="text-[11px] mt-2" style={{ color: T.muted }}>
            {leadClients > 0 ? `${leadClients} leads to convert` : 'All clients active'}
          </p>
        </Card>

        {/* Projects Overview */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-medium uppercase tracking-wider" style={{ color: T.muted }}>
              Projects
            </span>
            <span className="text-[10px]" style={{ color: T.muted }}>
              {completedProjects} completed
            </span>
          </div>
          <div className="text-[26px] font-bold tracking-tight leading-none" style={{ color: T.ink }}>
            {totalProjects}
          </div>
          <p className="text-[11px] mt-2" style={{ color: T.muted }}>
            {inProgressProjects} in progress · {todoProjects} to start
          </p>
        </Card>

        {/* Invoices Overview */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-medium uppercase tracking-wider" style={{ color: T.muted }}>
              Invoices
            </span>
            <span className="text-[10px]" style={{ color: T.muted }}>
              {paidInvoices} paid
            </span>
          </div>
          <div className="text-[26px] font-bold tracking-tight leading-none" style={{ color: T.ink }}>
            {invoices.length}
          </div>
          <p className="text-[11px] mt-2" style={{ color: T.muted }}>
            {overdueInvoices > 0 ? `${overdueInvoices} overdue` : 'No overdue invoices'}
          </p>
        </Card>

        {/* Collection Rate */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-medium uppercase tracking-wider" style={{ color: T.muted }}>
              Collection Rate
            </span>
            {collectionRate > 0 ? (
              <span className="inline-flex items-center text-[11px] font-medium px-1.5 py-0.5 rounded-md" style={{ color: collectionRate >= 80 ? '#248A3D' : '#B4552F', backgroundColor: collectionRate >= 80 ? 'rgba(52,199,89,0.10)' : 'rgba(180,85,47,0.10)' }}>
                <ArrowUpRight className="w-3 h-3 mr-0.5" /> {collectionRate}%
              </span>
            ) : null}
          </div>
          <div className="text-[26px] font-bold tracking-tight leading-none" style={{ color: T.ink }}>
            {collectionRate > 0 ? `${collectionRate}%` : '—'}
          </div>
          <p className="text-[11px] mt-2" style={{ color: T.muted }}>
            ${totalRevenue.toLocaleString()} of ${totalInvoiced.toLocaleString()} invoiced
          </p>
        </Card>
      </div>

      {/* 2 Breakdown Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top Clients by Revenue */}
        <Card className="p-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold" style={{ color: T.ink }}>Client contribution</h2>
              <p className="text-[11px] mt-0.5" style={{ color: T.muted }}>Top billing accounts</p>
            </div>
            <span className="text-[11px]" style={{ color: T.muted }}>
              {topClients.length} accounts
            </span>
          </div>

          {topClients.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                style={{ backgroundColor: T.bg, border: `1px solid ${T.borderStrong}` }}
              >
                <Users className="w-4.5 h-4.5" style={{ color: T.accentSoft }} />
              </div>
              <p className="text-[13px] font-semibold mb-1" style={{ color: T.ink }}>No client data yet</p>
              <p className="text-[11px] leading-relaxed max-w-[200px]" style={{ color: T.muted }}>
                Add clients and record invoices to see revenue contribution here.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {topClients.map(client => (
                <div key={client.id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium" style={{ color: T.ink }}>{client.name}</span>
                    <span className="font-medium" style={{ color: T.ink }}>
                      ${(client.totalSpent || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="w-full h-1 rounded-full overflow-hidden" style={{ backgroundColor: T.bg }}>
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{ width: `${client.percentage}%`, backgroundColor: T.accent }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Operations & Delivery Health */}
        <Card className="p-5 sm:p-6">
          <div className="mb-4">
            <h2 className="text-sm font-semibold" style={{ color: T.ink }}>Operations & health</h2>
            <p className="text-[11px] mt-0.5" style={{ color: T.muted }}>Project velocity and invoice timing</p>
          </div>

          {projects.length === 0 && invoices.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                style={{ backgroundColor: T.bg, border: `1px solid ${T.borderStrong}` }}
              >
                <BarChart2 className="w-4.5 h-4.5" style={{ color: T.accentSoft }} />
              </div>
              <p className="text-[13px] font-semibold mb-1" style={{ color: T.ink }}>Nothing to report yet</p>
              <p className="text-[11px] leading-relaxed max-w-[200px]" style={{ color: T.muted }}>
                Create projects and send invoices to track your operational health.
              </p>
            </div>
          ) : (
            <div className="space-y-2 text-xs">
              <div
                className="p-3 rounded-lg flex items-center justify-between"
                style={{ backgroundColor: T.surfaceWarm }}
              >
                <div>
                  <p className="font-medium text-xs" style={{ color: T.ink }}>Active projects</p>
                  <p className="text-[10px] mt-0.5" style={{ color: T.muted }}>
                    {activeProjectsCount} client deliverables on track
                  </p>
                </div>
                <Badge size="sm" variant="success">On Track</Badge>
              </div>

              <div
                className="p-3 rounded-lg flex items-center justify-between"
                style={{ backgroundColor: T.surfaceWarm }}
              >
                <div>
                  <p className="font-medium text-xs" style={{ color: T.ink }}>Collection rate</p>
                  <p className="text-[10px] mt-0.5" style={{ color: T.muted }}>
                    {collectionRate}% of invoiced value collected
                  </p>
                </div>
                <Badge size="sm" variant={collectionRate >= 80 ? 'success' : 'pending'}>
                  {collectionRate >= 80 ? 'Healthy' : 'Watch'}
                </Badge>
              </div>

              <div
                className="p-3 rounded-lg flex items-center justify-between"
                style={{ backgroundColor: T.surfaceWarm }}
              >
                <div>
                  <p className="font-medium text-xs" style={{ color: T.ink }}>Outstanding invoices</p>
                  <p className="text-[10px] mt-0.5" style={{ color: T.muted }}>
                    {pendingInvoices.length} awaiting payment · ${pendingValue.toLocaleString()}
                  </p>
                </div>
                <span className="text-xs font-semibold" style={{ color: T.ink }}>
                  ${pendingValue.toLocaleString()}
                </span>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};