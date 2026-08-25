import React, { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  Edit2,
  Trash2,
  Eye,
  Mail,
  Building
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Avatar } from '../components/ui/Avatar';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { TableSkeleton } from '../components/ui/Skeleton';
import type { Client } from '../types';

interface ClientsPageProps {
  clients: Client[];
  isLoading?: boolean;
  onSelectClient: (id: string) => void;
  onCreateClient: (client: Partial<Client>) => Promise<void>;
  onUpdateClient: (id: string, client: Partial<Client>) => Promise<void>;
  onDeleteClient: (id: string) => Promise<void>;
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
  dark: '#2A2320'
};

const emptyForm = {
  name: '',
  company: '',
  email: '',
  phone: '',
  website: '',
  address: '',
  status: 'Active' as 'Active' | 'Lead' | 'Inactive',
  tier: 'Startup' as 'Enterprise' | 'Startup' | 'SMB',
  notes: ''
};

export const ClientsPage: React.FC<ClientsPageProps> = ({
  clients,
  isLoading = false,
  onSelectClient,
  onCreateClient,
  onUpdateClient,
  onDeleteClient
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  // The form behaves like its own page — it fully replaces the list view.
  const [view, setView] = useState<'list' | 'form'>('list');
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Client | null>(null);
  const [formData, setFormData] = useState(emptyForm);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const filteredClients = clients.filter(c => {
    const matchesSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.company.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = statusFilter === 'All' || c.status === statusFilter;
    return matchesSearch && matchesFilter;
  });

  const totalPages = Math.ceil(filteredClients.length / itemsPerPage);
  const paginatedClients = filteredClients.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  // Reset to page 1 when search or filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter]);

  const openAddForm = () => {
    setEditingClient(null);
    setFormData(emptyForm);
    setView('form');
  };

  const openEdit = (client: Client) => {
    setEditingClient(client);
    setFormData({
      name: client.name,
      company: client.company,
      email: client.email,
      phone: client.phone || '',
      website: client.website || '',
      address: client.address || '',
      status: client.status,
      tier: client.tier || 'Startup',
      notes: client.notes || ''
    });
    setActiveMenuId(null);
    setView('form');
  };

  const backToList = () => {
    setEditingClient(null);
    setFormData(emptyForm);
    setView('list');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    try {
      if (editingClient) {
        await onUpdateClient(editingClient.id, formData);
      } else {
        await onCreateClient(formData);
      }
      // Only navigate back to the list if the operation actually succeeded.
      backToList();
    } catch {
      // Error toast is already shown by the handler in App.tsx.
      // Stay on the form so the user can retry without losing their input.
    }
  };

  const inputClass =
    'w-full px-3 py-2 text-[13px] bg-white border rounded-lg transition-all focus:outline-none';
  const focusHandlers = {
    onFocus: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      e.currentTarget.style.borderColor = T.accent;
      e.currentTarget.style.boxShadow = '0 0 0 3px rgba(147,122,98,0.15)';
    },
    onBlur: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      e.currentTarget.style.borderColor = T.border;
      e.currentTarget.style.boxShadow = 'none';
    }
  };

  /* ════════════════ FORM VIEW — acts like its own page ════════════════ */
  if (view === 'form') {
    return (
      <div className="space-y-6 max-w-3xl mx-auto">
        {/* Page-level back navigation */}
        <button
          onClick={backToList}
          className="inline-flex items-center gap-1 text-xs font-medium cursor-pointer hover:underline"
          style={{ color: T.accent }}
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          <span>Back to clients</span>
        </button>

        {/* Page header */}
        <div>
          <p className="text-[11px] uppercase tracking-[0.16em] font-semibold mb-2" style={{ color: T.accent }}>
            {editingClient ? 'Edit client' : 'New client'}
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight" style={{ color: T.ink }}>
            {editingClient ? editingClient.name : 'Add a client'}
          </h1>
          <p className="text-sm mt-1.5" style={{ color: T.body }}>
            {editingClient
              ? 'Update the contact information and business profile.'
              : 'Fill in the details below — the client joins your workspace instantly.'}
          </p>
        </div>

        {/* Form card */}
        <Card className="p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-[11px] font-medium mb-1.5" style={{ color: T.body }}>
                  Client Name *
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Acme Corporation"
                  className={inputClass}
                  style={{ borderColor: T.border, color: T.ink }}
                  {...focusHandlers}
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium mb-1.5" style={{ color: T.body }}>
                  Company / Website
                </label>
                <input
                  type="text"
                  value={formData.company}
                  onChange={e => setFormData({ ...formData, company: e.target.value })}
                  placeholder="acme.com"
                  className={inputClass}
                  style={{ borderColor: T.border, color: T.ink }}
                  {...focusHandlers}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-[11px] font-medium mb-1.5" style={{ color: T.body }}>
                  Email Address
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  placeholder="contact@acme.com"
                  className={inputClass}
                  style={{ borderColor: T.border, color: T.ink }}
                  {...focusHandlers}
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium mb-1.5" style={{ color: T.body }}>
                  Phone Number
                </label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+1 (555) 000-0000"
                  className={inputClass}
                  style={{ borderColor: T.border, color: T.ink }}
                  {...focusHandlers}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-[11px] font-medium mb-1.5" style={{ color: T.body }}>
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                  className={inputClass + ' cursor-pointer'}
                  style={{ borderColor: T.border, color: T.ink, backgroundColor: T.surface }}
                >
                  <option value="Active">Active</option>
                  <option value="Lead">Lead</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-medium mb-1.5" style={{ color: T.body }}>
                  Tier / Category
                </label>
                <select
                  value={formData.tier}
                  onChange={e => setFormData({ ...formData, tier: e.target.value as any })}
                  className={inputClass + ' cursor-pointer'}
                  style={{ borderColor: T.border, color: T.ink, backgroundColor: T.surface }}
                >
                  <option value="Enterprise">Enterprise</option>
                  <option value="Startup">Startup</option>
                  <option value="SMB">SMB</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-medium mb-1.5" style={{ color: T.body }}>
                Address
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={e => setFormData({ ...formData, address: e.target.value })}
                placeholder="Street, City, Country"
                className={inputClass}
                style={{ borderColor: T.border, color: T.ink }}
                {...focusHandlers}
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium mb-1.5" style={{ color: T.body }}>
                Internal Notes
              </label>
              <textarea
                rows={3}
                value={formData.notes}
                onChange={e => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Key preferences, timezone, contract requirements..."
                className={inputClass + ' resize-none'}
                style={{ borderColor: T.border, color: T.ink }}
                {...focusHandlers}
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-5 mt-1 border-t" style={{ borderColor: T.bg }}>
              <Button type="button" variant="secondary" size="sm" onClick={backToList}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm">
                {editingClient ? 'Save Changes' : 'Create Client'}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    );
  }

  /* ════════════════ LIST VIEW ════════════════ */
  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* Header & Primary Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight" style={{ color: T.ink }}>Clients</h1>
          <p className="text-xs mt-0.5" style={{ color: T.muted }}>
            Manage your accounts, contracts, and lifetime client value.
          </p>
        </div>

        <Button onClick={openAddForm} variant="primary" size="sm" icon={<Plus className="w-3.5 h-3.5" />}>
          Add Client
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: T.muted }} />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search accounts..."
            className="w-full bg-white text-xs pl-8.5 pr-3 py-1.5 rounded-lg border transition-all focus:outline-none"
            style={{ borderColor: T.border, color: T.ink }}
            onFocus={e => { e.currentTarget.style.borderColor = T.accent; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(147,122,98,0.15)'; }}
            onBlur={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.boxShadow = 'none'; }}
          />
        </div>

        {/* Segmented Filter */}
        <div className="segmented-control self-start sm:self-auto">
          {['All', 'Active', 'Lead', 'Inactive'].map(st => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-2.5 py-1 text-[11px] rounded-md transition-all cursor-pointer ${statusFilter === st ? 'bg-white font-medium shadow-2xs' : ''}`}
              style={{ color: statusFilter === st ? T.ink : T.muted }}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Loading Skeleton */}
      {isLoading ? (
        <TableSkeleton rows={5} />
      ) : (
        /* Clients Table Card */
        <Card padding="none" style={{ borderColor: T.border }}>
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b text-[11px] font-medium select-none" style={{ backgroundColor: T.surfaceWarm, borderColor: T.border, color: T.muted }}>
                <tr>
                  <th className="py-2.5 px-4 font-medium">Client</th>
                  <th className="py-2.5 px-3 font-medium">Company</th>
                  <th className="py-2.5 px-3 font-medium">Email</th>
                  <th className="py-2.5 px-3 font-medium">Total Spent</th>
                  <th className="py-2.5 px-3 font-medium text-center">Projects</th>
                  <th className="py-2.5 px-3 font-medium">Status</th>
                  <th className="py-2.5 px-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              {/* Hairline row separators only — no thick dark lines */}
              <tbody className="divide-y divide-[#F4F0EA]">
                {filteredClients.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-10 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <p className="text-xs" style={{ color: T.muted }}>
                          {clients.length === 0 ? 'No clients yet. Start by adding your first client.' : 'No clients found matching your search.'}
                        </p>
                        {clients.length === 0 && (
                          <Button onClick={openAddForm} variant="primary" size="sm" icon={<Plus className="w-3.5 h-3.5" />}>
                            Create Client
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedClients.map(client => (
                    <tr
                      key={client.id}
                      onClick={() => onSelectClient(client.id)}
                      className="hover:bg-[#F1EDE7]/60 transition-colors cursor-pointer group"
                    >
                      {/* Client Name + Avatar */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <Avatar name={client.name} size="sm" />
                          <span className="font-medium group-hover:text-[#937A62] transition-colors" style={{ color: T.ink }}>
                            {client.name}
                          </span>
                        </div>
                      </td>

                      {/* Company */}
                      <td className="py-3 px-3" style={{ color: T.body }}>
                        {client.company || '—'}
                      </td>

                      {/* Email */}
                      <td className="py-3 px-3" style={{ color: T.muted }}>
                        {client.email}
                      </td>

                      {/* Total Spent */}
                      <td className="py-3 px-3 font-medium" style={{ color: T.ink }}>
                        ${client.totalSpent.toLocaleString()}
                      </td>

                      {/* Projects count */}
                      <td className="py-3 px-3 text-center font-medium" style={{ color: T.body }}>
                        {client.projectsCount}
                      </td>

                      {/* Status Badge */}
                      <td className="py-3 px-3">
                        <Badge size="sm" variant={client.status.toLowerCase() as any}>
                          {client.status}
                        </Badge>
                      </td>

                      {/* Action Dropdown */}
                      <td
                        className="py-3 px-4 text-right"
                        onClick={e => e.stopPropagation()}
                      >
                        <div className="relative inline-block">
                          <button
                            onClick={() => setActiveMenuId(activeMenuId === client.id ? null : client.id)}
                            className="p-1 rounded-md transition-colors cursor-pointer hover:bg-black/[0.04]"
                            style={{ color: T.muted }}
                            aria-label="Client actions"
                          >
                            <MoreVertical className="w-3.5 h-3.5" />
                          </button>

                          {activeMenuId === client.id && (
                            <>
                              <div
                                className="fixed inset-0 z-40"
                                onClick={() => setActiveMenuId(null)}
                              />
                              <div
                                className="fixed right-4 w-32 border rounded-xl shadow-lg p-1 z-50 animate-in fade-in zoom-in-95 duration-100"
                                style={{ backgroundColor: T.surface, borderColor: T.border, top: 'auto', bottom: '80px' }}
                              >
                                <button
                                  onClick={() => {
                                    setActiveMenuId(null);
                                    onSelectClient(client.id);
                                  }}
                                  className="w-full flex items-center gap-2 px-2 py-1.5 text-xs rounded-lg text-left cursor-pointer font-medium transition-colors duration-150 hover:bg-[#F1EDE7]"
                                  style={{ color: T.body }}
                                >
                                  <Eye className="w-3.5 h-3.5" style={{ color: T.accent }} />
                                  <span>Profile</span>
                                </button>
                                <button
                                  onClick={() => openEdit(client)}
                                  className="w-full flex items-center gap-2 px-2 py-1.5 text-xs rounded-lg text-left cursor-pointer font-medium transition-colors duration-150 hover:bg-[#F1EDE7]"
                                  style={{ color: T.body }}
                                >
                                  <Edit2 className="w-3.5 h-3.5" style={{ color: T.accent }} />
                                  <span>Edit</span>
                                </button>
                                <button
                                  onClick={async () => {
                                    setActiveMenuId(null);
                                    setPendingDelete(client);
                                  }}
                                  className="w-full flex items-center gap-2 px-2 py-1.5 text-xs rounded-lg text-left cursor-pointer font-medium transition-colors duration-150 hover:bg-[#FFF5F5]"
                                  style={{ color: '#C86450' }}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>Delete</span>
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile & Tablet Stacked Card View */}
          <div className="md:hidden divide-y divide-[#F4F0EA]">
            {filteredClients.length === 0 ? (
              <div className="py-8 px-4 text-center">
                <div className="flex flex-col items-center gap-3">
                  <p className="text-xs" style={{ color: T.muted }}>
                    {clients.length === 0 ? 'No clients yet. Start by adding your first client.' : 'No clients found matching your search.'}
                  </p>
                  {clients.length === 0 && (
                    <Button onClick={openAddForm} variant="primary" size="sm" icon={<Plus className="w-3.5 h-3.5" />}>
                      Create Client
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              paginatedClients.map(client => (
                <div
                  key={client.id}
                  onClick={() => onSelectClient(client.id)}
                  className="p-3.5 hover:bg-[#F1EDE7]/60 transition-colors cursor-pointer space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Avatar name={client.name} size="sm" />
                      <div className="min-w-0">
                        <div className="font-medium text-xs truncate" style={{ color: T.ink }}>
                          {client.name}
                        </div>
                        <div className="text-[11px] truncate flex items-center gap-1" style={{ color: T.muted }}>
                          <Building className="w-3 h-3 shrink-0" />
                          <span>{client.company || 'Private Client'}</span>
                        </div>
                      </div>
                    </div>
                    <Badge size="sm" variant={client.status.toLowerCase() as any}>
                      {client.status}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs p-2 rounded-lg border" style={{ backgroundColor: T.surfaceWarm, borderColor: T.border }}>
                    <div>
                      <span className="block text-[9px] uppercase font-medium" style={{ color: T.muted }}>Total Spent</span>
                      <span className="font-semibold text-xs" style={{ color: T.ink }}>${client.totalSpent.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="block text-[9px] uppercase font-medium" style={{ color: T.muted }}>Projects</span>
                      <span className="font-medium text-xs" style={{ color: T.ink }}>{client.projectsCount}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-0.5 text-xs">
                    <div className="truncate flex items-center gap-1 text-[11px]" style={{ color: T.muted }}>
                      <Mail className="w-3 h-3 shrink-0" />
                      <span className="truncate">{client.email}</span>
                    </div>
                    <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                      <Button
                        variant="secondary"
                        size="xs"
                        onClick={() => openEdit(client)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="primary"
                        size="xs"
                        onClick={() => onSelectClient(client.id)}
                      >
                        View
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Table Pagination footer */}
          <div
            className="px-4 py-2.5 border-t flex items-center justify-between text-xs"
            style={{ backgroundColor: T.surfaceWarm, borderColor: T.border, color: T.muted }}
          >
            <span className="text-[11px]">
              Showing {(currentPage - 1) * itemsPerPage + 1}–{Math.min(currentPage * itemsPerPage, filteredClients.length)} of {filteredClients.length} accounts
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="secondary"
                size="xs"
                isIconOnly
                disabled={currentPage === 1}
                onClick={handlePrevPage}
                aria-label="Previous page"
              >
                <ChevronLeft className="w-3 h-3" />
              </Button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                return (
                  <Button
                    key={pageNum}
                    variant={pageNum === currentPage ? 'primary' : 'secondary'}
                    size="xs"
                    className="w-6 h-6 p-0 text-[11px]"
                    onClick={() => handlePageChange(pageNum)}
                  >
                    {pageNum}
                  </Button>
                );
              })}
              <Button
                variant="secondary"
                size="xs"
                isIconOnly
                disabled={currentPage === totalPages || totalPages === 0}
                onClick={handleNextPage}
                aria-label="Next page"
              >
                <ChevronRight className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Delete Client Confirmation */}
      <ConfirmDialog
        isOpen={pendingDelete !== null}
        onClose={() => setPendingDelete(null)}
        onConfirm={async () => {
          const client = pendingDelete;
          setPendingDelete(null);
          if (client) await onDeleteClient(client.id);
        }}
        tone="danger"
        title="Remove this client?"
        description="This permanently removes the client and their profile from your workspace. Projects and invoices linked to them will remain but lose this association. This action cannot be undone."
        confirmLabel="Remove client"
        details={pendingDelete ? [
          { label: 'Client', value: pendingDelete.name },
          { label: 'Company', value: pendingDelete.company || '—' },
          { label: 'Lifetime value', value: `$${pendingDelete.totalSpent.toLocaleString()}` }
        ] : []}
      />
    </div>
  );
};
