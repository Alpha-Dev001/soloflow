import React, { useState } from 'react';
import { ArrowRight, Check, ChevronLeft } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { AuthLayout } from '../components/auth/AuthLayout';
import type { User } from '../types';

interface OnboardingPageProps {
  user: User | null;
  onComplete: (data: OnboardingData) => Promise<void>;
  onNavigateLanding: () => void;
}

export interface OnboardingData {
  businessName: string;
  currency: string;
  profession: string;
  goals: string[];
}

const T = {
  border: '#EDE8E1',
  borderStrong: '#E0D9CF',
  ink: '#1A1918',
  body: '#6B6158',
  muted: '#8C8278',
  accent: '#937A62',
  surfaceWarm: '#FAF8F5'
};

const professions = [
  'Designer',
  'Developer',
  'Writer / Copywriter',
  'Consultant',
  'Photographer / Videographer',
  'Marketer',
  'Other'
];

const goalOptions = [
  { id: 'clients', label: 'Manage clients', desc: 'One calm place for every account' },
  { id: 'invoices', label: 'Send invoices', desc: 'Get paid faster with less admin' },
  { id: 'proposals', label: 'Win work with AI proposals', desc: 'Polished scopes in minutes' }
];

const inputClass =
  'w-full px-3 py-2.5 text-[14px] bg-white border rounded-lg transition-all focus:outline-none';

export const OnboardingPage: React.FC<OnboardingPageProps> = ({
  user,
  onComplete,
  onNavigateLanding
}) => {
  const [step, setStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [data, setData] = useState<OnboardingData>({
    businessName: user?.businessName || user?.company || '',
    currency: user?.currency || 'USD',
    profession: '',
    goals: ['clients', 'invoices']
  });

  const toggleGoal = (g: string) => {
    setData(d => ({
      ...d,
      goals: d.goals.includes(g) ? d.goals.filter(x => x !== g) : [...d.goals, g]
    }));
  };

  const canContinue =
    step === 1
      ? data.businessName.trim().length > 0
      : step === 2
      ? data.profession.length > 0
      : data.goals.length > 0;

  const handleFinish = async () => {
    setIsSaving(true);
    try {
      await onComplete(data);
    } finally {
      setIsSaving(false);
    }
  };

  const stepTitles = ['Your business', 'Your work', 'Your goals'];
  const stepSubtitles = [
    'Tell us about the business you run.',
    'What kind of work do you do?',
    'What matters most right now? We will shape your dashboard around it.'
  ];

  return (
    <AuthLayout variant="register" onNavigateLanding={onNavigateLanding}>
      {/* Fixed-height column: content never scrolls and navigation stays put */}
      <div className="h-[500px] flex flex-col">
        {/* Progress indicator */}
        <div className="flex items-center gap-2 mb-6 shrink-0">
          {[1, 2, 3].map(s => (
            <React.Fragment key={s}>
              <span
                className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-semibold transition-colors"
                style={{
                  backgroundColor: s < step ? T.accent : s === step ? T.ink : T.surfaceWarm,
                  color: s <= step ? '#FFFFFF' : T.muted,
                  border: `1px solid ${s === step ? T.ink : T.border}`
                }}
              >
                {s < step ? <Check className="w-3.5 h-3.5" /> : s}
              </span>
              {s < 3 && (
                <span
                  className="flex-1 h-px rounded-full transition-colors"
                  style={{ backgroundColor: s < step ? T.accent : T.border }}
                />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Step header */}
        <div className="shrink-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] mb-1.5" style={{ color: T.accent }}>
            Step {step} of 3
          </p>
          <h1 className="text-2xl font-bold tracking-tight mb-1" style={{ color: T.ink }}>
            {stepTitles[step - 1]}
          </h1>
          <p className="text-sm" style={{ color: T.body }}>
            {stepSubtitles[step - 1]}
          </p>
        </div>

        {/* ── Step content — compact, fits without scrolling ── */}
        <div className="flex-1 pt-6 overflow-hidden">
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label className="block text-[12px] font-medium mb-1.5" style={{ color: T.body }}>
                Business name
              </label>
              <input
                type="text"
                autoFocus
                value={data.businessName}
                onChange={e => setData({ ...data, businessName: e.target.value })}
                placeholder="e.g. John Doe Design Studio"
                className={inputClass}
                style={{ borderColor: T.border, color: T.ink }}
                onFocus={e => { e.currentTarget.style.borderColor = T.accent; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(147,122,98,0.15)'; }}
                onBlur={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.boxShadow = 'none'; }}
              />
            </div>
            <div>
              <label className="block text-[12px] font-medium mb-1.5" style={{ color: T.body }}>
                Preferred currency
              </label>
              <select
                value={data.currency}
                onChange={e => setData({ ...data, currency: e.target.value })}
                className={inputClass + ' cursor-pointer'}
                style={{ borderColor: T.border, color: T.ink, backgroundColor: '#FFFFFF' }}
              >
                <option value="USD">USD — US Dollar</option>
                <option value="EUR">EUR — Euro</option>
                <option value="GBP">GBP — British Pound</option>
                <option value="RWF">RWF — Rwandan Franc</option>
                <option value="KES">KES — Kenyan Shilling</option>
                <option value="NGN">NGN — Nigerian Naira</option>
                <option value="CAD">CAD — Canadian Dollar</option>
                <option value="AUD">AUD — Australian Dollar</option>
              </select>
            </div>
          </div>
        )}

        {/* ── Step 2: Work ── */}
        {step === 2 && (
          <div className="space-y-5">
            <div>
              <label className="block text-[12px] font-medium mb-2" style={{ color: T.body }}>
                I am a…
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {professions.map(p => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setData({ ...data, profession: p })}
                    className="px-3 py-2.5 rounded-lg border text-left text-[13px] font-medium transition-all cursor-pointer flex items-center justify-between"
                    style={{
                      borderColor: data.profession === p ? T.accent : T.border,
                      backgroundColor: data.profession === p ? T.surfaceWarm : '#FFFFFF',
                      color: T.ink,
                      boxShadow: data.profession === p ? '0 0 0 3px rgba(147,122,98,0.15)' : 'none'
                    }}
                  >
                    <span>{p}</span>
                    {data.profession === p && <Check className="w-4 h-4" style={{ color: T.accent }} />}
                  </button>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* ── Step 3: Goals ── */}
        {step === 3 && (
          <div className="space-y-2.5">
            {goalOptions.map(g => {
              const selected = data.goals.includes(g.id);
              return (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => toggleGoal(g.id)}
                  className="w-full px-4 py-3.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-3"
                  style={{
                    borderColor: selected ? T.accent : T.border,
                    backgroundColor: selected ? T.surfaceWarm : '#FFFFFF',
                    boxShadow: selected ? '0 0 0 3px rgba(147,122,98,0.12)' : 'none'
                  }}
                >
                  <div>
                    <div className="text-[14px] font-semibold" style={{ color: T.ink }}>
                      {g.label}
                    </div>
                    <div className="text-[12px] mt-0.5" style={{ color: T.muted }}>
                      {g.desc}
                    </div>
                  </div>
                  <span
                    className="w-5 h-5 rounded-md flex items-center justify-center shrink-0 transition-colors"
                    style={{
                      backgroundColor: selected ? T.accent : '#FFFFFF',
                      border: `1px solid ${selected ? T.accent : T.borderStrong}`
                    }}
                  >
                    {selected && <Check className="w-3.5 h-3.5 text-white" />}
                  </span>
                </button>
              );
            })}
          </div>
        )}
        </div>

        {/* Navigation — pinned to the bottom, same position on every step */}
        <div className="shrink-0 flex items-center justify-between pt-4 border-t" style={{ borderColor: T.border }}>
          {step > 1 ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setStep(s => s - 1)}
              icon={<ChevronLeft className="w-3.5 h-3.5" />}
            >
              Back
            </Button>
          ) : (
            <span />
          )}

          {step < 3 ? (
            <Button
              variant="primary"
              size="sm"
              disabled={!canContinue}
              onClick={() => setStep(s => s + 1)}
              iconRight={<ArrowRight className="w-3.5 h-3.5" />}
            >
              Continue
            </Button>
          ) : (
            <Button
              variant="primary"
              size="sm"
              disabled={!canContinue || isSaving}
              isLoading={isSaving}
              onClick={handleFinish}
              iconRight={<ArrowRight className="w-3.5 h-3.5" />}
            >
              Enter workspace
            </Button>
          )}
        </div>
      </div>
    </AuthLayout>
  );
};