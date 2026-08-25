import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Search,
  Plus,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Eye,
  Trash2,
  Receipt,
  Calendar,
  Users,
  CreditCard,
  TrendingUp
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Avatar } from '../components/ui/Avatar';
import { Modal } from '../components/ui/Modal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { TableSkeleton } from '../components/ui/Skeleton';
import { useToast } from '../components/ui/Toast';
import type { Invoice, Client, Project, InvoiceItem } from '../types';

interface InvoicesPageProps {
  invoices: Invoice[];
  clients: Client[];
  projects: Project[];
  isLoading?: boolean;
  onSelectInvoice: (id: string) => void;
  onCreateInvoice: (inv: Partial<Invoice>) => Promise<void>;
  onUpdateStatus: (id: string, status: string) => Promise<void>;
  onDeleteInvoice: (id: string) => Promise<void>;
  onNavigateToClients: () => void;
}

export const InvoicesPage: React.FC<InvoicesPageProps> = ({
  invoices,
  clients,
  projects,
  isLoading = false,
  onSelectInvoice,
  onCreateInvoice,
  onUpdateStatus,
  onDeleteInvoice,
  onNavigateToClients
}) => {
  const { showToast } = useToast();
  const [searchParams] = useSearchParams();
  const urlClientId = searchParams.get('clientId');

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [showNoClientPrompt, setShowNoClientPrompt] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Invoice | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [selectedClientId, setSelectedClientId] = useState(urlClientId || clients[0]?.id || '');
  const [selectedProjectId, setSelectedProjectId] = useState('');

  useEffect(() => {
    if (urlClientId) {
      setSelectedClientId(urlClientId);
    }
  }, [urlClientId]);
  const defaultDueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const [dueDate, setDueDate] = useState(defaultDueDate);
  const [taxRate, setTaxRate] = useState(0);
  const [items, setItems] = useState<InvoiceItem[]>([
    { id: '1', description: 'Design & Development Milestone', quantity: 1, unitPrice: 3500, amount: 3500 }
  ]);

  const filteredInvoices = invoices.filter(inv => {
    const matchesSearch =
      inv.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
      inv.clientName.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = statusFilter === 'All' || inv.status === statusFilter;
    return matchesSearch && matchesFilter;
  });

  const totalPages = Math.ceil(filteredInvoices.length / itemsPerPage);
  const paginatedInvoices = filteredInvoices.slice(
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

  const handleNewInvoiceClick = () => {
    if (clients.length === 0) {
      setShowNoClientPrompt(true);
    } else {
      setSelectedClientId(clients[0]?.id || '');
      setIsCreateOpen(true);
    }
  };

  const handleAddItem = () => {
    setItems([...items, { id: String(Date.now()), description: 'New service item', quantity: 1, unitPrice: 500, amount: 500 }]);
  };

  const handleItemChange = (idx: number, field: keyof InvoiceItem, val: any) => {
    const copy = [...items];
    copy[idx] = { ...copy[idx], [field]: val };
    if (field === 'quantity' || field === 'unitPrice') {
      copy[idx].amount = (copy[idx].quantity || 0) * (copy[idx].unitPrice || 0);
    }
    setItems(copy);
  };

  const handleRemoveItem = (idx: number) => {
    if (items.length > 1) setItems(items.filter((_, i) => i !== idx));
  };

  const subtotal = items.reduce((sum, it) => sum + (it.amount || 0), 0);
  const taxAmount = (subtotal * taxRate) / 100;
  const total = subtotal + taxAmount;

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const client = clients.find(c => c.id === selectedClientId) || clients[0];
    const project = projects.find(p => p.id === selectedProjectId);
    await onCreateInvoice({
      clientId: client ? client.id : '',
      clientName: client ? client.name : '',
      projectId: project?.id,
      projectName: project?.title,
      dueDate,
      items,
      taxRate,
      status: 'Sent'
    });
    setIsCreateOpen(false);
    showToast('Invoice issued successfully', 'success');
  };

  const handleMarkPaid = async (inv: Invoice) => {
    try {
      await onUpdateStatus(inv.id, 'Paid');
      confetti({ particleCount: 70, spread: 50, origin: { y: 0.7 } });
      showToast(`Invoice ${inv.invoiceNumber} marked as paid`, 'success');
    } catch {
      showToast('Failed to update invoice status', 'error');
    }
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-[#1A1918]">Invoices</h1>
          <p className="text-xs text-[#8C8278] mt-0.5">
            Create, track, and collect client payments with automated reconciliation.
          </p>
        </div>
        <Button
          onClick={handleNewInvoiceClick}
          variant="primary"
          size="sm"
          icon={<Plus className="w-3.5 h-3.5" />}
        >
          New Invoice
        </Button>
      </div>

      {/* Empty state — no clients yet */}
      {clients.length === 0 ? (
        <Card className="p-10 sm:p-14">
          <div className="max-w-lg mx-auto text-center">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5"
              style={{ backgroundColor: '#F8F7F5', border: '1px solid #E0D9CF' }}
            >
              <Receipt className="w-6 h-6" style={{ color: '#82694E' }} />
            </div>
            <h2 className="text-lg font-bold tracking-tight mb-2" style={{ color: '#1A1918' }}>
              Add a client before invoicing
            </h2>
            <p className="text-sm leading-relaxed mb-7" style={{ color: '#6B6158' }}>
              Every invoice is tied to a client. Add your first client and you'll be able to issue invoices, track payments, and manage your billing — all in one place.
            </p>
            <div className="flex justify-center mb-8">
              <Button
                onClick={onNavigateToClients}
                variant="primary"
                size="md"
                icon={<Users className="w-4 h-4" />}
              >
                Go to Clients
              </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
              {[
                { icon: <Receipt className="w-4 h-4" />, label: 'Issue invoices', body: 'Bill clients with itemised line items and due dates.' },
                { icon: <CreditCard className="w-4 h-4" />, label: 'Track payments', body: 'See paid, pending, and overdue status at a glance.' },
                { icon: <TrendingUp className="w-4 h-4" />, label: 'Collect faster', body: 'Follow up on overdue invoices from the dashboard.' }
              ].map(item => (
                <div
                  key={item.label}
                  className="p-3.5 rounded-xl border text-left"
                  style={{ backgroundColor: '#F8F7F5', borderColor: '#E0D9CF' }}
                >
                  <span
                    className="w-7 h-7 rounded-lg flex items-center justify-center mb-2"
                    style={{ backgroundColor: '#FFFFFF', border: '1px solid #EDE8E1', color: '#82694E' }}
                  >
                    {item.icon}
                  </span>
                  <p className="text-[12px] font-semibold mb-0.5" style={{ color: '#1A1918' }}>{item.label}</p>
                  <p className="text-[11px] leading-relaxed" style={{ color: '#8C8278' }}>{item.body}</p>
                </div>
              ))}
            </div>
          </div>
        </Card>
      ) : (
        <>
          {/* Filter and Search */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
            <div className="relative w-full sm:w-72">
              <Search className="w-3.5 h-3.5 text-[#8C8278] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search invoices..."
                className="w-full bg-white text-xs text-[#1A1918] placeholder-[#8C8278] pl-8.5 pr-3 py-1.5 rounded-lg border border-[#EDE8E1] focus:outline-none focus:border-[#0071E3] focus:ring-2 focus:ring-[#0071E3]/15 transition-all"
              />
            </div>
            <div className="segmented-control self-start sm:self-auto overflow-x-auto max-w-full">
              {['All', 'Paid', 'Pending', 'Overdue', 'Sent', 'Draft'].map(st => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-2.5 py-1 text-[11px] rounded-md transition-all cursor-pointer whitespace-nowrap ${statusFilter === st ? 'bg-white text-[#4A3F35] font-medium shadow-2xs' : 'text-[#7A6548] hover:text-[#5C4D35]'}`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          {isLoading ? (
            <TableSkeleton rows={5} />
          ) : (
            <Card padding="none" className="border border-[#EDE8E1]">
              {/* Desktop */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F4F0EA] border-b border-[#EDE8E1] text-[11px] font-medium text-[#8C8278] select-none">
                    <tr>
                      <th className="py-2.5 px-4 font-medium">Invoice #</th>
                      <th className="py-2.5 px-3 font-medium">Client</th>
                      <th className="py-2.5 px-3 font-medium">Due Date</th>
                      <th className="py-2.5 px-3 font-medium">Status</th>
                      <th className="py-2.5 px-3 font-medium">Amount</th>
                      <th className="py-2.5 px-4 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F4F0EA]">
                    {filteredInvoices.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-10 text-center">
                          <div className="flex flex-col items-center gap-3">
                            <p className="text-xs" style={{ color: '#8C8278' }}>
                              {invoices.length === 0 ? 'No invoices yet. Start by issuing your first invoice.' : 'No invoices found matching your search.'}
                            </p>
                            {invoices.length === 0 && (
                              <Button onClick={handleNewInvoiceClick} variant="primary" size="sm" icon={<Plus className="w-3.5 h-3.5" />}>
                                Create Invoice
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ) : (
                      paginatedInvoices.map(inv => (
                        <tr
                          key={inv.id}
                          onClick={() => onSelectInvoice(inv.id)}
                          className="hover:bg-[#F4F0EA] transition-colors cursor-pointer group"
                        >
                          <td className="py-3 px-4 font-mono font-medium text-xs text-[#1A1918] group-hover:text-[#82694E]">
                            <div className="flex items-center gap-1.5">
                              <Receipt className="w-3.5 h-3.5 text-[#8C8278]" />
                              <span>{inv.invoiceNumber}</span>
                            </div>
                          </td>
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-2">
                              <Avatar name={inv.clientName} size="sm" />
                              <span className="font-medium text-[#1A1918]">{inv.clientName}</span>
                            </div>
                          </td>
                          <td className="py-3 px-3 text-[11px] text-[#8C8278]">{inv.dueDate}</td>
                          <td className="py-3 px-3">
                            <Badge size="sm" variant={inv.status.toLowerCase() as any}>{inv.status}</Badge>
                          </td>
                          <td className="py-3 px-3 font-medium text-[#1A1918]">${inv.total.toFixed(2)}</td>
                          <td className="py-3 px-4 text-right" onClick={e => e.stopPropagation()}>
                            <div className="relative inline-block">
                              <div className="flex items-center justify-end gap-1">
                                {inv.status !== 'Paid' && (
                                  <Button variant="secondary" size="xs" onClick={() => handleMarkPaid(inv)} className="text-[#248A3D] border-[#34C759]/30 bg-[#34C759]/10 hover:bg-[#34C759]/20 text-[10px]">
                                    Paid
                                  </Button>
                                )}
                                <button
                                  onClick={() => setActiveMenuId(activeMenuId === inv.id ? null : inv.id)}
                                  className="p-1 text-[#8C8278] hover:text-[#1A1918] hover:bg-black/[0.04] rounded-md transition-colors cursor-pointer"
                                  aria-label="Invoice actions"
                                >
                                  <MoreVertical className="w-3.5 h-3.5" />
                                </button>
                              </div>
                              {activeMenuId === inv.id && (
                                <>
                                  <div className="fixed inset-0 z-40" onClick={() => setActiveMenuId(null)} />
                                  <div className="fixed right-4 w-36 bg-white border border-[#EDE8E1] rounded-xl shadow-lg p-1 z-50 animate-in fade-in zoom-in-95 duration-100" style={{ top: 'auto', bottom: '80px' }}>
                                    <button onClick={() => { setActiveMenuId(null); onSelectInvoice(inv.id); }} className="w-full flex items-center gap-2 px-2 py-1.5 text-xs text-[#1A1918] hover:bg-[#F4F0EA] rounded-lg text-left cursor-pointer font-medium">
                                      <Eye className="w-3.5 h-3.5 text-[#8C8278]" /><span>View</span>
                                    </button>
                                    {inv.status !== 'Paid' ? (
                                      <button onClick={() => { setActiveMenuId(null); handleMarkPaid(inv); }} className="w-full flex items-center gap-2 px-2 py-1.5 text-xs text-[#248A3D] hover:bg-[#34C759]/10 rounded-lg text-left cursor-pointer font-medium">
                                        <CheckCircle2 className="w-3.5 h-3.5" /><span>Mark Paid</span>
                                      </button>
                                    ) : (
                                      <button onClick={async () => { setActiveMenuId(null); await onUpdateStatus(inv.id, 'Pending'); showToast(`Invoice ${inv.invoiceNumber} set to Pending`, 'info'); }} className="w-full flex items-center gap-2 px-2 py-1.5 text-xs text-[#C97100] hover:bg-[#FF9500]/10 rounded-lg text-left cursor-pointer font-medium">
                                        <span>Set Pending</span>
                                      </button>
                                    )}
                                    <button onClick={() => { setActiveMenuId(null); setPendingDelete(inv); }} className="w-full flex items-center gap-2 px-2 py-1.5 text-xs text-[#FF3B30] hover:bg-[#FF3B30]/10 rounded-lg text-left cursor-pointer font-medium">
                                      <Trash2 className="w-3.5 h-3.5 text-[#FF3B30]" /><span>Delete</span>
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

              {/* Mobile */}
              <div className="md:hidden divide-y divide-[#F4F0EA]">
                {filteredInvoices.length === 0 ? (
                  <div className="py-8 px-4 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <p className="text-xs" style={{ color: '#8C8278' }}>
                        {invoices.length === 0 ? 'No invoices yet. Start by issuing your first invoice.' : 'No invoices found matching your search.'}
                      </p>
                      {invoices.length === 0 && (
                        <Button onClick={handleNewInvoiceClick} variant="primary" size="sm" icon={<Plus className="w-3.5 h-3.5" />}>
                          Create Invoice
                        </Button>
                      )}
                    </div>
                  </div>
                ) : (
                  paginatedInvoices.map(inv => (
                    <div key={inv.id} onClick={() => onSelectInvoice(inv.id)} className="p-3.5 hover:bg-[#F4F0EA] transition-colors cursor-pointer space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <Receipt className="w-3.5 h-3.5 text-[#8C8278]" />
                          <span className="font-mono font-medium text-xs text-[#1A1918]">{inv.invoiceNumber}</span>
                        </div>
                        <Badge size="sm" variant={inv.status.toLowerCase() as any}>{inv.status}</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                          <Avatar name={inv.clientName} size="sm" />
                          <span className="font-medium text-xs text-[#1A1918] truncate">{inv.clientName}</span>
                        </div>
                        <span className="font-semibold text-xs text-[#1A1918]">${inv.total.toFixed(2)}</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-[#8C8278] pt-0.5">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" /><span>Due {inv.dueDate}</span>
                        </div>
                        <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                          {inv.status !== 'Paid' && (
                            <Button variant="secondary" size="xs" onClick={() => handleMarkPaid(inv)} className="text-[#248A3D] border-[#34C759]/30 bg-[#34C759]/10 hover:bg-[#34C759]/20 text-[10px]">Paid</Button>
                          )}
                          <Button variant="primary" size="xs" onClick={() => onSelectInvoice(inv.id)}>View</Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Pagination */}
              <div className="px-4 py-2.5 bg-[#F4F0EA] border-t border-[#EDE8E1] flex items-center justify-between text-xs text-[#8C8278]">
                <span className="text-[11px]">Showing {(currentPage - 1) * itemsPerPage + 1}–{Math.min(currentPage * itemsPerPage, filteredInvoices.length)} of {filteredInvoices.length} invoices</span>
                <div className="flex items-center gap-1">
                  <Button variant="secondary" size="xs" isIconOnly disabled={currentPage === 1} onClick={handlePrevPage} aria-label="Previous page"><ChevronLeft className="w-3 h-3" /></Button>
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
                  <Button variant="secondary" size="xs" isIconOnly disabled={currentPage === totalPages || totalPages === 0} onClick={handleNextPage} aria-label="Next page"><ChevronRight className="w-3 h-3" /></Button>
                </div>
              </div>
            </Card>
          )}
        </>
      )}

      {/* No-client redirect popup */}
      <ConfirmDialog
        isOpen={showNoClientPrompt}
        onClose={() => setShowNoClientPrompt(false)}
        onConfirm={() => { setShowNoClientPrompt(false); onNavigateToClients(); }}
        tone="neutral"
        title="You need a client first"
        description="Every invoice must be linked to a client. Head to Clients to add one, then come back to create your invoice."
        confirmLabel="Go to Clients"
        details={[]}
      />

      {/* Delete confirmation */}
      <ConfirmDialog
        isOpen={pendingDelete !== null}
        onClose={() => setPendingDelete(null)}
        onConfirm={async () => { const inv = pendingDelete; setPendingDelete(null); if (inv) await onDeleteInvoice(inv.id); }}
        tone="danger"
        title="Delete this invoice?"
        description="This permanently removes the invoice and its line items. This action cannot be undone."
        confirmLabel="Delete invoice"
        details={pendingDelete ? [
          { label: 'Invoice', value: pendingDelete.invoiceNumber },
          { label: 'Client', value: pendingDelete.clientName },
          { label: 'Amount', value: `$${pendingDelete.total.toLocaleString()}` }
        ] : []}
      />

      {/* New Invoice modal */}
      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="New Invoice" subtitle="Itemize billable deliverables and set payment due date" maxWidth="xl">
        <form onSubmit={handleCreateSubmit} className="space-y-3.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-[#1A1918] mb-1">Client *</label>
              <select value={selectedClientId} onChange={e => setSelectedClientId(e.target.value)} className="w-full px-2.5 py-1.5 text-xs bg-white border border-[#EDE8E1] rounded-lg focus:outline-none focus:border-[#82694E]">
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-medium text-[#1A1918] mb-1">Payment Due Date</label>
              <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="w-full px-2.5 py-1.5 text-xs bg-white border border-[#EDE8E1] rounded-lg focus:outline-none focus:border-[#82694E] focus:ring-2 focus:ring-[#82694E]/15" />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-medium text-[#1A1918]">Line Items</label>
              <button type="button" onClick={handleAddItem} className="text-[11px] text-[#82694E] font-medium hover:underline flex items-center gap-1 cursor-pointer">
                <Plus className="w-3 h-3" /> Add item
              </button>
            </div>
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {items.map((it, idx) => (
                <div key={it.id || idx} className="flex items-center gap-2 p-1.5 rounded-lg bg-[#F4F0EA] border border-[#EDE8E1]">
                  <input type="text" placeholder="Description" value={it.description} onChange={e => handleItemChange(idx, 'description', e.target.value)} className="flex-3 px-2 py-1 text-xs bg-white border border-[#EDE8E1] rounded-md focus:outline-none focus:border-[#82694E]" />
                  <input type="number" min="1" placeholder="Qty" value={it.quantity} onChange={e => handleItemChange(idx, 'quantity', Number(e.target.value))} className="w-14 px-2 py-1 text-xs bg-white border border-[#EDE8E1] rounded-md focus:outline-none focus:border-[#82694E]" />
                  <input type="number" min="0" placeholder="Price" value={it.unitPrice} onChange={e => handleItemChange(idx, 'unitPrice', Number(e.target.value))} className="w-20 px-2 py-1 text-xs bg-white border border-[#EDE8E1] rounded-md focus:outline-none focus:border-[#82694E]" />
                  <span className="w-16 text-xs font-semibold text-right pr-1 text-[#1A1918]">${it.amount.toLocaleString()}</span>
                  <button type="button" onClick={() => handleRemoveItem(idx)} className="p-1 text-[#FF3B30] hover:bg-[#FF3B30]/10 rounded cursor-pointer">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-2 border-t border-[#EDE8E1] flex justify-end">
            <div className="w-56 space-y-1 text-xs">
              <div className="flex justify-between text-[#8C8278]">
                <span>Subtotal:</span><span className="font-medium text-[#1A1918]">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-[#8C8278]">
                <span>Tax Rate (%):</span>
                <input type="number" min="0" max="100" value={taxRate} onChange={e => setTaxRate(Number(e.target.value))} className="w-14 px-1.5 py-0.5 text-xs bg-white border border-[#EDE8E1] rounded text-right" />
              </div>
              <div className="flex justify-between text-xs font-semibold text-[#1A1918] pt-1 border-t border-[#EDE8E1]">
                <span>Total Due:</span><span>${total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#EDE8E1]">
            <Button type="button" variant="secondary" size="sm" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" size="sm">Issue Invoice</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
