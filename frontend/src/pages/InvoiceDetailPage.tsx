import React, { useState, useEffect } from 'react';
import {
  ChevronLeft,
  Send,
  CheckCircle2,
  Printer,
  Mail
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Logo } from '../components/ui/Logo';
import { Skeleton, CardSkeleton } from '../components/ui/Skeleton';
import { useToast } from '../components/ui/Toast';
import { api } from '../services/api';
import type { Invoice, Client } from '../types';

interface InvoiceDetailPageProps {
  invoiceId: string;
  clients: Client[];
  onBack: () => void;
  onUpdateStatus: (id: string, status: string) => Promise<void>;
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

export const InvoiceDetailPage: React.FC<InvoiceDetailPageProps> = ({
  invoiceId,
  clients,
  onBack,
  onUpdateStatus
}) => {
  const { showToast } = useToast();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await api.getInvoiceById(invoiceId);
      setInvoice(res.invoice);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [invoiceId]);

  if (loading || !invoice) {
    return (
      <div className="space-y-4 max-w-4xl mx-auto">
        <Skeleton className="h-4 w-24" />
        <CardSkeleton lines={6} />
      </div>
    );
  }

  const client = clients.find(c => c.id === invoice.clientId);

  const handleMarkAsPaid = async () => {
    await onUpdateStatus(invoice.id, 'Paid');
    setInvoice({ ...invoice, status: 'Paid' });
    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.6 }
    });
    showToast(`Invoice ${invoice.invoiceNumber} marked as Paid`, 'success');
  };

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
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
            <Button
              onClick={handleMarkAsPaid}
              variant="primary"
              size="sm"
              icon={<CheckCircle2 className="w-3.5 h-3.5" />}
            >
              Mark as Paid
            </Button>
          )}

          <Button
            onClick={() => window.print()}
            variant="secondary"
            size="sm"
            icon={<Printer className="w-3.5 h-3.5" />}
          >
            Print
          </Button>

          <Button
            onClick={() => showToast(`Invoice sent to ${client?.email || 'client'}`, 'success')}
            variant="secondary"
            size="sm"
            icon={<Send className="w-3.5 h-3.5" />}
          >
            Send
          </Button>
        </div>
      </div>

      {/* Printable Invoice Document Sheet */}
      <div
        className="rounded-xl border p-6 sm:p-10 space-y-6"
        style={{ backgroundColor: T.surface, borderColor: T.border }}
      >
        {/* Header Branding & Invoice Meta */}
        <div className="flex flex-col sm:flex-row justify-between gap-4 pb-4 border-b" style={{ borderColor: T.border }}>
          <div className="flex items-start gap-3">
            <Logo size={36} />
            <div>
              <span className="text-lg font-semibold tracking-tight block" style={{ color: T.ink }}>
                SoloFlow
              </span>
              <div className="text-[11px] mt-1 space-y-0.5" style={{ color: T.muted }}>
                <p>Design & Product Engineering</p>
                <p>hello@soloflow.design</p>
              </div>
            </div>
          </div>

          <div className="sm:text-right">
            <h1 className="text-xl font-mono font-semibold" style={{ color: T.ink }}>{invoice.invoiceNumber}</h1>
            <div className="mt-1 flex sm:justify-end">
              <Badge variant={invoice.status.toLowerCase() as any} size="sm">
                {invoice.status}
              </Badge>
            </div>
            <div className="text-[11px] mt-2 space-y-0.5" style={{ color: T.muted }}>
              <p>Issued: {invoice.issueDate}</p>
              <p>Due: {invoice.dueDate}</p>
            </div>
          </div>
        </div>

        {/* Bill To Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4 border-b" style={{ borderColor: T.border }}>
          <div>
            <h3 className="text-[10px] uppercase tracking-wider font-semibold mb-1" style={{ color: T.muted }}>
              Billed To
            </h3>
            <p className="font-semibold text-xs" style={{ color: T.ink }}>{invoice.clientName}</p>
            <p className="text-[11px] mt-0.5" style={{ color: T.muted }}>{client?.email || 'billing@client.com'}</p>
            <p className="text-[11px]" style={{ color: T.muted }}>{client?.address || 'San Francisco, CA'}</p>
          </div>

          <div className="sm:text-right">
            <h3 className="text-[10px] uppercase tracking-wider font-semibold mb-1" style={{ color: T.muted }}>
              Payment Terms
            </h3>
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

        {/* Footer Banking Details */}
        <div
          className="p-3.5 rounded-lg border text-xs space-y-1"
          style={{ backgroundColor: T.surfaceWarm, borderColor: T.border }}
        >
          <p className="font-medium" style={{ color: T.ink }}>Wire Transfer Instructions</p>
          <p className="text-[11px]" style={{ color: T.muted }}>
            Bank: Silicon Valley Bank • Account: •••• •••• 9941 • Routing: 121000358
          </p>
        </div>
      </div>
    </div>
  );
};