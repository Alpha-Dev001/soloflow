import React, { useState, useEffect } from 'react';
import {
  ChevronLeft,
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
  Sparkles
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Avatar } from '../components/ui/Avatar';
import { Modal } from '../components/ui/Modal';
import { Skeleton, CardSkeleton } from '../components/ui/Skeleton';
import { api } from '../services/api';
import type { Client, Project, Invoice, Proposal } from '../types';
import type { NavPage } from '../components/layout/Sidebar';

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
  const [client, setClient] = useState<Client | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'projects' | 'invoices' | 'proposals' | 'notes'>('overview');
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [noteText, setNoteText] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await api.getClientById(clientId);
      setClient(res.client);
      setProjects(res.projects);
      setProposals(res.proposals);
      setInvoices(res.invoices);
      setNoteText(res.client.notes || '');
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [clientId]);

  if (loading || !client) {
    return (
      <div className="space-y-4 max-w-7xl mx-auto">
        <Skeleton className="h-4 w-24" />
        <div className="bg-white p-4 rounded-xl border border-[#EDE8E1] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Skeleton variant="circular" className="w-10 h-10" />
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  const handleSaveNotes = async () => {
    await onUpdateClient(client.id, { notes: noteText });
    setClient({ ...client, notes: noteText });
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* Back Button */}
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1 text-xs text-[#0071E3] hover:underline cursor-pointer"
      >
        <ChevronLeft className="w-3.5 h-3.5" />
        <span>Clients</span>
      </button>

      {/* Client Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-[#EDE8E1]">
        <div className="flex items-center gap-3">
          <Avatar name={client.name} size="md" />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-semibold tracking-tight text-[#1A1918]">{client.name}</h1>
              <Badge size="sm" variant={client.status.toLowerCase() as any}>{client.status}</Badge>
            </div>
            <p className="text-[11px] text-[#8C8278]">
              Partner since {new Date(client.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => onNavigate('invoices')}
            variant="primary"
            size="sm"
            icon={<Plus className="w-3 h-3" />}
          >
            Invoice
          </Button>
        </div>
      </div>

      {/* Apple Segmented Tabs */}
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
            className={`px-2.5 py-1 text-[11px] rounded-md transition-all cursor-pointer whitespace-nowrap ${activeTab === tab.id
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          {/* Left Column: Contact info & Spend */}
          <div className="space-y-3">
            <Card padding="md" className="space-y-3">
              <h3 className="font-semibold text-xs text-[#1A1918] pb-2 border-b border-[#EDE8E1]">
                Contact Info
              </h3>
              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-2 text-[#6E6E73]">
                  <Mail className="w-3.5 h-3.5 text-[#8C8278] shrink-0" />
                  <span className="text-[#1A1918]">{client.email || 'None provided'}</span>
                </div>
                <div className="flex items-center gap-2 text-[#6E6E73]">
                  <Phone className="w-3.5 h-3.5 text-[#8C8278] shrink-0" />
                  <span className="text-[#1A1918]">{client.phone || 'None provided'}</span>
                </div>
                <div className="flex items-center gap-2 text-[#6E6E73]">
                  <Globe className="w-3.5 h-3.5 text-[#8C8278] shrink-0" />
                  {client.website ? (
                    <a
                      href={client.website.startsWith('http') ? client.website : `https://${client.website}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[#0071E3] hover:underline flex items-center gap-0.5"
                    >
                      {client.website} <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  ) : (
                    <span>None provided</span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-[#6E6E73]">
                  <MapPin className="w-3.5 h-3.5 text-[#8C8278] shrink-0" />
                  <span className="text-[#1A1918]">{client.address || 'San Francisco, CA'}</span>
                </div>
              </div>
            </Card>

            <Card padding="md" className="space-y-1">
              <div className="text-[10px] text-[#8C8278] uppercase font-medium">Total Lifetime Spend</div>
              <div className="text-xl font-semibold text-[#1A1918] tracking-tight">
                ${(client.totalSpent || 0).toLocaleString()}
              </div>
              <p className="text-[10px] text-[#8C8278]">
                Across {client.projectsCount || 0} project engagements
              </p>
            </Card>
          </div>

          {/* Right Column: Recent Projects & Invoices */}
          <div className="lg:col-span-2 space-y-3">
            <Card padding="md" className="space-y-2.5">
              <div className="flex items-center justify-between pb-2 border-b border-[#EDE8E1]">
                <h3 className="font-semibold text-xs text-[#1A1918]">Projects</h3>
                <Button
                  onClick={() => onNavigate('projects')}
                  variant="ghost"
                  size="xs"
                  className="text-[11px]"
                >
                  View All
                </Button>
              </div>

              {projects.length === 0 ? (
                <div className="py-4 text-center text-[11px] text-[#8C8278]">
                  No projects recorded for this client.
                </div>
              ) : (
                <div className="space-y-1.5">
                  {projects.map(p => (
                    <div
                      key={p.id}
                      onClick={() => onNavigate('projects')}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-2.5 rounded-lg bg-[#F4F0EA] hover:bg-black/[0.04] transition-colors cursor-pointer gap-1.5"
                    >
                      <div>
                        <div className="font-medium text-xs text-[#1A1918]">{p.title}</div>
                        <div className="text-[10px] text-[#8C8278]">Due {String(p.deadline || 'TBD')}</div>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end gap-2">
                        <span className="text-xs font-semibold text-[#1A1918]">
                          ${(p.budget || 0).toLocaleString()}
                        </span>
                        <Badge variant={p.status.toLowerCase() as any} size="sm">
                          {p.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <Card padding="md" className="space-y-2.5">
              <div className="flex items-center justify-between pb-2 border-b border-[#EDE8E1]">
                <h3 className="font-semibold text-xs text-[#1A1918]">Recent Invoices</h3>
                <Button
                  onClick={() => onNavigate('invoices')}
                  variant="ghost"
                  size="xs"
                  className="text-[11px]"
                >
                  View Invoices
                </Button>
              </div>

              {invoices.length === 0 ? (
                <div className="py-4 text-center text-[11px] text-[#8C8278]">
                  No invoices issued for this client.
                </div>
              ) : (
                <div className="space-y-1.5">
                  {invoices.map(inv => (
                    <div
                      key={inv.id}
                      onClick={() => onNavigate('invoices')}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-2.5 rounded-lg bg-[#F4F0EA] hover:bg-black/[0.04] transition-colors cursor-pointer gap-1.5"
                    >
                      <div>
                        <div className="font-mono text-xs font-medium text-[#1A1918]">{inv.invoiceNumber}</div>
                        <div className="text-[10px] text-[#8C8278]">Due {inv.dueDate}</div>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end gap-2">
                        <span className="text-xs font-semibold text-[#1A1918]">
                          ${inv.total.toLocaleString()}
                        </span>
                        <Badge variant={inv.status.toLowerCase() as any} size="sm">
                          {inv.status}
                        </Badge>
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
        <Card padding="md" className="space-y-2">
          {projects.length === 0 ? (
            <div className="py-6 text-center text-xs text-[#8C8278]">No projects for this client.</div>
          ) : (
            projects.map(p => (
              <div key={p.id} className="p-3 rounded-lg border border-[#EDE8E1] bg-[#F4F0EA] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h4 className="font-medium text-xs text-[#1A1918]">{p.title}</h4>
                  <p className="text-[11px] text-[#8C8278] mt-0.5">{p.description || ''}</p>
                </div>
                <div className="flex items-center justify-between sm:justify-end gap-2">
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
        <Card padding="md" className="space-y-2">
          {invoices.length === 0 ? (
            <div className="py-6 text-center text-xs text-[#8C8278]">No invoices issued for this client.</div>
          ) : (
            invoices.map(inv => (
              <div key={inv.id} className="p-3 rounded-lg border border-[#EDE8E1] bg-[#F4F0EA] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h4 className="font-mono text-xs font-medium text-[#1A1918]">{inv.invoiceNumber}</h4>
                  <p className="text-[11px] text-[#8C8278] mt-0.5">Due {String(inv.dueDate || 'TBD')}</p>
                </div>
                <div className="flex items-center justify-between sm:justify-end gap-2">
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
        <Card padding="md" className="space-y-2">
          {proposals.length === 0 ? (
            <div className="py-6 text-center text-xs text-[#8C8278]">No proposals created for this client.</div>
          ) : (
            proposals.map(prop => (
              <div key={prop.id} className="p-3 rounded-lg border border-[#EDE8E1] bg-[#F4F0EA] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h4 className="font-medium text-xs text-[#1A1918]">{prop.proposalNumber}: {prop.title}</h4>
                  <p className="text-[11px] text-[#8C8278] mt-0.5">{prop.timeline}</p>
                </div>
                <div className="flex items-center justify-between sm:justify-end gap-2">
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
          <h3 className="font-semibold text-xs text-[#1A1918]">Client Preferences & Working Notes</h3>
          <textarea
            rows={4}
            value={noteText}
            onChange={e => setNoteText(e.target.value)}
            placeholder="Add key preferences, communication style, or timezone notes..."
            className="w-full p-2.5 text-xs bg-[#F4F0EA] border border-[#EDE8E1] rounded-lg focus:outline-none focus:border-[#0071E3] resize-none"
          />
          <div className="flex justify-end">
            <Button onClick={handleSaveNotes} variant="primary" size="sm">
              Save Notes
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
};
