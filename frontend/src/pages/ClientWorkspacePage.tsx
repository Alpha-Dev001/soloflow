import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  Mail,
  Phone,
  Globe,
  MapPin,
  Plus,
  Receipt,
  FolderKanban,
  FileText,
  ExternalLink,
  Activity,
  Edit2,
  Clock,
  CheckCircle2,
  LayoutGrid,
  List,
  ArrowRight,
  Calendar as CalendarIcon
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Avatar } from '../components/ui/Avatar';
import { Skeleton } from '../components/ui/Skeleton';
import { useToast } from '../components/ui/Toast';
import { api } from '../services/api';
import type { Client, Project, Invoice, ActivityItem } from '../types';
import type { NavPage } from '../components/layout/Sidebar';

function fmtDate(value?: string | number | Date | null): string {
  if (value === null || value === undefined || value === '') return '\u2014';
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return '\u2014';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function isUsableDate(value?: string | number | Date | null): boolean {
  if (value === null || value === undefined || value === '') return false;
  const d = value instanceof Date ? value : new Date(value);
  return !Number.isNaN(d.getTime());
}

interface ClientWorkspacePageProps {
  onNavigate: (page: NavPage, param?: string) => void;
  onUpdateClient: (id: string, update: Partial<Client>) => Promise<void>;
  onDeleteClient: (id: string) => Promise<void>;
  onRefresh: () => Promise<void>;
}

type Tab = 'overview' | 'projects' | 'invoices' | 'notes' | 'activity';
type ProjectView = 'board' | 'list';

const TABS: { id: Tab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'projects', label: 'Projects' },
  { id: 'invoices', label: 'Invoices' },
  { id: 'notes', label: 'Notes' },
  { id: 'activity', label: 'Activity' },
];

/* ── Design tokens ── */
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

/* ── Dot colors for status ── */
const statusDot: Record<string, string> = {
  'To Do': '#FF9500',
  'In Progress': '#0071E3',
  'Completed': '#34C759',
  'On Hold': '#FF9500',
  'Cancelled': T.muted,
  'Draft': T.muted,
  'Sent': '#0071E3',
  'Viewed': '#B4552F',
  'Accepted': '#34C759',
  'Rejected': '#FF3B30',
  'Expired': T.muted,
  'Paid': '#34C759',
  'Pending': '#FF9500',
  'Overdue': '#FF3B30',
};

export const ClientWorkspacePage: React.FC<ClientWorkspacePageProps> = ({
  onNavigate,
  onUpdateClient,
  onDeleteClient,
  onRefresh
}) => {
  const { clientId } = useParams<{ clientId: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [client, setClient] = useState<Client | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [noteText, setNoteText] = useState('');
  const [projectView, setProjectView] = useState<ProjectView>('board');
  const [editingClient, setEditingClient] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', email: '', company: '', phone: '', website: '', address: '', status: 'Active' as 'Active' | 'Lead' | 'Inactive', notes: '' });

  const loadData = async () => {
    if (!clientId) return;
    try {
      setLoading(true);
      setError(null);
      const res = await api.getClientById(clientId);
      setClient(res.client);
      setProjects(res.projects);
      setInvoices(res.invoices);
      setActivities(res.activities || []);
      setNoteText(res.client.notes || '');
    } catch (e) {
      console.error(e);
      setClient(null);
      setError('Unable to load this client. It may have been deleted or you may not have permission to view it.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [clientId]);

  if (loading) {
    return (
      <div className="space-y-5 max-w-7xl mx-auto">
        <Skeleton className="h-4 w-20" />
        <div className="flex items-center gap-3">
          <Skeleton variant="circular" className="w-12 h-12" />
          <div className="space-y-1.5"><Skeleton className="h-5 w-40" /><Skeleton className="h-3 w-28" /></div>
        </div>
        <div className="flex gap-5 border-b pb-3" style={{ borderColor: T.border }}>
          {TABS.map(t => <Skeleton key={t.id} className="h-4 w-16" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-8 space-y-4">
            <Card padding="md" className="space-y-3"><Skeleton className="h-4 w-32" /><Skeleton className="h-3 w-full" /><Skeleton className="h-3 w-2/3" /></Card>
          </div>
          <div className="lg:col-span-4 space-y-4">
            <Card padding="md" className="space-y-3"><Skeleton className="h-4 w-24" /><Skeleton className="h-3 w-full" /></Card>
          </div>
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="max-w-md mx-auto text-center py-16">
        <button onClick={() => navigate('/clients')} className="inline-flex items-center gap-1 text-xs hover:underline cursor-pointer" style={{ color: T.accent }}>
          <ChevronLeft className="w-3.5 h-3.5" /><span>Back to Clients</span>
        </button>
        <div className="mt-6 p-8 rounded-2xl border bg-white space-y-2" style={{ borderColor: T.border }}>
          <div className="mx-auto w-12 h-12 rounded-full flex items-center justify-center text-xl font-semibold" style={{ backgroundColor: T.surfaceWarm, color: T.muted }}>!</div>
          <h2 className="text-base font-semibold" style={{ color: T.ink }}>Client Not Found</h2>
          <p className="text-xs leading-relaxed" style={{ color: T.body }}>{error || 'This client may have been removed or you may not have access.'}</p>
          <Button onClick={() => navigate('/clients')} variant="primary" size="sm" className="mt-3">Go to Clients</Button>
        </div>
      </div>
    );
  }

  const handleSaveNotes = async () => {
    await onUpdateClient(client.id, { notes: noteText });
    setClient({ ...client, notes: noteText });
    showToast('Notes saved', 'success');
  };

  const handleOpenEdit = () => {
    setEditForm({
      name: client.name, email: client.email || '', company: client.company || '',
      phone: client.phone || '', website: client.website || '', address: client.address || '',
      status: client.status, notes: client.notes || ''
    });
    setEditingClient(true);
  };

  const handleSaveEdit = async () => {
    try { await onUpdateClient(client.id, editForm); setEditingClient(false); await loadData(); } catch {}
  };

  const handleUpdateProjectStatus = async (projectId: string, newStatus: string) => {
    try {
      await api.updateProjectStatus(projectId, newStatus);
      await loadData();
      showToast(`Project moved to ${newStatus}`, 'success');
    } catch {
      showToast('Failed to update project status', 'error');
    }
  };

  const getPriorityBadge = (priority: string) => {
    const colors: Record<string, { bg: string; fg: string; border: string }> = {
      Urgent: { bg: '#FF3B3010', fg: '#D70015', border: '#FF3B3020' },
      High: { bg: '#FF950010', fg: '#C97100', border: '#FF950020' },
      Medium: { bg: '#0071E310', fg: '#0071E3', border: '#0071E320' },
      Low: { bg: '#8E8E9310', fg: '#636366', border: '#8E8E9320' },
    };
    const c = colors[priority] || colors.Medium;
    return (
      <span className="text-[9px] font-medium px-1.5 py-0.5 rounded" style={{ backgroundColor: c.bg, color: c.fg, border: `1px solid ${c.border}` }}>
        {priority}
      </span>
    );
  };

  const activeProjects = projects.filter(p => p.status === 'In Progress' || p.status === 'To Do');
  const outstandingInvoices = invoices.filter(i => i.status !== 'Paid');
  const totalRevenue = invoices.filter(i => i.status === 'Paid').reduce((s, i) => s + (i.total || 0), 0);

  const inputClass = 'w-full px-3 py-2 text-[13px] bg-white border rounded-lg transition-all focus:outline-none focus:border-[#937A62] focus:ring-2 focus:ring-[#937A62]/15';

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      {/* Back */}
      <button onClick={() => navigate('/clients')} className="inline-flex items-center gap-1 text-xs font-medium cursor-pointer hover:underline" style={{ color: T.accent }}>
        <ChevronLeft className="w-3.5 h-3.5" /><span>Back to Clients</span>
      </button>

      {/* ══ Client Header ══ */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <Avatar name={client.name} size="lg" />
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight" style={{ color: T.ink }}>{client.name}</h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider" style={{ backgroundColor: `${statusDot[client.status] || T.muted}18`, color: statusDot[client.status] || T.muted, border: `1px solid ${statusDot[client.status] || T.muted}30` }}>{client.status}</span>
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5">
              {client.email && (
                <a href={`mailto:${client.email}`} className="inline-flex items-center gap-1 text-[11px] hover:underline" style={{ color: T.muted }}>
                  <Mail className="w-3 h-3" />{client.email}
                </a>
              )}
              {client.phone && (
                <a href={`tel:${client.phone}`} className="inline-flex items-center gap-1 text-[11px] hover:underline" style={{ color: T.muted }}>
                  <Phone className="w-3 h-3" />{client.phone}
                </a>
              )}
              {client.website && (
                <a href={client.website.startsWith('http') ? client.website : `https://${client.website}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[11px] hover:underline" style={{ color: T.muted }}>
                  <Globe className="w-3 h-3" />{client.website.replace(/^https?:\/\//, '')}
                </a>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button onClick={() => navigate(`/clients/${clientId}/projects/new`)} variant="secondary" size="sm" icon={<Plus className="w-3 h-3" />}>New Project</Button>
          <Button onClick={() => navigate(`/clients/${clientId}/invoices/new`)} variant="primary" size="sm" icon={<Plus className="w-3 h-3" />}>New Invoice</Button>
          <button onClick={handleOpenEdit} className="p-2 rounded-lg cursor-pointer transition-colors hover:bg-[#F1EDE7]" style={{ color: T.muted }} title="Edit client">
            <Edit2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ══ Tab Filters — underline style (Calendar pattern) ══ */}
      <div className="flex items-center gap-5 overflow-x-auto pb-0 border-b" style={{ borderColor: T.border }}>
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="relative pb-2.5 text-xs whitespace-nowrap cursor-pointer transition-colors"
            style={{ color: activeTab === tab.id ? T.ink : T.muted, fontWeight: activeTab === tab.id ? 600 : 400 }}
          >
            {tab.label}
            {activeTab === tab.id && (
              <span className="absolute left-0 right-0 bottom-[-1px] h-[2px] rounded-full" style={{ backgroundColor: T.accent }} />
            )}
          </button>
        ))}
      </div>

      {/* ═══════════════════ OVERVIEW TAB ═══════════════════ */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Left: Main Content (8 cols) */}
          <div className="lg:col-span-8 space-y-4">
            {/* Stats Row */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { label: 'Revenue', value: `$${totalRevenue.toLocaleString()}`, icon: <Receipt className="w-3.5 h-3.5" />, bg: '#F0E9E0', fg: '#82694E' },
                { label: 'Active Projects', value: String(activeProjects.length), icon: <FolderKanban className="w-3.5 h-3.5" />, bg: '#EEF0EC', fg: '#5A6B5D' },
                { label: 'Outstanding', value: String(outstandingInvoices.length), icon: <Clock className="w-3.5 h-3.5" />, bg: '#F5EDED', fg: '#B4552F' },
              ].map(s => (
                <div key={s.label} className="p-3 rounded-xl border" style={{ borderColor: T.border, backgroundColor: T.surface }}>
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: s.bg, color: s.fg }}>{s.icon}</div>
                    <div className="min-w-0">
                      <div className="text-lg font-bold tracking-tight leading-none" style={{ color: T.ink }}>{s.value}</div>
                      <div className="text-[10px] uppercase font-medium tracking-wide mt-0.5" style={{ color: T.muted }}>{s.label}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Recent Projects */}
            <Card padding="md">
              <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: T.bg }}>
                <h3 className="font-semibold text-xs" style={{ color: T.ink }}>Recent Projects</h3>
                {projects.length > 0 && (
                  <button onClick={() => setActiveTab('projects')} className="text-[10px] font-bold hover:underline cursor-pointer" style={{ color: T.accent }}>View all &rarr;</button>
                )}
              </div>
              {projects.length === 0 ? (
                <div className="py-8 text-center border border-dashed rounded-xl mt-3" style={{ borderColor: T.border }}>
                  <p className="text-xs" style={{ color: T.muted }}>No projects yet.</p>
                  <button onClick={() => navigate(`/clients/${clientId}/projects/new`)} className="mt-1.5 text-xs font-semibold hover:underline cursor-pointer" style={{ color: T.accent }}>+ Create Project</button>
                </div>
              ) : (
                <div className="space-y-1 pt-2">
                  {projects.slice(0, 4).map(p => (
                    <div key={p.id} className="flex items-center justify-between gap-3 px-2 py-2.5 rounded-lg transition-colors hover:bg-[#F1EDE7]">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: statusDot[p.status] || T.muted }} />
                        <div className="min-w-0">
                          <div className="text-xs font-semibold truncate" style={{ color: T.ink }}>{p.title}</div>
                          <div className="text-[11px] truncate" style={{ color: T.muted }}>Due {fmtDate(p.deadline)}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2.5 shrink-0">
                        <span className="text-[11px] font-semibold tabular-nums" style={{ color: T.ink }}>${(p.budget || 0).toLocaleString()}</span>
                        <Badge size="sm" variant={p.status.toLowerCase() as any}>{p.status}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Recent Invoices */}
            <Card padding="md">
              <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: T.bg }}>
                <h3 className="font-semibold text-xs" style={{ color: T.ink }}>Recent Invoices</h3>
                {invoices.length > 0 && (
                  <button onClick={() => setActiveTab('invoices')} className="text-[10px] font-bold hover:underline cursor-pointer" style={{ color: T.accent }}>View all &rarr;</button>
                )}
              </div>
              {invoices.length === 0 ? (
                <div className="py-8 text-center border border-dashed rounded-xl mt-3" style={{ borderColor: T.border }}>
                  <p className="text-xs" style={{ color: T.muted }}>No invoices yet.</p>
                  <button onClick={() => navigate(`/clients/${clientId}/invoices/new`)} className="mt-1.5 text-xs font-semibold hover:underline cursor-pointer" style={{ color: T.accent }}>+ Create Invoice</button>
                </div>
              ) : (
                <div className="space-y-1 pt-2">
                  {invoices.slice(0, 4).map(inv => (
                    <button key={inv.id} onClick={() => navigate(`/invoices/${inv.id}`)} className="w-full flex items-center justify-between gap-3 px-2 py-2.5 rounded-lg transition-colors hover:bg-[#F1EDE7] cursor-pointer text-left">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: statusDot[inv.status] || T.muted }} />
                        <div className="min-w-0">
                          <div className="text-xs font-semibold font-mono truncate" style={{ color: T.ink }}>{inv.invoiceNumber}</div>
                          <div className="text-[11px] truncate" style={{ color: T.muted }}>Due {fmtDate(inv.dueDate)}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2.5 shrink-0">
                        <span className="text-[11px] font-semibold tabular-nums" style={{ color: T.ink }}>${(inv.total || 0).toLocaleString()}</span>
                        <Badge size="sm" variant={inv.status.toLowerCase() as any}>{inv.status}</Badge>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* Right: Context Panel (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            {/* Quick Actions */}
            <Card padding="md">
              <div className="pb-3 border-b" style={{ borderColor: T.bg }}>
                <h3 className="font-bold text-xs" style={{ color: T.ink }}>Quick Actions</h3>
              </div>
              <div className="space-y-1.5 pt-3">
                {[
                  { label: 'New Project', icon: <FolderKanban className="w-3.5 h-3.5" />, to: `/clients/${clientId}/projects/new` },
                  { label: 'New Invoice', icon: <Receipt className="w-3.5 h-3.5" />, to: `/clients/${clientId}/invoices/new` },
                ].map(a => (
                  <button key={a.label} onClick={() => navigate(a.to)} className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium cursor-pointer transition-colors hover:bg-[#F1EDE7]" style={{ color: T.body }}>
                    <span className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: T.surfaceWarm, border: `1px solid ${T.border}`, color: T.accent }}>{a.icon}</span>
                    {a.label}
                  </button>
                ))}
              </div>
            </Card>

            {/* Contact Info */}
            <Card padding="md">
              <div className="pb-3 border-b" style={{ borderColor: T.bg }}>
                <h3 className="font-bold text-xs" style={{ color: T.ink }}>Contact</h3>
              </div>
              <div className="pt-3 space-y-0">
                {[
                  { icon: <Mail className="w-3 h-3" />, label: 'Email', value: client.email, href: client.email ? `mailto:${client.email}` : undefined },
                  { icon: <Phone className="w-3 h-3" />, label: 'Phone', value: client.phone, href: client.phone ? `tel:${client.phone}` : undefined },
                  { icon: <Globe className="w-3 h-3" />, label: 'Website', value: client.website, href: client.website ? (client.website.startsWith('http') ? client.website : `https://${client.website}`) : undefined, external: true },
                  { icon: <MapPin className="w-3 h-3" />, label: 'Location', value: client.address },
                ].map(row => (
                  <div key={row.label} className="flex items-start gap-2.5 py-2 border-b last:border-0" style={{ borderColor: '#F4F0EA' }}>
                    <span className="mt-0.5 shrink-0" style={{ color: T.accentSoft }}>{row.icon}</span>
                    <div className="min-w-0">
                      <div className="text-[9px] uppercase font-medium tracking-wide" style={{ color: T.muted }}>{row.label}</div>
                      {row.value ? (
                        row.href ? (
                          <a href={row.href} target={row.external ? '_blank' : undefined} rel={row.external ? 'noreferrer' : undefined}
                            className="text-xs font-medium break-all inline-flex items-center gap-1 hover:underline" style={{ color: T.ink }}>
                            {row.value}{row.external && <ExternalLink className="w-2.5 h-2.5 opacity-60" />}
                          </a>
                        ) : <div className="text-xs font-medium break-words" style={{ color: T.ink }}>{row.value}</div>
                      ) : <div className="text-xs italic" style={{ color: T.borderStrong }}>Not provided</div>}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* ═══════════════════ PROJECTS TAB ═══════════════════ */}
      {activeTab === 'projects' && (
        <div className="space-y-4">
          {/* Header with view toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h3 className="font-semibold text-xs" style={{ color: T.ink }}>Projects for {client.name}</h3>
              <div className="segmented-control">
                <button onClick={() => setProjectView('board')} className={`px-2.5 py-1 text-[11px] rounded-md flex items-center gap-1.5 transition-all cursor-pointer ${projectView === 'board' ? 'bg-white font-medium shadow-2xs' : ''}`} style={{ color: projectView === 'board' ? T.ink : T.muted }}>
                  <LayoutGrid className="w-3 h-3" /><span>Board</span>
                </button>
                <button onClick={() => setProjectView('list')} className={`px-2.5 py-1 text-[11px] rounded-md flex items-center gap-1.5 transition-all cursor-pointer ${projectView === 'list' ? 'bg-white font-medium shadow-2xs' : ''}`} style={{ color: projectView === 'list' ? T.ink : T.muted }}>
                  <List className="w-3 h-3" /><span>List</span>
                </button>
              </div>
            </div>
            <Button onClick={() => navigate(`/clients/${clientId}/projects/new`)} variant="primary" size="sm" icon={<Plus className="w-3.5 h-3.5" />}>New Project</Button>
          </div>

          {projects.length === 0 ? (
            <div className="py-12 text-center border border-dashed rounded-xl" style={{ borderColor: T.border }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-3" style={{ backgroundColor: T.surfaceWarm, border: `1px solid ${T.border}`, color: T.accentSoft }}>
                <FolderKanban className="w-5 h-5" />
              </div>
              <p className="text-xs font-semibold" style={{ color: T.ink }}>No projects yet</p>
              <p className="text-[11px] mt-0.5" style={{ color: T.muted }}>Create a project to start tracking deliverables.</p>
              <button onClick={() => navigate(`/clients/${clientId}/projects/new`)} className="mt-3 text-xs font-semibold hover:underline cursor-pointer" style={{ color: T.accent }}>+ Create Project</button>
            </div>
          ) : projectView === 'board' ? (
            /* ── Kanban Board ── */
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {([
                { status: 'To Do', color: '#FF9500', projects: projects.filter(p => p.status === 'To Do') },
                { status: 'In Progress', color: '#0071E3', projects: projects.filter(p => p.status === 'In Progress') },
                { status: 'Completed', color: '#34C759', projects: projects.filter(p => p.status === 'Completed') },
              ]).map(col => (
                <div key={col.status} className="flex flex-col">
                  {/* Column header */}
                  <div className="flex items-center justify-between pb-2 px-1">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: col.color }} />
                      <h4 className="font-semibold text-[11px] uppercase tracking-wide" style={{ color: T.ink }}>{col.status}</h4>
                      <span className="text-[9px] font-medium px-1.5 py-0.5 rounded-full" style={{ backgroundColor: T.surfaceWarm, color: T.muted }}>{col.projects.length}</span>
                    </div>
                  </div>

                  {/* Column cards */}
                  <div className="space-y-2 flex-1 min-h-[80px]">
                    {col.projects.map(proj => (
                      <div key={proj.id} className="p-3 rounded-xl border transition-all group" style={{ borderColor: T.border, backgroundColor: T.surface }}>
                        {/* Priority */}
                        <div className="flex items-center justify-between mb-1.5">
                          {getPriorityBadge(proj.priority)}
                        </div>

                        {/* Title */}
                        <h4 className="text-xs font-semibold mb-1" style={{ color: T.ink }}>{proj.title}</h4>

                        {/* Description */}
                        {proj.description && (
                          <p className="text-[11px] line-clamp-2 mb-2" style={{ color: T.muted }}>{proj.description}</p>
                        )}

                        {/* Footer: deadline + budget + actions */}
                        <div className="flex items-center justify-between pt-2 border-t" style={{ borderColor: '#F4F0EA' }}>
                          <div className="flex items-center gap-1 text-[10px]" style={{ color: T.muted }}>
                            <CalendarIcon className="w-3 h-3" />
                            <span>{proj.deadline}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] font-semibold tabular-nums" style={{ color: T.ink }}>${proj.budget.toLocaleString()}</span>
                            {col.status === 'To Do' && (
                              <button onClick={() => handleUpdateProjectStatus(proj.id, 'In Progress')} title="Move to In Progress" className="p-1 rounded cursor-pointer transition-colors" style={{ color: T.muted }}>
                                <ArrowRight className="w-3 h-3" />
                              </button>
                            )}
                            {col.status === 'In Progress' && (
                              <button onClick={() => handleUpdateProjectStatus(proj.id, 'Completed')} title="Mark as Completed" className="p-1 rounded cursor-pointer transition-colors" style={{ color: T.muted }}>
                                <CheckCircle2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* Add project button */}
                    <button onClick={() => navigate(`/clients/${clientId}/projects/new`)} className="w-full py-2 px-3 border border-dashed rounded-xl text-[11px] font-medium flex items-center justify-center gap-1.5 cursor-pointer transition-all" style={{ borderColor: T.border, color: T.muted }}>
                      <Plus className="w-3 h-3" />Add Project
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* ── List View ── */
            <Card padding="md">
              <div className="space-y-1">
                {projects.map(p => (
                  <div key={p.id} className="flex items-center justify-between gap-3 px-2 py-2.5 rounded-lg transition-colors hover:bg-[#F1EDE7]">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: statusDot[p.status] || T.muted }} />
                      <div className="min-w-0">
                        <div className="text-xs font-semibold truncate" style={{ color: T.ink }}>{p.title}</div>
                        <div className="text-[11px] truncate" style={{ color: T.muted }}>{p.description || 'No description'}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2.5 shrink-0">
                      {getPriorityBadge(p.priority)}
                      <span className="text-[11px] font-semibold tabular-nums" style={{ color: T.ink }}>${(p.budget || 0).toLocaleString()}</span>
                      <Badge size="sm" variant={p.status.toLowerCase() as any}>{p.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}

      {/* ═══════════════════ INVOICES TAB ═══════════════════ */}
      {activeTab === 'invoices' && (
        <Card padding="md">
          <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: T.bg }}>
            <h3 className="font-semibold text-xs" style={{ color: T.ink }}>Invoices for {client.name}</h3>
            <Button onClick={() => navigate(`/clients/${clientId}/invoices/new`)} variant="primary" size="xs" icon={<Plus className="w-3 h-3" />}>New Invoice</Button>
          </div>
          {invoices.length === 0 ? (
            <div className="py-10 text-center border border-dashed rounded-xl mt-3" style={{ borderColor: T.border }}>
              <p className="text-xs" style={{ color: T.muted }}>No invoices for this client yet.</p>
              <button onClick={() => navigate(`/clients/${clientId}/invoices/new`)} className="mt-2 text-xs font-semibold hover:underline cursor-pointer" style={{ color: T.accent }}>+ Create Invoice</button>
            </div>
          ) : (
            <div className="space-y-1 pt-2">
              {invoices.map(inv => (
                <button key={inv.id} onClick={() => navigate(`/invoices/${inv.id}`)} className="w-full flex items-center justify-between gap-3 px-2 py-3 rounded-lg transition-colors hover:bg-[#F1EDE7] cursor-pointer text-left">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: statusDot[inv.status] || T.muted }} />
                    <div className="min-w-0">
                      <div className="text-xs font-semibold font-mono" style={{ color: T.ink }}>{inv.invoiceNumber}</div>
                      <div className="text-[11px]" style={{ color: T.muted }}>Due {fmtDate(inv.dueDate)}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5 shrink-0">
                    <span className="text-[11px] font-semibold tabular-nums" style={{ color: T.ink }}>${(inv.total || 0).toLocaleString()}</span>
                    <Badge size="sm" variant={inv.status.toLowerCase() as any}>{inv.status}</Badge>
                  </div>
                </button>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* ═══════════════════ NOTES TAB ═══════════════════ */}
      {activeTab === 'notes' && (
        <Card padding="md">
          <div className="pb-3 border-b" style={{ borderColor: T.bg }}>
            <h3 className="font-semibold text-xs" style={{ color: T.ink }}>Working Notes</h3>
            <p className="text-[11px] mt-0.5" style={{ color: T.muted }}>Communication style, timezone, scope preferences.</p>
          </div>
          <div className="pt-3">
            <textarea
              rows={6}
              value={noteText}
              onChange={e => setNoteText(e.target.value)}
              placeholder="Add key preferences, communication style, or timezone notes..."
              className="w-full p-3 text-xs leading-relaxed border rounded-xl focus:outline-none focus:border-[#937A62] focus:ring-2 focus:ring-[#937A62]/10 resize-none transition-all"
              style={{ backgroundColor: T.surfaceWarm, borderColor: T.border, color: T.ink }}
            />
            <div className="flex justify-end mt-3">
              <Button onClick={handleSaveNotes} variant="primary" size="sm">Save Notes</Button>
            </div>
          </div>
        </Card>
      )}

      {/* ═══════════════════ ACTIVITY TAB ═══════════════════ */}
      {activeTab === 'activity' && (
        <Card padding="md">
          <div className="pb-3 border-b" style={{ borderColor: T.bg }}>
            <h3 className="font-semibold text-xs" style={{ color: T.ink }}>Recent Activity</h3>
          </div>
          {activities.length === 0 ? (
            <div className="py-10 text-center border border-dashed rounded-xl mt-3" style={{ borderColor: T.border }}>
              <p className="text-xs" style={{ color: T.muted }}>No activity recorded yet.</p>
            </div>
          ) : (
            <div className="space-y-0 pt-2">
              {activities.map(a => (
                <div key={a.id} className="flex items-start gap-2.5 py-2.5 border-b last:border-0" style={{ borderColor: '#F4F0EA' }}>
                  <span className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: T.accentSoft }} />
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-semibold" style={{ color: T.ink }}>{a.title}</div>
                    <div className="text-[11px]" style={{ color: T.muted }}>{a.subtitle}</div>
                  </div>
                  <span className="text-[10px] shrink-0" style={{ color: T.borderStrong }}>{a.timeAgo}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* ══ Edit Client Modal ══ */}
      {editingClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setEditingClient(false)}>
          <div className="bg-white rounded-2xl border shadow-xl w-full max-w-lg mx-4 p-6 space-y-4" style={{ borderColor: T.border }} onClick={e => e.stopPropagation()}>
            <h2 className="text-base font-semibold" style={{ color: T.ink }}>Edit Client</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium mb-1" style={{ color: T.body }}>Name *</label>
                <input type="text" required value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} className={inputClass} />
              </div>
              <div>
                <label className="block text-[11px] font-medium mb-1" style={{ color: T.body }}>Email</label>
                <input type="email" value={editForm.email} onChange={e => setEditForm({ ...editForm, email: e.target.value })} className={inputClass} />
              </div>
              <div>
                <label className="block text-[11px] font-medium mb-1" style={{ color: T.body }}>Company</label>
                <input type="text" value={editForm.company} onChange={e => setEditForm({ ...editForm, company: e.target.value })} className={inputClass} />
              </div>
              <div>
                <label className="block text-[11px] font-medium mb-1" style={{ color: T.body }}>Phone</label>
                <input type="text" value={editForm.phone} onChange={e => setEditForm({ ...editForm, phone: e.target.value })} className={inputClass} />
              </div>
              <div>
                <label className="block text-[11px] font-medium mb-1" style={{ color: T.body }}>Status</label>
                <select value={editForm.status} onChange={e => setEditForm({ ...editForm, status: e.target.value as any })} className={inputClass}>
                  <option value="Active">Active</option>
                  <option value="Lead">Lead</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <Button variant="secondary" size="sm" onClick={() => setEditingClient(false)}>Cancel</Button>
              <Button variant="primary" size="sm" onClick={handleSaveEdit}>Save Changes</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
