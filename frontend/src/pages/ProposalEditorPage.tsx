import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  ChevronLeft,
  Save,
  Send,
  Plus,
  Trash2,
  FileText,
  User as UserIcon,
  Briefcase,
  Wallet,
  Wand2,
  CircleDollarSign
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { useToast } from '../components/ui/Toast';
import { api } from '../services/api';
import type { Proposal, Client, Project } from '../types';

interface ProposalEditorPageProps {
  proposalId?: string | null;
  clients: Client[];
  projects: Project[];
  onBack: () => void;
  onSaved: (prop: Proposal) => void;
}

/* ── Design tokens (matched to dashboard & landing) ── */
const T = {
  bg: '#F8F7F5',
  surface: '#FFFFFF',
  surfaceWarm: '#FAF8F5',
  border: '#EDE8E1',
  borderStrong: '#E0D9CF',
  ink: '#1A1918',
  body: '#4A4037',
  muted: '#6B6158',
  faint: '#8C8278',
  accent: '#82694E',
  accentSoft: '#B39C82'
};

const SERIF = '"Playpen Sans", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';

const emptyBrief = {
  clientId: '',
  projectId: '',
  projectTitle: '',
  projectDescription: '',
  budget: '',
  tone: 'Professional' as 'Professional' | 'Friendly' | 'Persuasive'
};

export const ProposalEditorPage: React.FC<ProposalEditorPageProps> = ({
  proposalId,
  clients,
  projects,
  onBack,
  onSaved
}) => {
  const { showToast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // ── AI brief state — starts completely blank ──
  const [brief, setBrief] = useState(emptyBrief);

  // ── Proposal document state — starts completely blank ──
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [overview, setOverview] = useState('');
  const [scopeOfWork, setScopeOfWork] = useState<string[]>([]);
  const [deliverables, setDeliverables] = useState<string[]>([]);
  const [timeline, setTimeline] = useState('');
  const [investment, setInvestment] = useState('');
  const [proposalStatus, setProposalStatus] = useState<'Draft' | 'Sent' | 'Accepted'>('Draft');
  const [currentProposalId, setCurrentProposalId] = useState<string | null>(proposalId || null);

  const selectedClient = clients.find(c => c.id === brief.clientId) || null;

  // Load existing proposal if editing
  useEffect(() => {
    if (proposalId) {
      api.getProposalById(proposalId).then(res => {
        const p = res.proposal;
        setCurrentProposalId(p.id);
        setBrief({
          clientId: p.clientId || clients[0]?.id || '',
          projectId: p.projectId || '',
          projectTitle: p.title.replace(/^Proposal for /, ''),
          projectDescription: '',
          budget: String(p.amount ?? ''),
          tone: (p.tone as any) || 'Professional'
        });
        setTitle(p.title);
        setOverview(p.overview || '');
        setScopeOfWork(p.scopeOfWork && p.scopeOfWork.length > 0 ? p.scopeOfWork : []);
        setDeliverables(p.deliverables && p.deliverables.length > 0 ? p.deliverables : []);
        setTimeline(p.timeline || '');
        setInvestment(p.investment || '');
        setProposalStatus(p.status as any);
      }).catch(err => {
        console.error('Failed to load proposal', err);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [proposalId]);

  const canGenerate =
    !!brief.clientId &&
    brief.projectTitle.trim().length > 2 &&
    brief.projectDescription.trim().length > 10;

  const hasDocumentContent =
    title.trim().length > 0 ||
    overview.trim().length > 0 ||
    scopeOfWork.length > 0 ||
    deliverables.length > 0;

  // ── AI generation ──
  const handleGenerateAI = async () => {
    if (!canGenerate) return;
    const clientName = selectedClient?.name || '';

    try {
      setIsGenerating(true);
      showToast('Drafting your proposal with AI…', 'info');

      const res = await api.generateProposalAI({
        clientName,
        projectTitle: brief.projectTitle,
        description: brief.projectDescription,
        budget: brief.budget,
        tone: brief.tone
      });

      const generated = res.proposal;
      if (generated) {
        setTitle(generated.title || `Proposal for ${clientName}`);
        setSubtitle(generated.subtitle || `${brief.projectTitle} Engagement`);
        setOverview(generated.projectOverview || '');
        if (Array.isArray(generated.scopeOfWork)) setScopeOfWork(generated.scopeOfWork);
        if (Array.isArray(generated.deliverables)) setDeliverables(generated.deliverables);
        if (generated.timeline) setTimeline(generated.timeline);
        if (generated.investment) {
          const cost = generated.investment.totalCost ? `$${generated.investment.totalCost.toLocaleString()}` : brief.budget;
          const terms = generated.investment.paymentTerms || '';
          setInvestment([cost && `Total Project Cost: ${cost}.`, terms && `Payment Terms: ${terms}.`].filter(Boolean).join(' '));
        }
        showToast('Proposal drafted ✨ Review and refine below.', 'success');
      }
    } catch (err: any) {
      console.error(err);
      showToast('AI is unavailable right now — you can still write the proposal manually.', 'info');
    } finally {
      setIsGenerating(false);
    }
  };

  // ── Save / Send ──
  const handleSave = async (newStatus: 'Draft' | 'Sent' | 'Accepted' = proposalStatus) => {
    if (!brief.clientId) {
      showToast('Select a client first', 'error');
      return;
    }
    const clientName = selectedClient?.name || '';
    const amountNum = parseInt(brief.budget.replace(/[^0-9]/g, ''), 10) || 0;

    setIsSaving(true);
    try {
      let saved: Proposal;
      const payload = {
        title: title.trim() || `Proposal for ${clientName}`,
        clientId: brief.clientId,
        clientName,
        projectId: brief.projectId || undefined,
        amount: amountNum,
        status: newStatus,
        tone: brief.tone,
        overview,
        scopeOfWork,
        deliverables,
        timeline,
        investment
      };

      if (currentProposalId) {
        const res = await api.updateProposal(currentProposalId, payload);
        saved = res.proposal;
      } else {
        const res = await api.createProposal(payload);
        saved = res.proposal;
        setCurrentProposalId(saved.id);
      }

      setProposalStatus(newStatus);
      showToast(`Proposal ${newStatus === 'Sent' ? 'sent' : 'saved'} successfully`, 'success');
      onSaved(saved);
    } catch (e) {
      console.error(e);
      showToast('Failed to save proposal', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const allText = `${title} ${subtitle} ${overview} ${scopeOfWork.join(' ')} ${deliverables.join(' ')} ${timeline} ${investment}`;
  const wordCount = allText.trim() ? allText.trim().split(/\s+/).length : 0;

  const inputClass =
    'w-full px-3 py-2 text-[13px] bg-white border rounded-lg transition-all focus:outline-none';

  /* ── Small numbered step label used in the left panel ── */
  const StepLabel: React.FC<{ n: string; icon: React.ReactNode; label: string }> = ({ n, icon, label }) => (
    <div className="flex items-center gap-2 pb-2.5 border-b" style={{ borderColor: T.border }}>
      <span
        className="w-5 h-5 rounded-md flex items-center justify-center text-[9px] font-bold shrink-0"
        style={{ backgroundColor: T.surfaceWarm, color: T.accent, border: `1px solid ${T.borderStrong}` }}
      >
        {n}
      </span>
      <span className="shrink-0" style={{ color: T.accentSoft }}>{icon}</span>
      <h2 className="font-semibold text-xs tracking-wide" style={{ color: T.ink }}>{label}</h2>
    </div>
  );

  /* ── Numbered section header used in the document sheet ── */
  const DocSection: React.FC<{ n: number; label: string; action?: React.ReactNode; children: React.ReactNode }> = ({ n, label, action, children }) => (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-baseline gap-2.5">
          <span className="text-[11px] font-bold tabular-nums" style={{ color: T.accentSoft }}>0{n}</span>
          <h3 className="text-[13px] font-semibold tracking-tight" style={{ color: T.ink }}>{label}</h3>
        </div>
        {action}
      </div>
      {children}
    </div>
  );

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      {/* ══ Header ══ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onBack}
            className="p-1.5 -ml-1.5 rounded-lg text-[#6B6158] hover:text-[#1A1918] hover:bg-[#F1EDE7] flex items-center gap-1 text-xs font-medium cursor-pointer transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Proposals</span>
          </button>
          <span style={{ color: T.borderStrong }}>|</span>
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-bold tracking-tight truncate" style={{ color: T.ink }}>
                {currentProposalId ? 'Edit Proposal' : 'New Proposal'}
              </h1>
              <p className="text-[11px] truncate" style={{ color: T.faint }}>
                {selectedClient ? `For ${selectedClient.name}` : 'Start with a short brief — AI drafts the rest'}
              </p>
            </div>
            <Badge variant={proposalStatus.toLowerCase() as any} size="sm">
              {proposalStatus}
            </Badge>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            onClick={() => handleSave('Draft')}
            variant="secondary"
            size="sm"
            isLoading={isSaving}
            icon={<Save className="w-3 h-3" />}
          >
            Save draft
          </Button>
          <Button
            onClick={() => handleSave('Sent')}
            variant="primary"
            size="sm"
            isLoading={isSaving}
            icon={<Send className="w-3 h-3" />}
          >
            Send proposal
          </Button>
        </div>
      </div>

      {/* ══ Split view ══ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">

        {/* ── Left pane: AI Brief (steps 01–03) ── */}
        <Card padding="md" className="lg:col-span-4 space-y-5 lg:sticky lg:top-20">
          <div className="flex items-center gap-2 pb-1">
            <span
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #453B33 0%, #6F5D42 100%)', color: '#FBEED9' }}
            >
              <Sparkles className="w-3.5 h-3.5" />
            </span>
            <div>
              <h2 className="font-bold text-sm tracking-tight" style={{ color: T.ink }}>AI Brief</h2>
              <p className="text-[10px]" style={{ color: T.faint }}>Three quick inputs → a full draft</p>
            </div>
          </div>

          {/* Step 01 — Client & context */}
          <div className="space-y-2.5">
            <StepLabel n="01" icon={<UserIcon className="w-3 h-3" />} label="Client & context" />
            <select
              value={brief.clientId}
              onChange={e => setBrief({ ...brief, clientId: e.target.value })}
              className={inputClass + ' cursor-pointer'}
              style={{ borderColor: T.border, color: T.ink }}
            >
              <option value="">Select a client…</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <select
              value={brief.projectId}
              onChange={e => setBrief({ ...brief, projectId: e.target.value })}
              className={inputClass + ' cursor-pointer'}
              style={{ borderColor: T.border, color: T.ink }}
            >
              <option value="">Link a project (optional)</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.title}</option>
              ))}
            </select>
          </div>

          {/* Step 02 — Project brief */}
          <div className="space-y-2.5">
            <StepLabel n="02" icon={<Briefcase className="w-3 h-3" />} label="Project brief" />
            <input
              type="text"
              value={brief.projectTitle}
              onChange={e => setBrief({ ...brief, projectTitle: e.target.value })}
              placeholder="e.g. Brand identity & website redesign"
              className={inputClass}
              style={{ borderColor: T.border, color: T.ink }}
            />
            <textarea
              rows={4}
              value={brief.projectDescription}
              onChange={e => setBrief({ ...brief, projectDescription: e.target.value })}
              placeholder="Describe the work in a sentence or two — goals, scope, anything the client shared…"
              className={inputClass + ' resize-none leading-relaxed'}
              style={{ borderColor: T.border, color: T.ink }}
            />
          </div>

          {/* Step 03 — Investment & tone */}
          <div className="space-y-2.5">
            <StepLabel n="03" icon={<Wallet className="w-3 h-3" />} label="Investment & tone" />
            <div className="grid grid-cols-2 gap-2.5">
              <div className="relative">
                <CircleDollarSign className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: T.accentSoft }} />
                <input
                  type="text"
                  inputMode="numeric"
                  value={brief.budget}
                  onChange={e => setBrief({ ...brief, budget: e.target.value })}
                  placeholder="Budget"
                  className={inputClass + ' pl-8'}
                  style={{ borderColor: T.border, color: T.ink }}
                />
              </div>
              <select
                value={brief.tone}
                onChange={e => setBrief({ ...brief, tone: e.target.value as any })}
                className={inputClass + ' cursor-pointer'}
                style={{ borderColor: T.border, color: T.ink }}
              >
                <option value="Professional">Professional</option>
                <option value="Friendly">Friendly</option>
                <option value="Persuasive">Persuasive</option>
              </select>
            </div>
          </div>

          {/* Generate CTA */}
          <div className="pt-1">
            <Button
              onClick={handleGenerateAI}
              disabled={!canGenerate}
              isLoading={isGenerating}
              variant="primary"
              size="md"
              className="w-full"
              icon={<Wand2 className="w-3.5 h-3.5" />}
            >
              {hasDocumentContent ? 'Regenerate draft' : 'Generate draft with AI'}
            </Button>
            {!canGenerate && (
              <p className="text-[10px] mt-2 text-center leading-relaxed" style={{ color: T.faint }}>
                Add a client, a project title and a short brief to unlock generation.
              </p>
            )}
          </div>
        </Card>

        {/* ── Right pane: Document sheet ── */}
        <div className="lg:col-span-8 space-y-2.5">
          <div
            className="bg-white rounded-xl border shadow-[0_1px_3px_rgba(74,59,50,0.05)] p-6 sm:p-10 space-y-7 relative overflow-hidden texture-light"
            style={{ borderColor: T.borderStrong, minHeight: 520 }}
          >
            {/* Document masthead */}
            <div className="border-b pb-6" style={{ borderColor: T.border }}>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Untitled Proposal"
                className="w-full text-2xl sm:text-[28px] font-bold tracking-tight focus:outline-none border-b border-transparent focus:border-[#82694E] pb-1 placeholder:text-[#CFC7BC]"
                style={{ fontFamily: SERIF, color: T.ink }}
              />
              <input
                type="text"
                value={subtitle}
                onChange={e => setSubtitle(e.target.value)}
                placeholder="Add a subtitle — e.g. the engagement name or date"
                className="w-full text-[13px] focus:outline-none border-b border-transparent focus:border-[#82694E] mt-1.5 placeholder:text-[#CFC7BC]"
                style={{ color: T.muted }}
              />
              {selectedClient && (
                <div className="flex items-center gap-1.5 mt-3 text-[11px] font-medium" style={{ color: T.accent }}>
                  <FileText className="w-3 h-3" />
                  Prepared for {selectedClient.name}{selectedClient.company ? ` · ${selectedClient.company}` : ''}
                </div>
              )}
            </div>

            {!hasDocumentContent ? (
              /* Empty state — elegant invitation */
              <div className="py-14 flex flex-col items-center justify-center text-center">
                <span
                  className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
                  style={{ backgroundColor: T.surfaceWarm, border: `1px solid ${T.border}`, color: T.accentSoft }}
                >
                  <Sparkles className="w-5 h-5" />
                </span>
                <h3 className="text-sm font-semibold" style={{ fontFamily: SERIF, color: T.ink }}>
                  Your proposal starts here
                </h3>
                <p className="text-xs mt-1.5 max-w-[300px] leading-relaxed" style={{ color: T.muted }}>
                  Fill in the three-step brief on the left and generate a tailored draft —
                  or start writing each section manually below.
                </p>
              </div>
            ) : (
              <>
                {/* 01 Overview */}
                <DocSection n={1} label="Project overview">
                  <textarea
                    rows={4}
                    value={overview}
                    onChange={e => setOverview(e.target.value)}
                    placeholder="Open with the client's goal and how your work solves it…"
                    className="w-full text-[13px] leading-relaxed focus:outline-none border border-transparent hover:border-[#EDE8E1] focus:border-[#82694E] p-3 rounded-lg bg-[#FAF8F5]/60 resize-none placeholder:text-[#CFC7BC]"
                    style={{ color: T.body }}
                  />
                </DocSection>

                {/* 02 Scope of work */}
                <DocSection
                  n={2}
                  label="Scope of work"
                  action={
                    <button
                      onClick={() => setScopeOfWork([...scopeOfWork, ''])}
                      className="text-[11px] font-medium hover:underline flex items-center gap-0.5 cursor-pointer"
                      style={{ color: T.accent }}
                    >
                      <Plus className="w-3 h-3" /> Add item
                    </button>
                  }
                >
                  {scopeOfWork.length === 0 ? (
                    <p className="text-[11px] px-3 py-2 rounded-lg" style={{ color: T.faint, backgroundColor: T.surfaceWarm }}>
                      No scope items yet — add them manually or via AI generation.
                    </p>
                  ) : (
                    <div className="space-y-1.5">
                      {scopeOfWork.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-2.5 group">
                          <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: T.accentSoft }} />
                          <input
                            type="text"
                            value={item}
                            onChange={e => {
                              const copy = [...scopeOfWork];
                              copy[idx] = e.target.value;
                              setScopeOfWork(copy);
                            }}
                            placeholder="Describe this phase of work…"
                            className="flex-1 text-[13px] focus:outline-none border-b border-transparent hover:border-[#EDE8E1] focus:border-[#82694E] py-1 placeholder:text-[#CFC7BC]"
                            style={{ color: T.ink }}
                          />
                          <button
                            onClick={() => setScopeOfWork(scopeOfWork.filter((_, i) => i !== idx))}
                            className="opacity-0 group-hover:opacity-100 p-1 rounded-md hover:bg-[#FFF5F5] cursor-pointer transition-all"
                            style={{ color: '#B4552F' }}
                            aria-label="Remove item"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </DocSection>

                {/* 03 Deliverables */}
                <DocSection
                  n={3}
                  label="Key deliverables"
                  action={
                    <button
                      onClick={() => setDeliverables([...deliverables, ''])}
                      className="text-[11px] font-medium hover:underline flex items-center gap-0.5 cursor-pointer"
                      style={{ color: T.accent }}
                    >
                      <Plus className="w-3 h-3" /> Add item
                    </button>
                  }
                >
                  {deliverables.length === 0 ? (
                    <p className="text-[11px] px-3 py-2 rounded-lg" style={{ color: T.faint, backgroundColor: T.surfaceWarm }}>
                      No deliverables yet — add them manually or via AI generation.
                    </p>
                  ) : (
                    <div className="space-y-1.5">
                      {deliverables.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-2.5 group">
                          <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: T.accentSoft }} />
                          <input
                            type="text"
                            value={item}
                            onChange={e => {
                              const copy = [...deliverables];
                              copy[idx] = e.target.value;
                              setDeliverables(copy);
                            }}
                            placeholder="What exactly will the client receive?…"
                            className="flex-1 text-[13px] focus:outline-none border-b border-transparent hover:border-[#EDE8E1] focus:border-[#82694E] py-1 placeholder:text-[#CFC7BC]"
                            style={{ color: T.ink }}
                          />
                          <button
                            onClick={() => setDeliverables(deliverables.filter((_, i) => i !== idx))}
                            className="opacity-0 group-hover:opacity-100 p-1 rounded-md hover:bg-[#FFF5F5] cursor-pointer transition-all"
                            style={{ color: '#B4552F' }}
                            aria-label="Remove item"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </DocSection>

                {/* 04 Timeline */}
                <DocSection n={4} label="Timeline & milestones">
                  <input
                    type="text"
                    value={timeline}
                    onChange={e => setTimeline(e.target.value)}
                    placeholder="e.g. Estimated delivery: 3–4 weeks from kickoff"
                    className="w-full text-[13px] focus:outline-none border border-transparent hover:border-[#EDE8E1] focus:border-[#82694E] px-3 py-2 rounded-lg bg-[#FAF8F5]/60 placeholder:text-[#CFC7BC]"
                    style={{ color: T.ink }}
                  />
                </DocSection>

                {/* 05 Investment */}
                <DocSection n={5} label="Investment & payment terms">
                  <textarea
                    rows={2}
                    value={investment}
                    onChange={e => setInvestment(e.target.value)}
                    placeholder="e.g. Total cost $X. 50% deposit at kickoff, 50% on delivery."
                    className="w-full text-[13px] leading-relaxed focus:outline-none border border-transparent hover:border-[#EDE8E1] focus:border-[#82694E] p-3 rounded-lg bg-[#FAF8F5]/60 resize-none placeholder:text-[#CFC7BC]"
                    style={{ color: T.body }}
                  />
                </DocSection>
              </>
            )}

            {/* Document footer signature line */}
            <div className="pt-5 border-t flex items-center justify-between" style={{ borderColor: T.border }}>
              <span className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: T.accentSoft }}>
                SoloFlow · Confidential proposal
              </span>
              <span className="text-[10px]" style={{ color: T.faint }}>
                {wordCount} words · Auto-synced
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};