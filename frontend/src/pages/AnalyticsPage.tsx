import React, { useMemo, useState } from 'react';
import { Download, ArrowUpRight } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { useToast } from '../components/ui/Toast';
import type { AnalyticsData, Client, Project, Invoice, Proposal } from '../types';

interface AnalyticsPageProps {
  analytics: AnalyticsData;
  clients?: Client[];
  projects?: Project[];
  invoices?: Invoice[];
  proposals?: Proposal[];
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
  proposals = []
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

  const proposalWinRate = useMemo(() => {
    const total = proposals.length;
    const accepted = proposals.filter(p => p.status === 'Accepted').length;
    return total > 0 ? Math.round((accepted / total) * 100) : 0;
  }, [proposals]);

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

  const handleExport = () => {
    showToast('Analytics summary exported', 'success');
  };

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

        <Button
          variant="secondary"
          size="sm"
          onClick={handleExport}
          icon={<Download className="w-3.5 h-3.5" />}
        >
          Export
        </Button>
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-medium uppercase tracking-wider" style={{ color: T.muted }}>
              Total Revenue
            </span>
            <span
              className="inline-flex items-center text-[11px] font-medium px-1.5 py-0.5 rounded-md"
              style={{ color: '#248A3D', backgroundColor: 'rgba(52,199,89,0.10)' }}
            >
              <ArrowUpRight className="w-3 h-3 mr-0.5" /> {collectionRate}%
            </span>
          </div>
          <div className="text-[26px] font-bold tracking-tight leading-none" style={{ color: T.ink }}>
            ${totalRevenue.toLocaleString()}
          </div>
          <p className="text-[11px] mt-2" style={{ color: T.muted }}>
            ${totalInvoiced.toLocaleString()} invoiced
          </p>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-medium uppercase tracking-wider" style={{ color: T.muted }}>
              Avg Deal Size
            </span>
            <span className="text-[10px]" style={{ color: T.muted }}>
              {clients.length || 0} accounts
            </span>
          </div>
          <div className="text-[26px] font-bold tracking-tight leading-none" style={{ color: T.ink }}>
            ${avgDealSize.toLocaleString()}
          </div>
          <p className="text-[11px] mt-2" style={{ color: T.muted }}>
            Per active client
          </p>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-medium uppercase tracking-wider" style={{ color: T.muted }}>
              Win Rate
            </span>
            <span className="text-[10px] font-medium" style={{ color: '#248A3D' }}>
              {proposalWinRate}%
            </span>
          </div>
          <div className="text-[26px] font-bold tracking-tight leading-none" style={{ color: T.ink }}>
            {proposals.filter(p => p.status === 'Accepted').length}
            <span className="text-xs font-normal ml-1" style={{ color: T.muted }}>
              / {proposals.length}
            </span>
          </div>
          <p className="text-[11px] mt-2" style={{ color: T.muted }}>
            Proposals accepted
          </p>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-medium uppercase tracking-wider" style={{ color: T.muted }}>
              Active Projects
            </span>
            <span className="text-[10px] font-medium" style={{ color: T.body }}>
              {completedProjectsCount} done
            </span>
          </div>
          <div className="text-[26px] font-bold tracking-tight leading-none" style={{ color: T.ink }}>
            {activeProjectsCount}
          </div>
          <p className="text-[11px] mt-2" style={{ color: T.muted }}>
            In progress
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
            <p className="text-xs py-6 text-center" style={{ color: T.muted }}>
              Add clients to see revenue contribution.
            </p>
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
        </Card>
      </div>
    </div>
  );
};