import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, AlertCircle, CalendarDays, DollarSign, Flag } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Avatar } from '../components/ui/Avatar';
import { Skeleton } from '../components/ui/Skeleton';
import { useToast } from '../components/ui/Toast';
import { api } from '../services/api';
import type { Client, Project, ProjectPriority, ProjectStatus } from '../types';

interface ClientProjectNewPageProps {
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
  dark: '#2A2320',
  error: '#D70015',
  success: '#248A3D',
};

interface FieldErrors {
  title?: string;
  deadline?: string;
  startDate?: string;
  budget?: string;
}

export const ClientProjectNewPage: React.FC<ClientProjectNewPageProps> = ({ onBack, onCreated }) => {
  const { clientId } = useParams<{ clientId: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const today = new Date().toISOString().slice(0, 10);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    budget: null as number | null,
    priority: 'Medium' as ProjectPriority,
    status: 'To Do' as ProjectStatus,
    deadline: '',
    startDate: '',
  });

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

  const handleFieldBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>, field?: string) => {
    e.currentTarget.style.borderColor = T.border;
    e.currentTarget.style.boxShadow = 'none';
    if (field) handleBlur(field);
  };

  const validate = (field?: string): FieldErrors => {
    const e: FieldErrors = {};

    if (!field || field === 'title') {
      if (!formData.title.trim()) e.title = 'Project title is required';
      else if (formData.title.trim().length < 2) e.title = 'Title must be at least 2 characters';
      else if (formData.title.trim().length > 100) e.title = 'Title must be under 100 characters';
    }

    if (!field || field === 'deadline') {
      if (!formData.deadline) e.deadline = 'Deadline is required';
    }

    if (!field || field === 'startDate') {
      if (formData.startDate && formData.deadline) {
        const start = new Date(formData.startDate);
        const deadline = new Date(formData.deadline);
        if (start > deadline) {
          e.startDate = 'Start date must be before the deadline';
        }
      }
    }

    if (!field || field === 'budget') {
      if (formData.budget !== null) {
        if (formData.budget < 0) e.budget = 'Budget cannot be negative';
        else if (formData.budget > 10000000) e.budget = 'Budget must be under $10M';
      }
    }

    return e;
  };

  const handleBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    const fieldErrors = validate(field);
    setErrors(prev => ({ ...prev, ...fieldErrors }));
  };

  const updateField = <K extends keyof typeof formData>(key: K, value: (typeof formData)[K]) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    // Clear error for this field when user starts typing
    if (touched[key]) {
      const fieldErrors = validate(key as string);
      setErrors(prev => ({ ...prev, [key]: fieldErrors[key as keyof FieldErrors] }));
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Validate all fields
    setTouched({ title: true, deadline: true, startDate: true, budget: true });
    const allErrors = validate();
    setErrors(allErrors);
    if (Object.keys(allErrors).length > 0) {
      showToast('Please fix the highlighted errors', 'error');
      return;
    }

    setSubmitting(true);
    try {
      await api.createClientProject(clientId, {
        title: formData.title.trim(),
        description: formData.description.trim(),
        budget: formData.budget || 0,
        priority: formData.priority,
        status: formData.status,
        deadline: formData.deadline,
        startDate: formData.startDate || undefined,
      });
      showToast(`Project "${formData.title}" created for ${client.name}!`, 'success');
      await onCreated(clientId);
    } catch (err: any) {
      showToast(err.message || 'Failed to create project', 'error');
      setSubmitting(false);
    }
  };

  const hasError = (field: keyof FieldErrors) => touched[field] && errors[field];

  const errorClass = (field: keyof FieldErrors) =>
    hasError(field) ? 'border-[#FF3B30]' : '';

  const errorHelper = (field: keyof FieldErrors) =>
    hasError(field) ? (
      <div className="flex items-center gap-1 mt-1">
        <AlertCircle className="w-3 h-3 shrink-0" style={{ color: T.error }} />
        <span className="text-[11px] font-medium" style={{ color: T.error }}>{errors[field]}</span>
      </div>
    ) : null;

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
        <p className="text-[11px] uppercase tracking-[0.16em] font-semibold mb-2" style={{ color: T.accent }}>New Project</p>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight" style={{ color: T.ink }}>Create a Project</h1>
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
          {/* Title */}
          <div>
            <label className="block text-[11px] font-medium mb-1.5" style={{ color: T.body }}>
              Project Title <span style={{ color: T.error }}>*</span>
            </label>
            <input
              type="text"
              required
              autoFocus
              value={formData.title}
              onChange={e => updateField('title', e.target.value)}
              onFocus={handleFocus}
              onBlur={(e) => handleFieldBlur(e, 'title')}
              placeholder="e.g. Website Redesign & SEO"
              className={`${inputClass} ${errorClass('title')}`}
              style={{ borderColor: hasError('title') ? T.error : T.border, color: T.ink }}
            />
            {errorHelper('title')}
          </div>

          {/* Description */}
          <div>
            <label className="block text-[11px] font-medium mb-1.5" style={{ color: T.body }}>Description & Scope</label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              placeholder="Key project goals, deliverables, and scope notes..."
              className={inputClass + ' resize-none'}
              style={{ borderColor: T.border, color: T.ink }}
              onFocus={handleFocus}
              onBlur={handleFieldBlur}
            />
          </div>

          {/* Budget + Priority */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-medium mb-1.5 items-center gap-1" style={{ color: T.body }}>
                <DollarSign className="w-3 h-3 inline" />
                Budget (USD)
              </label>
              <input
                type="number"
                min="0"
                step="100"
                value={formData.budget ?? ''}
                onChange={e => updateField('budget', e.target.value === '' ? null : Number(e.target.value))}
                onFocus={handleFocus}
                onBlur={(e) => handleFieldBlur(e, 'budget')}
                placeholder="0"
                className={`${inputClass} ${errorClass('budget')}`}
                style={{ borderColor: hasError('budget') ? T.error : T.border, color: T.ink }}
              />
              {errorHelper('budget')}
            </div>
            <div>
              <label className="block text-[11px] font-medium mb-1.5 items-center gap-1" style={{ color: T.body }}>
                <Flag className="w-3 h-3 inline" />
                Priority
              </label>
              <select
                value={formData.priority}
                onChange={e => updateField('priority', e.target.value as ProjectPriority)}
                className={inputClass + ' cursor-pointer'}
                style={{ borderColor: T.border, color: T.ink, backgroundColor: T.surface }}
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
              </select>
            </div>
          </div>

          {/* Status + Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-[11px] font-medium mb-1.5" style={{ color: T.body }}>Status</label>
              <select
                value={formData.status}
                onChange={e => updateField('status', e.target.value as ProjectStatus)}
                className={inputClass + ' cursor-pointer'}
                style={{ borderColor: T.border, color: T.ink, backgroundColor: T.surface }}
              >
                <option value="To Do">To Do</option>
                <option value="In Progress">In Progress</option>
                <option value="On Hold">On Hold</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-medium mb-1.5 items-center gap-1" style={{ color: T.body }}>
                <CalendarDays className="w-3 h-3 inline" />
                Start Date
              </label>
              <input
                type="date"
                value={formData.startDate}
                min={today}
                onChange={e => updateField('startDate', e.target.value)}
                className={`${inputClass} ${errorClass('startDate')}`}
                style={{ borderColor: hasError('startDate') ? T.error : T.border, color: T.ink }}
                onFocus={handleFocus}
                onBlur={(e) => handleFieldBlur(e, 'startDate')}
              />
            {errorHelper('startDate')}
            </div>
            <div>
              <label className="block text-[11px] font-medium mb-1.5 items-center gap-1" style={{ color: T.body }}>
                <CalendarDays className="w-3 h-3 inline" />
                Deadline <span style={{ color: T.error }}>*</span>
              </label>
              <input
                type="date"
                required
                value={formData.deadline}
                min={formData.startDate || today}
                onChange={e => updateField('deadline', e.target.value)}
                onFocus={handleFocus}
                onBlur={(e) => handleFieldBlur(e, 'deadline')}
                className={`${inputClass} ${errorClass('deadline')}`}
                style={{ borderColor: hasError('deadline') ? T.error : T.border, color: T.ink }}
              />
              {errorHelper('deadline')}
            </div>
          </div>

          {/* Smart hints */}
          {formData.startDate && formData.deadline && new Date(formData.startDate) <= new Date(formData.deadline) && (
            <div className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-medium" style={{ backgroundColor: '#34C75910', color: T.success }}>
              <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: T.success }} />
              Project duration: {Math.ceil((new Date(formData.deadline).getTime() - new Date(formData.startDate).getTime()) / (1000 * 60 * 60 * 24))} days
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-5 mt-1 border-t" style={{ borderColor: T.bg }}>
            <Button type="button" variant="secondary" size="sm" onClick={() => onBack(clientId!)}>Cancel</Button>
            <Button type="submit" variant="primary" size="sm" isLoading={submitting}>Create Project</Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
