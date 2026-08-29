import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Plus, Trash2, AlertCircle, DollarSign, Calculator } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Avatar } from '../components/ui/Avatar';
import { Skeleton } from '../components/ui/Skeleton';
import { useToast } from '../components/ui/Toast';
import { api } from '../services/api';
import type { Client, InvoiceItem } from '../types';

interface ClientInvoiceNewPageProps {
  onBack: (clientId: string) => void;
  onCreated: (clientId: string) => Promise<void>;
}

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
  error: '#D70015',
  success: '#248A3D',
};

interface ItemErrors {
  [idx: number]: { description?: string; quantity?: string; unitPrice?: string };
}

interface FormErrors {
  dueDate?: string;
  taxRate?: string;
  items?: string;
}

export const ClientInvoiceNewPage: React.FC<ClientInvoiceNewPageProps> = ({ onBack, onCreated }) => {
  const { clientId } = useParams<{ clientId: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [itemErrors, setItemErrors] = useState<ItemErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const defaultDueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const today = new Date().toISOString().slice(0, 10);

  const [dueDate, setDueDate] = useState(defaultDueDate);
  const [taxRate, setTaxRate] = useState(0);
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<InvoiceItem[]>([
    { id: '1', description: '', quantity: 1, unitPrice: 0, amount: 0 }
  ]);

  useEffect(() => {
    if (!clientId) { navigate('/clients', { replace: true }); return; }
    api.getClientById(clientId)
      .then(res => { setClient(res.client); setLoading(false); })
      .catch(() => { setLoading(false); });
  }, [clientId, navigate]);

  const inputClass = 'w-full px-3 py-2 text-[13px] bg-white border rounded-lg transition-all focus:outline-none';

  const handleFocus = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    e.currentTarget.style.borderColor = T.accent;
    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(147,122,98,0.15)';
  };

  const handleFieldBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    e.currentTarget.style.borderColor = T.border;
    e.currentTarget.style.boxShadow = 'none';
  };

  const handleAddItem = () => {
    setItems([...items, { id: String(Date.now()), description: '', quantity: 1, unitPrice: 0, amount: 0 }]);
  };

  const handleItemChange = (idx: number, field: keyof InvoiceItem, val: any) => {
    const copy = [...items];
    copy[idx] = { ...copy[idx], [field]: val };
    if (field === 'quantity' || field === 'unitPrice') {
      copy[idx].amount = (copy[idx].quantity || 0) * (copy[idx].unitPrice || 0);
    }
    setItems(copy);
    // Clear item errors for this field
    if (itemErrors[idx]?.[field as keyof typeof itemErrors[0]]) {
      const newErrors = { ...itemErrors };
      if (newErrors[idx]) {
        newErrors[idx] = { ...newErrors[idx], [field]: undefined };
      }
      setItemErrors(newErrors);
    }
  };

  const handleRemoveItem = (idx: number) => {
    if (items.length > 1) setItems(items.filter((_, i) => i !== idx));
  };

  const subtotal = useMemo(() => items.reduce((sum, it) => sum + (it.amount || 0), 0), [items]);
  const taxAmount = useMemo(() => (subtotal * taxRate) / 100, [subtotal, taxRate]);
  const total = useMemo(() => subtotal + taxAmount, [subtotal, taxAmount]);

  const validateForm = (): boolean => {
    const fe: FormErrors = {};
    const ie: ItemErrors = {};
    let valid = true;

    if (!dueDate) {
      fe.dueDate = 'Due date is required';
      valid = false;
    } else if (new Date(dueDate) < new Date(today)) {
      fe.dueDate = 'Due date must be in the future';
      valid = false;
    }

    if (taxRate < 0 || taxRate > 100) {
      fe.taxRate = 'Tax rate must be 0-100%';
      valid = false;
    }

    // Validate items
    const hasAnyItemContent = items.some(it => it.description.trim() || it.unitPrice > 0);
    if (!hasAnyItemContent) {
      fe.items = 'Add at least one line item with a description and price';
      valid = false;
    }

    items.forEach((item, idx) => {
      const errors: { description?: string; quantity?: string; unitPrice?: string } = {};
      if (!item.description.trim()) {
        errors.description = 'Description is required';
        valid = false;
      }
      if (item.quantity < 1) {
        errors.quantity = 'Qty must be at least 1';
        valid = false;
      }
      if (item.unitPrice < 0) {
        errors.unitPrice = 'Price cannot be negative';
        valid = false;
      }
      if (Object.keys(errors).length > 0) ie[idx] = errors;
    });

    setFormErrors(fe);
    setItemErrors(ie);
    return valid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!client || !clientId) return;

    if (!validateForm()) {
      showToast('Please fix the highlighted errors', 'error');
      return;
    }

    setSubmitting(true);
    try {
      await api.createClientInvoice(clientId, {
        dueDate,
        items: items.filter(it => it.description.trim() || it.unitPrice > 0),
        taxRate,
        notes,
        status: 'Sent'
      });
      showToast(`Invoice issued for ${client.name}!`, 'success');
      await onCreated(clientId);
    } catch (err: any) {
      showToast(err.message || 'Failed to create invoice', 'error');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 max-w-3xl mx-auto">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-8 w-48" />
        <Card className="p-6 space-y-4"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /><Skeleton className="h-20 w-full" /></Card>
      </div>
    );
  }

  if (!client || !clientId) {
    return (
      <div className="max-w-md mx-auto text-center py-16">
        <p className="text-sm text-[#6B6158]">Client not found.</p>
        <Button onClick={() => navigate('/clients')} variant="primary" size="sm" className="mt-4">Go to Clients</Button>
      </div>
    );
  }

  const hasFieldError = (field: keyof FormErrors) => touched[field] && formErrors[field];

  return (
    <div className="space-y-5 max-w-3xl mx-auto">
      {/* Back button */}
      <button
        onClick={() => onBack(clientId!)}
        className="inline-flex items-center gap-1 text-xs font-medium cursor-pointer hover:underline"
        style={{ color: T.accent }}
      >
        <ChevronLeft className="w-3.5 h-3.5" />
        <span>Back to {client.name}</span>
      </button>

      {/* Page header */}
      <div>
        <p className="text-[11px] uppercase tracking-[0.16em] font-semibold mb-2" style={{ color: T.accent }}>New Invoice</p>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight" style={{ color: T.ink }}>Issue an Invoice</h1>
        <div className="flex items-center gap-2 mt-2">
          <span className="text-xs" style={{ color: T.muted }}>Client:</span>
          <div className="flex items-center gap-1.5">
            <Avatar name={client.name} size="sm" />
            <span className="text-xs font-medium" style={{ color: T.ink }}>{client.name}</span>
          </div>
        </div>
      </div>

      {/* Form */}
      <Card className="p-6 sm:p-8">
        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          {/* Due Date + Tax + Total */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-[11px] font-medium mb-1.5" style={{ color: T.body }}>
                Due Date <span style={{ color: T.error }}>*</span>
              </label>
              <input
                type="date"
                required
                value={dueDate}
                min={today}
                onChange={e => setDueDate(e.target.value)}
                onBlur={(e) => { handleFieldBlur(e); setTouched(prev => ({ ...prev, dueDate: true })); }}
                className={inputClass}
                style={{ borderColor: hasFieldError('dueDate') ? T.error : T.border, color: T.ink }}
                onFocus={handleFocus}
              />
              {hasFieldError('dueDate') && (
                <div className="flex items-center gap-1 mt-1">
                  <AlertCircle className="w-3 h-3 shrink-0" style={{ color: T.error }} />
                  <span className="text-[11px] font-medium" style={{ color: T.error }}>{formErrors.dueDate}</span>
                </div>
              )}
            </div>
            <div>
              <label className="block text-[11px] font-medium mb-1.5 items-center gap-1" style={{ color: T.body }}>
                <Calculator className="w-3 h-3 inline" />
                Tax Rate (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.5"
                value={taxRate}
                onChange={e => {
                  const v = Number(e.target.value);
                  setTaxRate(v);
                  setTouched(prev => ({ ...prev, taxRate: true }));
                }}
                className={inputClass}
                style={{ borderColor: hasFieldError('taxRate') ? T.error : T.border, color: T.ink }}
                onFocus={handleFocus}
                onBlur={handleFieldBlur}
              />
              {hasFieldError('taxRate') && (
                <div className="flex items-center gap-1 mt-1">
                  <AlertCircle className="w-3 h-3 shrink-0" style={{ color: T.error }} />
                  <span className="text-[11px] font-medium" style={{ color: T.error }}>{formErrors.taxRate}</span>
                </div>
              )}
            </div>
            <div className="flex items-end">
              <div className="w-full p-2.5 rounded-lg" style={{ backgroundColor: T.surfaceWarm, border: `1px solid ${T.border}` }}>
                <div className="text-[10px] uppercase font-medium tracking-wide" style={{ color: T.muted }}>Total</div>
                <div className="text-lg font-bold tracking-tight" style={{ color: T.ink }}>
                  ${total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
            </div>
          </div>

          {/* Line Items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[11px] font-medium" style={{ color: T.body }}>
                Line Items <span style={{ color: T.error }}>*</span>
              </label>
              <Button type="button" variant="secondary" size="xs" icon={<Plus className="w-3 h-3" />} onClick={handleAddItem}>Add Item</Button>
            </div>
            {formErrors.items && (
              <div className="flex items-center gap-1 mb-2">
                <AlertCircle className="w-3 h-3 shrink-0" style={{ color: T.error }} />
                <span className="text-[11px] font-medium" style={{ color: T.error }}>{formErrors.items}</span>
              </div>
            )}

            {/* Column headers */}
            <div className="grid grid-cols-12 gap-2 mb-1.5 px-1">
              <div className="col-span-6 text-[10px] font-medium uppercase tracking-wide" style={{ color: T.muted }}>Description</div>
              <div className="col-span-2 text-[10px] font-medium uppercase tracking-wide text-right" style={{ color: T.muted }}>Qty</div>
              <div className="col-span-3 text-[10px] font-medium uppercase tracking-wide text-right" style={{ color: T.muted }}>Rate</div>
              <div className="col-span-1" />
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {items.map((item, idx) => (
                <div key={item.id || idx}>
                  <div className="grid grid-cols-12 gap-2 items-center">
                    <input
                      type="text"
                      required
                      placeholder="Description"
                      value={item.description}
                      onChange={e => handleItemChange(idx, 'description', e.target.value)}
                      className={`col-span-6 px-2.5 py-1.5 text-xs bg-white border rounded-lg focus:outline-none focus:border-[#82694E] ${itemErrors[idx]?.description ? 'border-[#FF3B30]' : 'border-[#EDE8E1]'}`}
                    />
                    <input
                      type="number"
                      min="1"
                      required
                      value={item.quantity}
                      onChange={e => handleItemChange(idx, 'quantity', Number(e.target.value) || 1)}
                      className={`col-span-2 px-2 py-1.5 text-xs bg-white border rounded-lg text-right focus:outline-none focus:border-[#82694E] ${itemErrors[idx]?.quantity ? 'border-[#FF3B30]' : 'border-[#EDE8E1]'}`}
                    />
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      required
                      value={item.unitPrice}
                      onChange={e => handleItemChange(idx, 'unitPrice', Number(e.target.value) || 0)}
                      className={`col-span-3 px-2 py-1.5 text-xs bg-white border rounded-lg text-right focus:outline-none focus:border-[#82694E] ${itemErrors[idx]?.unitPrice ? 'border-[#FF3B30]' : 'border-[#EDE8E1]'}`}
                    />
                    <div className="col-span-1 flex justify-center">
                      {items.length > 1 && (
                        <button type="button" onClick={() => handleRemoveItem(idx)} className="text-[#8C8278] hover:text-red-600 p-1 cursor-pointer transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                  {/* Item row subtotal */}
                  <div className="flex justify-end pr-14 mt-0.5">
                    <span className="text-[10px] font-medium" style={{ color: T.muted }}>
                      = ${(item.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Summary */}
            <div className="mt-3 pt-3 border-t" style={{ borderColor: T.bg }}>
              <div className="w-full max-w-xs ml-auto space-y-1 text-xs">
                <div className="flex justify-between" style={{ color: T.muted }}>
                  <span>Subtotal</span>
                  <span>${subtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                {taxRate > 0 && (
                  <div className="flex justify-between" style={{ color: T.muted }}>
                    <span>Tax ({taxRate}%)</span>
                    <span>${taxAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                )}
                <div className="flex justify-between pt-1.5 border-t text-sm font-bold" style={{ borderColor: T.border, color: T.ink }}>
                  <span>Total Due</span>
                  <span>${total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-[11px] font-medium mb-1.5" style={{ color: T.body }}>Notes / Payment Terms</label>
            <textarea
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Payment due upon receipt. Bank transfer details..."
              className={inputClass + ' resize-none'}
              style={{ borderColor: T.border, color: T.ink }}
              onFocus={handleFocus}
              onBlur={handleFieldBlur}
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-5 mt-1 border-t" style={{ borderColor: T.bg }}>
            <Button type="button" variant="secondary" size="sm" onClick={() => onBack(clientId!)}>Cancel</Button>
            <Button type="submit" variant="primary" size="sm" isLoading={submitting}>Issue Invoice</Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
