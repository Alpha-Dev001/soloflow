import React, { useState } from 'react';
import { Check, Loader2, CreditCard, AlertCircle } from 'lucide-react';
import { Modal } from './Modal';
import { Button } from './Button';
import { api } from '../../services/api';
import type { User } from '../../types';

interface UpgradeCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgraded: (user: User) => void;
}

const BENEFITS = [
  'Unlimited clients & active projects',
  'Unlimited invoicing & payment tracking',
  '20 AI proposal generations per day',
  'AI Business Assistant',
  'Financial analytics & win-rate metrics',
  'Unified deadline & payment calendar',
];

/**
 * Simulated Pro checkout — no real card data collected.
 * Uses MockPaymentProvider via /subscriptions/checkout + /confirm.
 */
export const UpgradeCheckoutModal: React.FC<UpgradeCheckoutModalProps> = ({
  isOpen,
  onClose,
  onUpgraded,
}) => {
  const [step, setStep] = useState<'offer' | 'pay' | 'done'>('offer');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [simulateFail, setSimulateFail] = useState(false);

  const reset = () => {
    setStep('offer');
    setLoading(false);
    setError(null);
    setSessionId(null);
    setSimulateFail(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const startCheckout = async () => {
    setLoading(true);
    setError(null);
    try {
      const session = await api.createCheckout(simulateFail ? 'failure' : 'success');
      setSessionId(session.sessionId);
      setStep('pay');
    } catch (e: any) {
      setError(e?.message || 'Could not start checkout');
    } finally {
      setLoading(false);
    }
  };

  const completePayment = async () => {
    if (!sessionId) return;
    setLoading(true);
    setError(null);
    try {
      const result = await api.confirmCheckout(
        sessionId,
        simulateFail ? 'failure' : 'success',
      );
      onUpgraded(result.user);
      setStep('done');
    } catch (e: any) {
      setError(e?.message || 'Payment failed. You remain on Starter.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={step === 'done' ? 'You are on Pro' : 'Upgrade to SoloFlow Pro'}
      subtitle={
        step === 'done'
          ? 'Pro features are now unlocked'
          : 'Simulated checkout — no real payment is charged'
      }
      maxWidth="md"
    >
      {step === 'offer' && (
        <div className="space-y-5">
          <div className="rounded-xl border border-[#EDE8E1] bg-[#FBF9F6] p-5">
            <div className="flex items-baseline justify-between gap-3">
              <div>
                <div className="text-[11px] font-bold uppercase tracking-widest text-[#82694E]">
                  Pro
                </div>
                <div className="mt-1 text-3xl font-semibold tracking-tight text-[#1A1918]">
                  $19
                  <span className="text-sm font-medium text-[#8C8278]">/mo</span>
                </div>
              </div>
              <CreditCard className="w-8 h-8 text-[#B39C82]" />
            </div>
            <ul className="mt-4 space-y-2">
              {BENEFITS.map((b) => (
                <li key={b} className="flex items-start gap-2 text-sm text-[#4A4037]">
                  <Check className="w-4 h-4 mt-0.5 text-[#1E7D3F] shrink-0" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          </div>

          <label className="flex items-center gap-2 text-xs text-[#8C8278] cursor-pointer">
            <input
              type="checkbox"
              checked={simulateFail}
              onChange={(e) => setSimulateFail(e.target.checked)}
              className="rounded border-[#E0D9CF]"
            />
            Simulate payment failure (for testing)
          </label>

          {error && (
            <div className="flex items-start gap-2 text-sm text-[#B4552F] bg-[#FBF1EC] rounded-lg px-3 py-2">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex gap-2 justify-end">
            <Button variant="ghost" onClick={handleClose} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={startCheckout} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Starting…
                </>
              ) : (
                'Continue to checkout'
              )}
            </Button>
          </div>
        </div>
      )}

      {step === 'pay' && (
        <div className="space-y-5">
          <div className="rounded-xl border border-[#EDE8E1] p-5 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-[#8C8278]">Plan</span>
              <span className="font-medium text-[#1A1918]">SoloFlow Pro</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[#8C8278]">Amount</span>
              <span className="font-medium text-[#1A1918]">$19.00 / month</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[#8C8278]">Payment</span>
              <span className="font-medium text-[#1A1918]">Simulated</span>
            </div>
            <p className="text-xs text-[#8C8278] pt-2 border-t border-[#F2ECE5]">
              No card details are collected. This is a development payment simulation.
            </p>
          </div>

          {error && (
            <div className="flex items-start gap-2 text-sm text-[#B4552F] bg-[#FBF1EC] rounded-lg px-3 py-2">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex gap-2 justify-end">
            <Button variant="ghost" onClick={handleClose} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={completePayment} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Processing…
                </>
              ) : (
                'Complete Payment'
              )}
            </Button>
          </div>
        </div>
      )}

      {step === 'done' && (
        <div className="space-y-5 text-center py-2">
          <div className="mx-auto w-12 h-12 rounded-full bg-[#E8F5EE] flex items-center justify-center">
            <Check className="w-6 h-6 text-[#1E7D3F]" />
          </div>
          <p className="text-sm text-[#4A4037]">
            Your subscription is active. Analytics, AI Assistant, and unlimited
            resources are now available.
          </p>
          <Button onClick={handleClose} className="w-full">
            Back to workspace
          </Button>
        </div>
      )}
    </Modal>
  );
};
