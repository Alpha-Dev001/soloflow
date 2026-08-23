import React, { useState } from 'react';
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
  Calendar
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
}

export const InvoicesPage: React.FC<InvoicesPageProps> = ({
  invoices,
  clients,
  projects,
  isLoading = false,
  onSelectInvoice,
  onCreateInvoice,
  onUpdateStatus,
  onDeleteInvoice
}) => {
  const { showToast } = useToast();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Invoice | null>(null);

  // New invoice form state
  const [selectedClientId, setSelectedClientId] = useState(clients[0]?.id || '');
  const [selectedProjectId, setSelectedProjectId] = useState('');
  // Default due date: 30 days from today in YYYY-MM-DD format (accepted by NestJS)
  const defaultDueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    .toISOString().slice(0, 10);
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

  const handleAddItem = () => {
    setItems([
      ...items,
      {
        id: String(Date.now()),
        description: 'New service item',
        quantity: 1,
        unitPrice: 500,
        amount: 500
      }
    ]);
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
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== idx));
    }
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
      confetti({
        particleCount: 70,
        spread: 50,
        origin: { y: 0.7 }
      });
      showToast(`Invoice ${inv.invoiceNumber} marked as paid`, 'success');
    } catch (e) {
      showToast('Failed to update invoice status', 'error');
    }
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-[#1A1918]">Invoices</h1>
          <p className="text-xs text-[#8C8278] mt-0.5">
            Create, track, and collect client payments with automated reconciliation.
          </p>
        </div>

        <Button
          onClick={() => setIsCreateOpen(true)}
          variant="primary"
          size="sm"
          icon={<Plus className="w-3.5 h-3.5" />}
        >
          New Invoice
        </Button>
      </div>

      {/* Filter and Search Bar */}
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

        {/* Apple Segmented Control */}
        <div className="segmented-control self-start sm:self-auto overflow-x-auto max-w-full">
          {['All', 'Paid', 'Pending', 'Overdue', 'Sent', 'Draft'].map(st => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-2.5 py-1 text-[11px] rounded-md transition-all cursor-pointer whitespace-nowrap ${statusFilter === st ? 'bg-white text-[#4A3F35] font-medium shadow-2xs' : 'text-[#7A6548] hover:text-[#5C4D35]'
                }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Loading Skeleton State */}
      {isLoading ? (
        <TableSkeleton rows={5} />
      ) : (
        /* Invoices Table Card */
        <Card padding="none" className="overflow-hidden border border-[#EDE8E1]">
          {/* Desktop Table View */}
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
                    <td colSpan={6} className="py-10 text-center text-xs text-[#8C8278]">
                      No invoices found. Click "New Invoice" to issue one.
                    </td>
                  </tr>
                ) : (
                  filteredInvoices.map(inv => (
                    <tr
                      key={inv.id}
                      onClick={() => onSelectInvoice(inv.id)}
                      className="hover:bg-[#F4F0EA] transition-colors cursor-pointer group"
                    >
                      {/* Invoice Number */}
                      <td className="py-3 px-4 font-mono font-medium text-xs text-[#1A1918] group-hover:text-[#0071E3]">
                        <div className="flex items-center gap-1.5">
                          <Receipt className="w-3.5 h-3.5 text-[#8C8278]" />
                          <span>{inv.invoiceNumber}</span>
                        </div>
                      </td>

                      {/* Client Name + Avatar */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <Avatar name={inv.clientName} size="sm" />
                          <span className="font-medium text-[#1A1918]">{inv.clientName}</span>
                        </div>
                      </td>

                      {/* Due Date */}
                      <td className="py-3 px-3 text-[11px] text-[#8C8278]">
                        {inv.dueDate}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3">
                        <Badge size="sm" variant={inv.status.toLowerCase() as any}>
                          {inv.status}
                        </Badge>
                      </td>

                      {/* Amount */}
                      <td className="py-3 px-3 font-medium text-[#1A1918]">
                        ${inv.total.toFixed(2)}
                      </td>

                      {/* Actions dropdown */}
                      <td
                        className="py-3 px-4 text-right relative"
                        onClick={e => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-1">
                          {inv.status !== 'Paid' && (
                            <Button
                              variant="secondary"
                              size="xs"
                              onClick={() => handleMarkPaid(inv)}
                              className="text-[#248A3D] border-[#34C759]/30 bg-[#34C759]/10 hover:bg-[#34C759]/20 text-[10px]"
                            >
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
                            <div
                              className="fixed inset-0 z-40"
                              onClick={() => setActiveMenuId(null)}
                            />
                            <div className="absolute right-4 mt-1 w-36 bg-white border border-[#EDE8E1] rounded-xl shadow-lg p-1 z-50 animate-in fade-in zoom-in-95 duration-100">
                              <button
                                onClick={() => {
                                  setActiveMenuId(null);
                                  onSelectInvoice(inv.id);
                                }}
                                className="w-full flex items-center gap-2 px-2 py-1.5 text-xs text-[#1A1918] hover:bg-[#F4F0EA] rounded-lg text-left cursor-pointer font-medium"
                              >
                                <Eye className="w-3.5 h-3.5 text-[#8C8278]" />
                                <span>View</span>
                              </button>

                              {inv.status !== 'Paid' ? (
                                <button
                                  onClick={() => {
                                    setActiveMenuId(null);
                                    handleMarkPaid(inv);
                                  }}
                                  className="w-full flex items-center gap-2 px-2 py-1.5 text-xs text-[#248A3D] hover:bg-[#34C759]/10 rounded-lg text-left cursor-pointer font-medium"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>Mark Paid</span>
                                </button>
                              ) : (
                                <button
                                  onClick={async () => {
                                    setActiveMenuId(null);
                                    await onUpdateStatus(inv.id, 'Pending');
                                    showToast(`Invoice ${inv.invoiceNumber} set to Pending`, 'info');
                                  }}
                                  className="w-full flex items-center gap-2 px-2 py-1.5 text-xs text-[#C97100] hover:bg-[#FF9500]/10 rounded-lg text-left cursor-pointer font-medium"
                                >
                                  <span>Set Pending</span>
                                </button>
                              )}

                              <button
                                onClick={() => {
                                  setActiveMenuId(null);
                                  setPendingDelete(inv);
                                }}
                                className="w-full flex items-center gap-2 px-2 py-1.5 text-xs text-[#FF3B30] hover:bg-[#FF3B30]/10 rounded-lg text-left cursor-pointer font-medium"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-[#FF3B30]" />
                                <span>Delete</span>
                              </button>
                            </div>
                          </>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile & Tablet Stacked Card View */}
          <div className="md:hidden divide-y divide-[#F4F0EA]">
            {filteredInvoices.length === 0 ? (
              <div className="py-8 px-4 text-center text-xs text-[#8C8278]">
                No invoices found. Click "New Invoice" to issue one.
              </div>
            ) : (
              filteredInvoices.map(inv => (
                <div
                  key={inv.id}
                  onClick={() => onSelectInvoice(inv.id)}
                  className="p-3.5 hover:bg-[#F4F0EA] transition-colors cursor-pointer space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Receipt className="w-3.5 h-3.5 text-[#8C8278]" />
                      <span className="font-mono font-medium text-xs text-[#1A1918]">{inv.invoiceNumber}</span>
                    </div>
                    <Badge size="sm" variant={inv.status.toLowerCase() as any}>
                      {inv.status}
                    </Badge>
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
                      <Calendar className="w-3 h-3 text-[#8C8278]" />
                      <span>Due {inv.dueDate}</span>
                    </div>

                    <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                      {inv.status !== 'Paid' && (
                        <Button
                          variant="secondary"
                          size="xs"
                          onClick={() => handleMarkPaid(inv)}
                          className="text-[#248A3D] border-[#34C759]/30 bg-[#34C759]/10 hover:bg-[#34C759]/20 text-[10px]"
                        >
                          Paid
                        </Button>
                      )}
                      <Button
                        variant="primary"
                        size="xs"
                        onClick={() => onSelectInvoice(inv.id)}
                      >
                        View
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Pagination Footer */}
          <div className="px-4 py-2.5 bg-[#F4F0EA] border-t border-[#EDE8E1] flex items-center justify-between text-xs text-[#8C8278]">
            <span className="text-[11px]">
              Showing 1–{filteredInvoices.length} of {invoices.length} invoices
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="secondary"
                size="xs"
                isIconOnly
                disabled
                aria-label="Previous page"
              >
                <ChevronLeft className="w-3 h-3" />
              </Button>
              <Button
                variant="primary"
                size="xs"
                className="w-6 h-6 p-0 text-[11px]"
              >
                1
              </Button>
              <Button
                variant="secondary"
                size="xs"
                isIconOnly
                disabled
                aria-label="Next page"
              >
                <ChevronRight className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Delete Invoice Confirmation */}
      <ConfirmDialog
        isOpen={pendingDelete !== null}
        onClose={() => setPendingDelete(null)}
        onConfirm={async () => {
          const inv = pendingDelete;
          setPendingDelete(null);
          if (inv) await onDeleteInvoice(inv.id);
        }}
        tone="danger"
        title="Delete this invoice?"
        description="This permanently removes the invoice and its line items from your workspace. This action cannot be undone."
        confirmLabel="Delete invoice"
        details={pendingDelete ? [
          { label: 'Invoice', value: pendingDelete.invoiceNumber },
          { label: 'Client', value: pendingDelete.clientName },
          { label: 'Amount', value: `$${pendingDelete.total.toLocaleString()}` }
        ] : []}
      />

      {/* New Invoice Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="New Invoice"
        subtitle="Itemize billable deliverables and set payment due date"
        maxWidth="xl"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-3.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-[#1A1918] mb-1">
                Client *
              </label>
              <select
                value={selectedClientId}
                onChange={e => setSelectedClientId(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs bg-white border border-[#EDE8E1] rounded-lg focus:outline-none focus:border-[#0071E3]"
              >
                {clients.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-[#1A1918] mb-1">
                Payment Due Date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs bg-white border border-[#EDE8E1] rounded-lg focus:outline-none focus:border-[#0071E3] focus:ring-2 focus:ring-[#0071E3]/15"
              />
            </div>
          </div>

          {/* Line items section */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-medium text-[#1A1918]">Line Items</label>
              <button
                type="button"
                onClick={handleAddItem}
                className="text-[11px] text-[#0071E3] font-medium hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3 h-3" /> Add item
              </button>
            </div>

            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {items.map((it, idx) => (
                <div key={it.id || idx} className="flex items-center gap-2 p-1.5 rounded-lg bg-[#F4F0EA] border border-[#EDE8E1]">
                  <input
                    type="text"
                    placeholder="Description"
                    value={it.description}
                    onChange={e => handleItemChange(idx, 'description', e.target.value)}
                    className="flex-3 px-2 py-1 text-xs bg-white border border-[#EDE8E1] rounded-md focus:outline-none focus:border-[#0071E3]"
                  />
                  <input
                    type="number"
                    min="1"
                    placeholder="Qty"
                    value={it.quantity}
                    onChange={e => handleItemChange(idx, 'quantity', Number(e.target.value))}
                    className="w-14 px-2 py-1 text-xs bg-white border border-[#EDE8E1] rounded-md focus:outline-none focus:border-[#0071E3]"
                  />
                  <input
                    type="number"
                    min="0"
                    placeholder="Price"
                    value={it.unitPrice}
                    onChange={e => handleItemChange(idx, 'unitPrice', Number(e.target.value))}
                    className="w-20 px-2 py-1 text-xs bg-white border border-[#EDE8E1] rounded-md focus:outline-none focus:border-[#0071E3]"
                  />
                  <span className="w-16 text-xs font-semibold text-right pr-1 text-[#1A1918]">
                    ${it.amount.toLocaleString()}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(idx)}
                    className="p-1 text-[#FF3B30] hover:bg-[#FF3B30]/10 rounded cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Totals Summary */}
          <div className="pt-2 border-t border-[#EDE8E1] flex justify-end">
            <div className="w-56 space-y-1 text-xs">
              <div className="flex justify-between text-[#8C8278]">
                <span>Subtotal:</span>
                <span className="font-medium text-[#1A1918]">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-[#8C8278]">
                <span>Tax Rate (%):</span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={taxRate}
                  onChange={e => setTaxRate(Number(e.target.value))}
                  className="w-14 px-1.5 py-0.5 text-xs bg-white border border-[#EDE8E1] rounded text-right"
                />
              </div>
              <div className="flex justify-between text-xs font-semibold text-[#1A1918] pt-1 border-t border-[#EDE8E1]">
                <span>Total Due:</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#EDE8E1]">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setIsCreateOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Issue Invoice
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
