import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ChevronLeft,
  Send,
  CheckCircle2,
  Printer,
  Trash2,
  MoreHorizontal,
  Copy,
  Clock,
  Edit2,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Logo } from '../components/ui/Logo';
import { Skeleton } from '../components/ui/Skeleton';
import { useToast } from '../components/ui/Toast';
import { api } from '../services/api';
import type { Invoice, Client } from '../types';

interface InvoiceDetailPageProps {
  invoiceId: string;
  clients: Client[];
  onBack: () => void;
  onUpdateStatus: (id: string, status: string) => Promise<void>;
}

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
  dark: '#2A2320',
  error: '#D70015',
  success: '#248A3D',
};

/** Format an ISO/UTC date string into a readable date, with a safe fallback. */
function fmtDate(value?: string | null): string {
  if (!value) return '—';
  const d = new Date(value);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/** Days until a date from now (negative = past due). */
function daysUntil(dateStr: string): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export const InvoiceDetailPage: React.FC<InvoiceDetailPageProps> = ({
  invoiceId,
  clients,
  onBack,
  onUpdateStatus
}) => {
  const { showToast } = useToast();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const invoiceRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getInvoiceById(invoiceId);
      setInvoice(res.invoice);
    } catch (e) {
      console.error(e);
      setInvoice(null);
      setError('Unable to load this invoice. It may have been deleted or you may not have permission to view it.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [invoiceId]);

  // Close menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    if (showMenu) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showMenu]);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const handleCopyInvoiceNumber = useCallback(() => {
    if (invoice) {
      navigator.clipboard.writeText(invoice.invoiceNumber).then(() => {
        showToast('Invoice number copied', 'success');
      }).catch(() => {
        showToast('Failed to copy', 'error');
      });
    }
    setShowMenu(false);
  }, [invoice, showToast]);

  const handleEmailClient = useCallback(() => {
    if (invoice && client) {
      const subject = encodeURIComponent(`Invoice ${invoice.invoiceNumber} from ${invoice.clientName}`);
      const body = encodeURIComponent(
        `Hi ${invoice.clientName},\n\nPlease find attached invoice ${invoice.invoiceNumber} for $${invoice.total.toLocaleString()}.\n\nDue date: ${fmtDate(invoice.dueDate)}\n\nPlease let me know if you have any questions.\n\nBest regards`
      );
      window.open(`mailto:${client.email || ''}?subject=${subject}&body=${body}`, '_blank');
      showToast('Opening email client...', 'info');
    }
    setShowMenu(false);
  }, [invoice, showToast]);

  const handleDelete = useCallback(async () => {
    if (!invoice) return;
    setDeleting(true);
    try {
      await api.deleteInvoice(invoice.id);
      showToast(`Invoice ${invoice.invoiceNumber} deleted`, 'success');
      onBack();
    } catch {
      showToast('Failed to delete invoice', 'error');
    } finally {
      setDeleting(false);
      setConfirmDelete(false);
    }
  }, [invoice, showToast, onBack]);

  if (loading) {
    return (
      <div className="space-y-4 max-w-4xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <Skeleton className="h-4 w-20" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-28 rounded-lg" />
            <Skeleton className="h-8 w-20 rounded-lg" />
            <Skeleton className="h-8 w-20 rounded-lg" />
          </div>
        </div>
        <Card padding="lg" className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between gap-4 pb-4 border-b border-[#F4EFEA]">
            <div className="flex items-start gap-3">
              <Skeleton variant="circular" className="w-9 h-9" />
              <div className="space-y-1.5">
                <Skeleton className="h-5 w-28" />
                <Skeleton className="h-3 w-40" />
                <Skeleton className="h-3 w-32" />
              </div>
            </div>
            <div className="sm:text-right space-y-2">
              <Skeleton className="h-6 w-32" />
              <div className="flex sm:justify-end"><Skeleton className="h-5 w-16 rounded-full" /></div>
              <Skeleton className="h-3 w-24 ml-auto" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Skeleton className="h-3 w-16" /><Skeleton className="h-4 w-40" /><Skeleton className="h-3 w-32" /><Skeleton className="h-3 w-28" />
            </div>
            <div className="sm:text-right space-y-1.5">
              <Skeleton className="h-3 w-24 ml-auto" /><Skeleton className="h-4 w-32 ml-auto" /><Skeleton className="h-3 w-28 ml-auto" />
            </div>
          </div>
          <div className="overflow-hidden rounded-lg border border-[#F4EFEA]">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex justify-between px-4 py-3 border-b border-[#F4EFEA] last:border-0">
                <Skeleton className={`h-3 ${i % 2 === 0 ? 'w-40' : 'w-32'}`} />
                <Skeleton className="h-3 w-6" /><Skeleton className="h-3 w-10" /><Skeleton className="h-3 w-12" />
              </div>
            ))}
          </div>
          <div className="flex justify-end">
            <div className="w-full max-w-xs space-y-2">
              <Skeleton className="h-3 w-full" /><Skeleton className="h-3 w-full" /><Skeleton className="h-4 w-full" />
            </div>
          </div>
        </Card>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="max-w-md mx-auto text-center py-16">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1 text-xs font-medium hover:underline cursor-pointer"
          style={{ color: T.accent }}
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          <span>Back to Invoices</span>
        </button>
        <div className="mt-6 p-8 rounded-2xl border space-y-2" style={{ backgroundColor: T.surface, borderColor: T.border }}>
          <div className="mx-auto w-12 h-12 rounded-full flex items-center justify-center text-xl font-semibold" style={{ backgroundColor: T.surfaceWarm, color: T.muted }}>!</div>
          <h2 className="text-base font-semibold" style={{ color: T.ink }}>Invoice Not Found</h2>
          <p className="text-xs leading-relaxed" style={{ color: T.body }}>
            {error || 'We couldn\u2019t find an invoice matching this link. It may have been removed, or you may not have access to it.'}
          </p>
          <Button onClick={onBack} variant="primary" size="sm" className="mt-3">Go to Invoices</Button>
        </div>
      </div>
    );
  }

  const client = clients.find(c => c.id === invoice.clientId);
  const dueDays = daysUntil(invoice.dueDate);
  const isOverdue = invoice.status !== 'Paid' && dueDays < 0;
  const isDueSoon = invoice.status !== 'Paid' && dueDays >= 0 && dueDays <= 3;

  const handleMarkAsPaid = async () => {
    await onUpdateStatus(invoice.id, 'Paid');
    setInvoice({ ...invoice, status: 'Paid' });
    confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
    showToast(`Invoice ${invoice.invoiceNumber} marked as Paid`, 'success');
  };

  const handleMarkAsPending = async () => {
    await onUpdateStatus(invoice.id, 'Pending');
    setInvoice({ ...invoice, status: 'Pending' });
    showToast(`Invoice ${invoice.invoiceNumber} marked as Pending`, 'success');
  };

  return (
    <>
      {/* Print styles — simple approach: hide non-print UI, show invoice */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .print-only { display: block !important; }
          body { background: white !important; }
          .invoice-print-area {
            border: none !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 40px !important;
          }
        }
        @media screen {
          .print-only { display: none !important; }
        }
      `}</style>

      {/* Screen-only top bar + alerts (hidden on print) */}
      <div className="space-y-4 max-w-4xl mx-auto no-print">
        {/* Top Bar Navigation & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-1 text-xs font-medium hover:underline cursor-pointer"
            style={{ color: T.accent }}
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>Invoices</span>
          </button>

          <div className="flex items-center gap-2">
            {invoice.status !== 'Paid' && (
              <Button onClick={handleMarkAsPaid} variant="primary" size="sm" icon={<CheckCircle2 className="w-3.5 h-3.5" />}>
                Mark as Paid
              </Button>
            )}

            {invoice.status === 'Paid' && (
              <Button onClick={handleMarkAsPending} variant="secondary" size="sm" icon={<Clock className="w-3.5 h-3.5" />}>
                Reopen
              </Button>
            )}

            <Button onClick={handlePrint} variant="secondary" size="sm" icon={<Printer className="w-3.5 h-3.5" />}>
              Print
            </Button>

            <Button onClick={() => { onBack(); }} variant="secondary" size="sm" icon={<Edit2 className="w-3.5 h-3.5" />}>
              Edit
            </Button>

            <Button onClick={() => setConfirmDelete(true)} variant="danger" size="sm" icon={<Trash2 className="w-3.5 h-3.5" />}>
              Delete
            </Button>

            {/* More menu */}
            <div className="relative" ref={menuRef}>
              <Button
                onClick={() => setShowMenu(!showMenu)}
                variant="secondary"
                size="sm"
                isIconOnly
                icon={<MoreHorizontal className="w-3.5 h-3.5" />}
              />
              {showMenu && (
                <div className="absolute right-0 top-full mt-1 w-48 rounded-xl border shadow-xl z-50 py-1" style={{ backgroundColor: T.surface, borderColor: T.border }}>
                  <button onClick={handleEmailClient} className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium hover:bg-[#F1EDE7] cursor-pointer transition-colors" style={{ color: T.body }}>
                    <Send className="w-3.5 h-3.5" /> Email to Client
                  </button>
                  <button onClick={handleCopyInvoiceNumber} className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium hover:bg-[#F1EDE7] cursor-pointer transition-colors" style={{ color: T.body }}>
                    <Copy className="w-3.5 h-3.5" /> Copy Invoice #
                  </button>
                  <div className="h-px mx-2 my-1" style={{ backgroundColor: T.border }} />
                  <button onClick={() => { setConfirmDelete(true); setShowMenu(false); }} className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium hover:bg-red-50 cursor-pointer transition-colors" style={{ color: T.error }}>
                    <Trash2 className="w-3.5 h-3.5" /> Delete Invoice
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Due date alert banners */}
        {isOverdue && (
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-medium" style={{ backgroundColor: '#FF3B3010', color: T.error, border: '1px solid #FF3B3020' }}>
            <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: T.error }} />
            This invoice is {Math.abs(dueDays)} days overdue
          </div>
        )}
        {isDueSoon && !isOverdue && (
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-medium" style={{ backgroundColor: '#FF950010', color: '#C97100', border: '1px solid #FF950020' }}>
            <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: '#FF9500' }} />
            Due in {dueDays === 0 ? 'today' : `${dueDays} day${dueDays === 1 ? '' : 's'}`}
          </div>
        )}

      </div>

      {/* Printable Invoice Document Sheet (visible on screen AND in print) */}
      <div className="max-w-4xl mx-auto">
        <div ref={invoiceRef} className="invoice-print-area rounded-xl border p-6 sm:p-10 space-y-6" style={{ backgroundColor: T.surface, borderColor: T.border }}>
          {/* Header Branding & Invoice Meta */}
          <div className="flex flex-col sm:flex-row justify-between gap-4 pb-4 border-b" style={{ borderColor: T.border }}>
            <div className="flex items-start gap-3">
              <Logo size={36} />
              <div>
                <span className="text-lg font-semibold tracking-tight block" style={{ color: T.ink }}>SoloFlow</span>
                <div className="text-[11px] mt-1 space-y-0.5" style={{ color: T.muted }}>
                  <p>Design & Product Engineering</p>
                  <p>hello@soloflow.design</p>
                </div>
              </div>
            </div>

            <div className="sm:text-right">
              <h1 className="text-xl font-mono font-semibold" style={{ color: T.ink }}>{invoice.invoiceNumber}</h1>
              <div className="mt-1 flex sm:justify-end">
                <Badge variant={invoice.status.toLowerCase() as any} size="sm">{invoice.status}</Badge>
              </div>
              <div className="text-[11px] mt-2 space-y-0.5" style={{ color: T.muted }}>
                <p>Issued: {fmtDate(invoice.issueDate)}</p>
                <p>Due: {fmtDate(invoice.dueDate)}</p>
              </div>
            </div>
          </div>

          {/* Bill To Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4 border-b" style={{ borderColor: T.border }}>
            <div>
              <h3 className="text-[10px] uppercase tracking-wider font-semibold mb-1" style={{ color: T.muted }}>Billed To</h3>
              <p className="font-semibold text-xs" style={{ color: T.ink }}>{invoice.clientName}</p>
              <p className="text-[11px] mt-0.5" style={{ color: T.muted }}>{client?.email || 'billing@client.com'}</p>
              <p className="text-[11px]" style={{ color: T.muted }}>{client?.address || 'San Francisco, CA'}</p>
            </div>

            <div className="sm:text-right">
              <h3 className="text-[10px] uppercase tracking-wider font-semibold mb-1" style={{ color: T.muted }}>Payment Terms</h3>
              <p className="text-xs font-medium" style={{ color: T.ink }}>Net 14 Days</p>
              <p className="text-[11px] mt-0.5" style={{ color: T.muted }}>Direct ACH / Wire Transfer</p>
            </div>
          </div>

          {/* Items Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b text-[11px]" style={{ borderColor: T.border, color: T.muted }}>
                  <th className="pb-2 font-medium">Description</th>
                  <th className="pb-2 font-medium text-center">Qty</th>
                  <th className="pb-2 font-medium text-right">Rate</th>
                  <th className="pb-2 font-medium text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F4F0EA]">
                {invoice.items.map((item, idx) => (
                  <tr key={idx}>
                    <td className="py-2.5 font-medium" style={{ color: T.ink }}>{item.description}</td>
                    <td className="py-2.5 text-center" style={{ color: T.muted }}>{item.quantity}</td>
                    <td className="py-2.5 text-right" style={{ color: T.muted }}>${item.unitPrice.toLocaleString()}</td>
                    <td className="py-2.5 text-right font-medium" style={{ color: T.ink }}>${item.amount.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Total Summary Breakdown */}
          <div className="flex justify-end pt-2">
            <div className="w-full max-w-xs space-y-1.5 text-xs">
              <div className="flex justify-between" style={{ color: T.muted }}>
                <span>Subtotal</span>
                <span>${invoice.subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between" style={{ color: T.muted }}>
                <span>Tax ({invoice.taxRate}%)</span>
                <span>${invoice.taxAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between pt-2 border-t text-sm font-semibold" style={{ borderColor: T.border, color: T.ink }}>
                <span>Total Due</span>
                <span>${invoice.total.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          {invoice.notes && (
            <div className="p-3.5 rounded-lg border text-xs space-y-1" style={{ backgroundColor: T.surfaceWarm, borderColor: T.border }}>
              <p className="font-medium" style={{ color: T.ink }}>Notes</p>
              <p className="text-[11px] whitespace-pre-wrap" style={{ color: T.muted }}>{invoice.notes}</p>
            </div>
          )}

          {/* Footer Banking Details */}
          <div className="p-3.5 rounded-lg border text-xs space-y-1" style={{ backgroundColor: T.surfaceWarm, borderColor: T.border }}>
            <p className="font-medium" style={{ color: T.ink }}>Wire Transfer Instructions</p>
            <p className="text-[11px]" style={{ color: T.muted }}>
              Bank: Silicon Valley Bank · Account: •••• •••• 9941 · Routing: 121000358
            </p>
          </div>
        </div>

        {/* Invoice Metadata Footer */}
        <div className="flex items-center justify-between text-[10px] pt-2 no-print" style={{ color: T.borderStrong }}>
          <span>Created {fmtDate(invoice.createdAt)}</span>
          <span>ID: {invoice.id}</span>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setConfirmDelete(false)}>
          <div className="bg-white rounded-2xl border shadow-xl w-full max-w-sm mx-4 p-6 space-y-4" style={{ borderColor: T.border }} onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: '#FF3B3010', color: T.error }}>
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-semibold" style={{ color: T.ink }}>Delete Invoice</h2>
                <p className="text-[11px] mt-0.5" style={{ color: T.muted }}>This action cannot be undone.</p>
              </div>
            </div>
            <p className="text-xs" style={{ color: T.body }}>
              Are you sure you want to delete invoice <strong>{invoice.invoiceNumber}</strong> for <strong>{invoice.clientName}</strong>?
            </p>
            <div className="flex items-center justify-end gap-2 pt-1">
              <Button variant="secondary" size="sm" onClick={() => setConfirmDelete(false)}>Cancel</Button>
              <Button variant="danger" size="sm" isLoading={deleting} onClick={handleDelete}>Delete</Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
