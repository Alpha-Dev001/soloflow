import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  Mail,
  Phone,
  Globe,
  MapPin,
  Edit2,
  Plus,
  Receipt,
  FolderKanban,
  FileText,
  ExternalLink,
  CheckCircle2,
  Clock,
  Sparkles,
  Trash2
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Avatar } from '../components/ui/Avatar';
import { Modal } from '../components/ui/Modal';
import { Skeleton, CardSkeleton } from '../components/ui/Skeleton';
import { useToast } from '../components/ui/Toast';
import { api } from '../services/api';
import type { Client, Project, Invoice, Proposal, InvoiceItem, ProjectPriority, ProjectStatus } from '../types';
import type { NavPage } from '../components/layout/Sidebar';

/** Format an ISO/UTC date string into a readable date, with a safe fallback. */
function fmtDate(value?: string | number | Date | null): string {
  if (value === null || value === undefined || value === '') return '—';
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/** Whether the given value represents a valid, usable date (createdAt etc.). */
function isUsableDate(value?: string | number | Date | null): boolean {
  if (value === null || value === undefined || value === '') return false;
  const d = value instanceof Date ? value : new Date(value);
  return !Number.isNaN(d.getTime());
}

interface ClientDetailPageProps {
  clientId: string;
  onBack: () => void;
  onNavigate: (page: NavPage, param?: string) => void;
  onUpdateClient: (id: string, update: Partial<Client>) => Promise<void>;
}

export const ClientDetailPage: React.FC<ClientDetailPageProps> = ({
  clientId,
  onBack,
  onNavigate,
  onUpdateClient
}) => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [client, setClient] = useState<Client | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'projects' | 'invoices' | 'proposals' | 'notes'>('overview');
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [noteText, setNoteText] = useState('');

  // ── Contextual Project Creation State ──
  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false);
  const [projectForm, setProjectForm] = useState({
    title: '',
    description: '',
    budget: 3500,
    priority: 'Medium' as ProjectPriority,
    status: 'To Do' as ProjectStatus,
    deadline: 'May 30, 2024'
  });

  // ── Contextual Invoice Creation State ──
  const [isCreateInvoiceOpen, setIsCreateInvoiceOpen] = useState(false);
  const defaultDueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const [invoiceDueDate, setInvoiceDueDate] = useState(defaultDueDate);
  const [invoiceTaxRate, setInvoiceTaxRate] = useState(0);
  const [invoiceNotes, setInvoiceNotes] = useState('');
  const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([
    { id: '1', description: 'Design & Development Milestone', quantity: 1, unitPrice: 3500, amount: 3500 }
  ]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getClientById(clientId);
      setClient(res.client);
      setProjects(res.projects);
      setProposals(res.proposals);
      setInvoices(res.invoices);
      setNoteText(res.client.notes || '');
    } catch (e) {
      console.error(e);
      setClient(null);
      setError('Unable to load this client. It may have been deleted or you may not have permission to view it.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [clientId]);

  if (loading) {
    return (
      <div className="space-y-4 max-w-7xl mx-auto">
        {/* Back link */}
        <Skeleton className="h-4 w-20" />

        {/* Client header card */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-[#EDE8E1]">
          <div className="flex items-center gap-3">
            <Skeleton variant="circular" className="w-10 h-10" />
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-28" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-20 rounded-lg" />
            <Skeleton className="h-8 w-24 rounded-lg" />
          </div>
        </div>

        {/* Segmented tabs */}
        <div className="flex items-center gap-1 bg-[#F4F0EA] p-1 rounded-xl w-max max-w-full">
          {['Overview', 'Projects', 'Invoices', 'Proposals', 'Notes'].map(tab => (
            <Skeleton key={tab} className="h-7 w-20 rounded-lg" />
          ))}
        </div>

        {/* Overview grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          {/* Left column: contact + spend */}
          <div className="space-y-3">
            <Card padding="md" className="space-y-2.5">
              <Skeleton className="h-3.5 w-24" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-11/12" />
              <Skeleton className="h-3 w-2/3" />
              <Skeleton className="h-3 w-3/4" />
            </Card>
            <Card padding="md" className="space-y-2.5">
              <Skeleton className="h-3.5 w-20" />
              <Skeleton className="h-7 w-28" />
              <Skeleton className="h-3 w-24" />
            </Card>
          </div>

          {/* Right columns: recent projects + recent invoices */}
          <div className="lg:col-span-2 space-y-3">
            <Card padding="md" className="space-y-2.5">
              <div className="flex items-center justify-between pb-2 border-b border-[#F4EFEA]">
                <Skeleton className="h-3.5 w-32" />
                <Skeleton className="h-6 w-16 rounded-lg" />
              </div>
              {[1, 2].map(i => (
                <div key={i} className="flex items-center justify-between p-2.5 rounded-lg bg-[#F4F0EA]">
                  <div className="space-y-1.5">
                    <Skeleton className="h-3 w-36" />
                    <Skeleton className="h-2.5 w-24" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-3 w-12" />
                    <Skeleton className="h-5 w-14 rounded-full" />
                  </div>
                </div>
              ))}
            </Card>
            <Card padding="md" className="space-y-2.5">
              <div className="flex items-center justify-between pb-2 border-b border-[#F4EFEA]">
                <Skeleton className="h-3.5 w-28" />
                <Skeleton className="h-6 w-16 rounded-lg" />
              </div>
              {[1, 2].map(i => (
                <div key={i} className="flex items-center justify-between p-2.5 rounded-lg bg-[#F4F0EA]">
                  <div className="space-y-1.5">
                    <Skeleton className="h-3 w-32" />
                    <Skeleton className="h-2.5 w-20" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-3 w-12" />
                    <Skeleton className="h-5 w-14 rounded-full" />
                  </div>
                </div>
              ))}
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (!client) {
    // Not found / no permission / load failure — show a clear empty state
    // instead of an endless blank skeleton.
    return (
      <div className="max-w-md mx-auto text-center py-16">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1 text-xs text-[#0071E3] hover:underline cursor-pointer"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          <span>Back to Clients</span>
        </button>
        <div className="mt-6 p-8 rounded-2xl border border-[#EDE8E1] bg-white space-y-2">
          <div className="mx-auto w-12 h-12 rounded-full bg-[#F4F0EA] text-[#8C8278] flex items-center justify-center text-xl font-semibold">
            !
          </div>
          <h2 className="text-base font-semibold text-[#1A1918]">Client Not Found</h2>
          <p className="text-xs leading-relaxed text-[#6B6158]">
            {error || 'We couldn\u2019t find a client matching this link. It may have been removed, or you may not have access to it.'}
          </p>
          <Button onClick={onBack} variant="primary" size="sm" className="mt-3">
            Go to Clients
          </Button>
        </div>
      </div>
    );
  }

  const handleSaveNotes = async () => {
    await onUpdateClient(client.id, { notes: noteText });
    setClient({ ...client, notes: noteText });
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      {/* Back Button */}
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1 text-xs font-medium text-[#8C8278] hover:text-[#1A1918] transition-colors cursor-pointer"
      >
        <ChevronLeft className="w-3.5 h-3.5" />
        <span>Back to Clients</span>
      </button>

      {/* ══ Client Hero Banner ══ */}
      <div
        className="relative overflow-hidden rounded-2xl border p-6 sm:p-7"
        style={{
          backgroundColor: '#453B33',
          backgroundImage: [
            'radial-gradient(ellipse 70% 90% at 88% -18%, rgba(201,183,158,0.22) 0%, transparent 60%)',
            'linear-gradient(150deg, #57473A 0%, #4A3C2F 55%, #3E3126 100%)',
          ].join(', '),
          borderColor: 'rgba(147,122,98,0.35)',
        }}
      >
        <div aria-hidden className="auth-grain absolute inset-0" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          {/* Identity */}
          <div className="flex items-center gap-4">
            <Avatar name={client.name} size="lg" />
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-white">
                  {client.name}
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#C9B79E]/20 text-[#E4D5BE] border border-[#C9B79E]/30">
                  {client.status}
                </span>
              </div>
              <p className="text-[11px] text-white/60 mt-1">
                {isUsableDate(client.createdAt)
                  ? <>Partner since {fmtDate(client.createdAt)}</>
                  : 'Client added recently'}
                {' · '}{projects.length} project{projects.length === 1 ? '' : 's'} · {invoices.length} invoice{invoices.length === 1 ? '' : 's'}
              </p>

              {/* Contact chips */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-3">
                {client.email && (
                  <a href={`mailto:${client.email}`} className="inline-flex items-center gap-1.5 text-[11px] text-white/75 hover:text-white transition-colors">
                    <Mail className="w-3 h-3 text-[#C9B79E]" />
                    {client.email}
                  </a>
                )}
                {client.phone && (
                  <a href={`tel:${client.phone}`} className="inline-flex items-center gap-1.5 text-[11px] text-white/75 hover:text-white transition-colors">
                    <Phone className="w-3 h-3 text-[#C9B79E]" />
                    {client.phone}
                  </a>
                )}
                {client.website && (
                  <a
                    href={client.website.startsWith('http') ? client.website : `https://${client.website}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-[11px] text-white/75 hover:text-white transition-colors"
                  >
                    <Globe className="w-3 h-3 text-[#C9B79E]" />
                    {client.website.replace(/^https?:\/\//, '')}
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <Button
              onClick={() => setIsCreateProjectOpen(true)}
              variant="secondary"
              size="sm"
              icon={<Plus className="w-3 h-3" />}
            >
              New Project
            </Button>
            <Button
              onClick={() => navigate(`/proposals/new?clientId=${encodeURIComponent(client.id)}`)}
              variant="secondary"
              size="sm"
              icon={<Sparkles className="w-3 h-3 text-[#C9B79E]" />}
            >
              New Proposal
            </Button>
            <Button
              onClick={() => setIsCreateInvoiceOpen(true)}
              variant="primary"
              size="sm"
              icon={<Plus className="w-3 h-3" />}
            >
              New Invoice
            </Button>
          </div>
        </div>
      </div>

      {/* ══ Stats Strip ══ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card padding="md">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#F0E9E0] text-[#82694E] flex items-center justify-center shrink-0">
              <Receipt className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-[17px] font-semibold text-[#1A1918] tracking-tight leading-tight">
                ${(client.totalSpent || 0).toLocaleString()}
              </div>
              <div className="text-[10px] text-[#8C8278] uppercase tracking-wide">Lifetime Spend</div>
            </div>
          </div>
        </Card>
        <Card padding="md">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#EEF0EC] text-[#5A6B5D] flex items-center justify-center shrink-0">
              <FolderKanban className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-[17px] font-semibold text-[#1A1918] tracking-tight leading-tight">
                {projects.length}
              </div>
              <div className="text-[10px] text-[#8C8278] uppercase tracking-wide">Projects</div>
            </div>
          </div>
        </Card>
        <Card padding="md">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#F0ECE4] text-[#82694E] flex items-center justify-center shrink-0">
              <Receipt className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-[17px] font-semibold text-[#1A1918] tracking-tight leading-tight">
                {invoices.length}
              </div>
              <div className="text-[10px] text-[#8C8278] uppercase tracking-wide">
                Invoices · ${(invoices.reduce((s, i) => s + (i.total || 0), 0)).toLocaleString()}
              </div>
            </div>
          </div>
        </Card>
        <Card padding="md">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#EFEDF0] text-[#6B5F73] flex items-center justify-center shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-[17px] font-semibold text-[#1A1918] tracking-tight leading-tight">
                {proposals.length}
              </div>
              <div className="text-[10px] text-[#8C8278] uppercase tracking-wide">Proposals</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Segmented Tabs */}
      <div className="segmented-control self-start overflow-x-auto max-w-full">
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'projects', label: `Projects (${projects.length})` },
          { id: 'invoices', label: `Invoices (${invoices.length})` },
          { id: 'proposals', label: `Proposals (${proposals.length})` },
          { id: 'notes', label: 'Notes' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-3 py-1.5 text-xs rounded-md transition-all cursor-pointer whitespace-nowrap ${activeTab === tab.id
              ? 'bg-white text-[#4A3F35] font-medium shadow-2xs'
              : 'text-[#7A6548] hover:text-[#5C4D35]'
              }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Left Column: Contact info & Notes */}
          <div className="space-y-4">
            <Card padding="md" className="space-y-1">
              <h3 className="font-semibold text-[13px] text-[#1A1918] pb-3 border-b border-[#EDE8E1] mb-2">
                Contact Information
              </h3>
              {[
                { icon: <Mail className="w-3.5 h-3.5" />, label: 'Email', value: client.email, href: client.email ? `mailto:${client.email}` : undefined },
                { icon: <Phone className="w-3.5 h-3.5" />, label: 'Phone', value: client.phone, href: client.phone ? `tel:${client.phone}` : undefined },
                {
                  icon: <Globe className="w-3.5 h-3.5" />,
                  label: 'Website',
                  value: client.website,
                  href: client.website ? (client.website.startsWith('http') ? client.website : `https://${client.website}`) : undefined,
                  external: true,
                },
                { icon: <MapPin className="w-3.5 h-3.5" />, label: 'Location', value: client.address },
              ].map(row => (
                <div key={row.label} className="flex items-start gap-3 py-2 border-b border-[#F4EFEA] last:border-0">
                  <span className="text-[#B0A496] mt-0.5 shrink-0">{row.icon}</span>
                  <div className="min-w-0">
                    <div className="text-[10px] uppercase tracking-wide text-[#A89D91]">{row.label}</div>
                    {row.value ? (
                      row.href ? (
                        <a
                          href={row.href}
                          target={row.external ? '_blank' : undefined}
                          rel={row.external ? 'noreferrer' : undefined}
                          className="text-xs font-medium text-[#1A1918] hover:text-[#82694E] transition-colors break-all inline-flex items-center gap-1"
                        >
                          {row.value}
                          {row.external && <ExternalLink className="w-2.5 h-2.5 opacity-60" />}
                        </a>
                      ) : (
                        <div className="text-xs font-medium text-[#1A1918] break-words">{row.value}</div>
                      )
                    ) : (
                      <div className="text-xs text-[#B8AEA2] italic">Not provided</div>
                    )}
                  </div>
                </div>
              ))}
            </Card>

            <Card padding="md">
              <h3 className="font-semibold text-[13px] text-[#1A1918] pb-3 border-b border-[#EDE8E1] mb-3">
                Working Notes
              </h3>
              {client.notes ? (
                <p className="text-xs leading-relaxed text-[#6B6158] whitespace-pre-line line-clamp-6">
                  {client.notes}
                </p>
              ) : (
                <p className="text-xs text-[#B8AEA2] italic">
                  No notes yet — add preferences and context in the Notes tab.
                </p>
              )}
            </Card>
          </div>

          {/* Right Column: Recent Projects & Invoices */}
          <div className="lg:col-span-2 space-y-3">
            <Card padding="md" className="space-y-2.5">
              <div className="flex items-center justify-between pb-2 border-b border-[#EDE8E1]">
                <h3 className="font-semibold text-xs text-[#1A1918]">Projects ({projects.length})</h3>
                <Button
                  onClick={() => setIsCreateProjectOpen(true)}
                  variant="ghost"
                  size="xs"
                  className="text-[11px]"
                  icon={<Plus className="w-3 h-3" />}
                >
                  Add Project
                </Button>
              </div>

              {projects.length === 0 ? (
                <div className="py-6 text-center text-xs text-[#B8AEA2]">
                  No projects recorded for this client yet.
                </div>
              ) : (
                <div className="space-y-2">
                  {projects.map(p => (
                    <div
                      key={p.id}
                      onClick={() => onNavigate('projects')}
                      className="group flex items-center justify-between gap-3 p-3 rounded-xl border border-[#EDE8E1] bg-white hover:border-[#D9CFC2] hover:shadow-sm transition-all cursor-pointer"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-[#EEF0EC] text-[#5A6B5D] flex items-center justify-center shrink-0">
                          <FolderKanban className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0">
                          <div className="font-medium text-xs text-[#1A1918] truncate">{p.title}</div>
                          <div className="text-[10px] text-[#8C8278]">Due {fmtDate(p.deadline)}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-xs font-semibold text-[#1A1918]">
                          ${(p.budget || 0).toLocaleString()}
                        </span>
                        <Badge variant={p.status.toLowerCase() as any} size="sm">
                          {p.status}
                        </Badge>
                        <ChevronRight className="w-3.5 h-3.5 text-[#C9BFB2] group-hover:text-[#82694E] group-hover:translate-x-0.5 transition-all shrink-0" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <Card padding="md" className="space-y-2.5">
              <div className="flex items-center justify-between pb-2 border-b border-[#EDE8E1]">
                <h3 className="font-semibold text-xs text-[#1A1918]">Invoices ({invoices.length})</h3>
                <Button
                  onClick={() => setIsCreateInvoiceOpen(true)}
                  variant="ghost"
                  size="xs"
                  className="text-[11px]"
                  icon={<Plus className="w-3 h-3" />}
                >
                  Issue Invoice
                </Button>
              </div>

              {invoices.length === 0 ? (
                <div className="py-6 text-center text-xs text-[#B8AEA2]">
                  No invoices issued for this client yet.
                </div>
              ) : (
                <div className="space-y-2">
                  {invoices.map(inv => (
                    <div
                      key={inv.id}
                      onClick={() => onNavigate('invoices')}
                      className="group flex items-center justify-between gap-3 p-3 rounded-xl border border-[#EDE8E1] bg-white hover:border-[#D9CFC2] hover:shadow-sm transition-all cursor-pointer"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-[#F0E9E0] text-[#82694E] flex items-center justify-center shrink-0">
                          <Receipt className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0">
                          <div className="font-mono text-xs font-medium text-[#1A1918] truncate">{inv.invoiceNumber}</div>
                          <div className="text-[10px] text-[#8C8278]">Due {fmtDate(inv.dueDate)}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-xs font-semibold text-[#1A1918]">
                          ${inv.total.toLocaleString()}
                        </span>
                        <Badge variant={inv.status.toLowerCase() as any} size="sm">
                          {inv.status}
                        </Badge>
                        <ChevronRight className="w-3.5 h-3.5 text-[#C9BFB2] group-hover:text-[#82694E] group-hover:translate-x-0.5 transition-all shrink-0" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>
      )}

      {/* Projects Tab */}
      {activeTab === 'projects' && (
        <Card padding="md" className="space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#EDE8E1]">
            <h3 className="font-semibold text-xs text-[#1A1918]">Projects for {client.name}</h3>
            <Button
              onClick={() => setIsCreateProjectOpen(true)}
              variant="primary"
              size="xs"
              icon={<Plus className="w-3 h-3" />}
            >
              New Project
            </Button>
          </div>
          {projects.length === 0 ? (
            <div className="py-8 text-center text-xs text-[#B8AEA2]">No projects for this client yet.</div>
          ) : (
            projects.map(p => (
              <div key={p.id} className="flex items-center justify-between gap-3 p-3.5 rounded-xl border border-[#EDE8E1] bg-white hover:border-[#D9CFC2] hover:shadow-sm transition-all">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-[#EEF0EC] text-[#5A6B5D] flex items-center justify-center shrink-0">
                    <FolderKanban className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-medium text-[13px] text-[#1A1918] truncate">{p.title}</h4>
                    <p className="text-[11px] text-[#8C8278] mt-0.5 truncate">{p.description || 'No description'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs font-semibold text-[#1A1918]">${(p.budget || 0).toLocaleString()}</span>
                  <Badge size="sm" variant={p.status.toLowerCase() as any}>{p.status}</Badge>
                </div>
              </div>
            ))
          )}
        </Card>
      )}

      {/* Invoices Tab */}
      {activeTab === 'invoices' && (
        <Card padding="md" className="space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#EDE8E1]">
            <h3 className="font-semibold text-xs text-[#1A1918]">Invoices for {client.name}</h3>
            <Button
              onClick={() => setIsCreateInvoiceOpen(true)}
              variant="primary"
              size="xs"
              icon={<Plus className="w-3 h-3" />}
            >
              New Invoice
            </Button>
          </div>
          {invoices.length === 0 ? (
            <div className="py-8 text-center text-xs text-[#B8AEA2]">No invoices issued for this client yet.</div>
          ) : (
            invoices.map(inv => (
              <div key={inv.id} className="flex items-center justify-between gap-3 p-3.5 rounded-xl border border-[#EDE8E1] bg-white hover:border-[#D9CFC2] hover:shadow-sm transition-all">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-[#F0E9E0] text-[#82694E] flex items-center justify-center shrink-0">
                    <Receipt className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-mono text-xs font-medium text-[#1A1918]">{inv.invoiceNumber}</h4>
                    <p className="text-[11px] text-[#8C8278] mt-0.5">Due {fmtDate(inv.dueDate)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs font-semibold text-[#1A1918]">${(inv.total || 0).toLocaleString()}</span>
                  <Badge size="sm" variant={inv.status.toLowerCase() as any}>{inv.status}</Badge>
                </div>
              </div>
            ))
          )}
        </Card>
      )}

      {/* Proposals Tab */}
      {activeTab === 'proposals' && (
        <Card padding="md" className="space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#EDE8E1]">
            <h3 className="font-semibold text-xs text-[#1A1918]">Proposals for {client.name}</h3>
            <Button
              onClick={() => navigate(`/proposals/new?clientId=${encodeURIComponent(client.id)}`)}
              variant="primary"
              size="xs"
              icon={<Sparkles className="w-3 h-3 text-[#C9B79E]" />}
            >
              New Proposal
            </Button>
          </div>
          {proposals.length === 0 ? (
            <div className="py-8 text-center text-xs text-[#B8AEA2]">No proposals created for this client yet.</div>
          ) : (
            proposals.map(prop => (
              <div key={prop.id} className="flex items-center justify-between gap-3 p-3.5 rounded-xl border border-[#EDE8E1] bg-white hover:border-[#D9CFC2] hover:shadow-sm transition-all">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-[#EFEDF0] text-[#6B5F73] flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-medium text-[13px] text-[#1A1918] truncate">{prop.title}</h4>
                    <p className="text-[11px] text-[#8C8278] mt-0.5 font-mono">{prop.proposalNumber}{prop.timeline ? ` · ${prop.timeline}` : ''}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs font-semibold text-[#1A1918]">${(prop.amount || 0).toLocaleString()}</span>
                  <Badge size="sm" variant={prop.status.toLowerCase() as any}>{prop.status}</Badge>
                </div>
              </div>
            ))
          )}
        </Card>
      )}

      {/* Notes Tab */}
      {activeTab === 'notes' && (
        <Card padding="md" className="space-y-3">
          <div>
            <h3 className="font-semibold text-[13px] text-[#1A1918]">Client Preferences & Working Notes</h3>
            <p className="text-[11px] text-[#A89D91] mt-0.5">
              Communication style, timezone, scope preferences — anything useful for future work.
            </p>
          </div>
          <textarea
            rows={6}
            value={noteText}
            onChange={e => setNoteText(e.target.value)}
            placeholder="Add key preferences, communication style, or timezone notes..."
            className="w-full p-3.5 text-xs leading-relaxed bg-[#FAF8F5] border border-[#EDE8E1] rounded-xl focus:outline-none focus:border-[#82694E] focus:ring-2 focus:ring-[#82694E]/10 resize-none transition-all"
          />
          <div className="flex justify-end">
            <Button onClick={handleSaveNotes} variant="primary" size="sm">
              Save Notes
            </Button>
          </div>
        </Card>
      )}

      {/* ══ Create Project for this Client Modal ══ */}
      <Modal
        isOpen={isCreateProjectOpen}
        onClose={() => setIsCreateProjectOpen(false)}
        title={`New Project for ${client.name}`}
        subtitle="This project will be automatically associated with this client."
      >
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (!projectForm.title.trim()) return;
            try {
              await api.createProject({
                ...projectForm,
                clientId: client.id,
                clientName: client.name
              });
              showToast(`Project "${projectForm.title}" created for ${client.name}!`, 'success');
              setIsCreateProjectOpen(false);
              setProjectForm({
                title: '',
                description: '',
                budget: 3500,
                priority: 'Medium',
                status: 'To Do',
                deadline: 'May 30, 2024'
              });
              await loadData();
            } catch (err: any) {
              showToast(err.message || 'Failed to create project', 'error');
            }
          }}
          className="space-y-3.5"
        >
          <div>
            <label className="block text-[11px] font-medium text-[#1A1918] mb-1">
              Project Title *
            </label>
            <input
              type="text"
              required
              value={projectForm.title}
              onChange={e => setProjectForm({ ...projectForm, title: e.target.value })}
              placeholder="e.g. Website Redesign & SEO"
              className="w-full px-2.5 py-1.5 text-xs bg-white border border-[#EDE8E1] rounded-lg focus:outline-none focus:border-[#0071E3] focus:ring-2 focus:ring-[#0071E3]/15"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-[#1A1918] mb-1">
                Associated Client
              </label>
              <input
                type="text"
                disabled
                value={client.name}
                className="w-full px-2.5 py-1.5 text-xs bg-[#F4F0EA] border border-[#EDE8E1] rounded-lg text-[#6B6158] cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-[#1A1918] mb-1">
                Budget (USD)
              </label>
              <input
                type="number"
                value={projectForm.budget}
                onChange={e => setProjectForm({ ...projectForm, budget: Number(e.target.value) })}
                className="w-full px-2.5 py-1.5 text-xs bg-white border border-[#EDE8E1] rounded-lg focus:outline-none focus:border-[#0071E3] focus:ring-2 focus:ring-[#0071E3]/15"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-[#1A1918] mb-1">
                Status
              </label>
              <select
                value={projectForm.status}
                onChange={e => setProjectForm({ ...projectForm, status: e.target.value as any })}
                className="w-full px-2.5 py-1.5 text-xs bg-white border border-[#EDE8E1] rounded-lg focus:outline-none focus:border-[#0071E3]"
              >
                <option value="To Do">To Do</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-[#1A1918] mb-1">
                Priority
              </label>
              <select
                value={projectForm.priority}
                onChange={e => setProjectForm({ ...projectForm, priority: e.target.value as any })}
                className="w-full px-2.5 py-1.5 text-xs bg-white border border-[#EDE8E1] rounded-lg focus:outline-none focus:border-[#0071E3]"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-[#1A1918] mb-1">
                Deadline
              </label>
              <input
                type="text"
                value={projectForm.deadline}
                onChange={e => setProjectForm({ ...projectForm, deadline: e.target.value })}
                placeholder="Jun 20, 2024"
                className="w-full px-2.5 py-1.5 text-xs bg-white border border-[#EDE8E1] rounded-lg focus:outline-none focus:border-[#0071E3] focus:ring-2 focus:ring-[#0071E3]/15"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-[#1A1918] mb-1">
              Description & Scope
            </label>
            <textarea
              rows={3}
              value={projectForm.description}
              onChange={e => setProjectForm({ ...projectForm, description: e.target.value })}
              placeholder="Key project goals, deliverables, and scope notes..."
              className="w-full px-2.5 py-1.5 text-xs bg-white border border-[#EDE8E1] rounded-lg focus:outline-none focus:border-[#0071E3] resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#EDE8E1]">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setIsCreateProjectOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Create Project
            </Button>
          </div>
        </form>
      </Modal>

      {/* ══ Create Invoice for this Client Modal ══ */}
      <Modal
        isOpen={isCreateInvoiceOpen}
        onClose={() => setIsCreateInvoiceOpen(false)}
        title={`New Invoice for ${client.name}`}
        subtitle="This invoice will be automatically linked to this client."
        maxWidth="xl"
      >
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            try {
              await api.createInvoice({
                clientId: client.id,
                clientName: client.name,
                dueDate: invoiceDueDate,
                taxRate: invoiceTaxRate,
                notes: invoiceNotes,
                items: invoiceItems
              });
              showToast(`Invoice registered for ${client.name}!`, 'success');
              setIsCreateInvoiceOpen(false);
              await loadData();
            } catch (err: any) {
              showToast(err.message || 'Failed to create invoice', 'error');
            }
          }}
          className="space-y-3.5"
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-[#1A1918] mb-1">Client</label>
              <input
                type="text"
                disabled
                value={client.name}
                className="w-full px-2.5 py-1.5 text-xs bg-[#F4F0EA] border border-[#EDE8E1] rounded-lg text-[#6B6158] cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-[#1A1918] mb-1">Due Date *</label>
              <input
                type="date"
                required
                value={invoiceDueDate}
                onChange={e => setInvoiceDueDate(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs bg-white border border-[#EDE8E1] rounded-lg focus:outline-none focus:border-[#82694E]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-[#1A1918] mb-1">Tax Rate (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={invoiceTaxRate}
                onChange={e => setInvoiceTaxRate(Number(e.target.value))}
                className="w-full px-2.5 py-1.5 text-xs bg-white border border-[#EDE8E1] rounded-lg focus:outline-none focus:border-[#82694E]"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-medium text-[#1A1918]">Line Items</label>
              <Button
                type="button"
                variant="secondary"
                size="xs"
                icon={<Plus className="w-3 h-3" />}
                onClick={() => setInvoiceItems([...invoiceItems, { id: String(Date.now()), description: 'New service item', quantity: 1, unitPrice: 500, amount: 500 }])}
              >
                Add Item
              </Button>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {invoiceItems.map((item, idx) => (
                <div key={item.id || idx} className="grid grid-cols-12 gap-2 items-center">
                  <input
                    type="text"
                    required
                    placeholder="Description"
                    value={item.description}
                    onChange={e => {
                      const copy = [...invoiceItems];
                      copy[idx] = { ...copy[idx], description: e.target.value };
                      setInvoiceItems(copy);
                    }}
                    className="col-span-6 px-2.5 py-1.5 text-xs bg-white border border-[#EDE8E1] rounded-lg focus:outline-none focus:border-[#82694E]"
                  />
                  <input
                    type="number"
                    min="1"
                    required
                    value={item.quantity}
                    onChange={e => {
                      const qty = Number(e.target.value) || 1;
                      const copy = [...invoiceItems];
                      copy[idx] = { ...copy[idx], quantity: qty, amount: qty * (copy[idx].unitPrice || 0) };
                      setInvoiceItems(copy);
                    }}
                    className="col-span-2 px-2 py-1.5 text-xs bg-white border border-[#EDE8E1] rounded-lg text-right"
                  />
                  <input
                    type="number"
                    min="0"
                    required
                    value={item.unitPrice}
                    onChange={e => {
                      const up = Number(e.target.value) || 0;
                      const copy = [...invoiceItems];
                      copy[idx] = { ...copy[idx], unitPrice: up, amount: (copy[idx].quantity || 1) * up };
                      setInvoiceItems(copy);
                    }}
                    className="col-span-3 px-2 py-1.5 text-xs bg-white border border-[#EDE8E1] rounded-lg text-right"
                  />
                  <div className="col-span-1 flex justify-center">
                    {invoiceItems.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setInvoiceItems(invoiceItems.filter((_, i) => i !== idx))}
                        className="text-[#8C8278] hover:text-red-600 p-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-[#1A1918] mb-1">Notes / Payment Terms</label>
            <textarea
              rows={2}
              value={invoiceNotes}
              onChange={e => setInvoiceNotes(e.target.value)}
              placeholder="Payment due upon receipt. Bank transfer details..."
              className="w-full px-2.5 py-1.5 text-xs bg-white border border-[#EDE8E1] rounded-lg focus:outline-none focus:border-[#82694E] resize-none"
            />
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-[#EDE8E1]">
            <div className="text-xs text-[#8C8278]">
              Total: <span className="font-semibold text-[#1A1918]">${(invoiceItems.reduce((s, it) => s + (it.amount || 0), 0) * (1 + invoiceTaxRate / 100)).toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-2">
              <Button type="button" variant="secondary" size="sm" onClick={() => setIsCreateInvoiceOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm">
                Create Invoice
              </Button>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
};
