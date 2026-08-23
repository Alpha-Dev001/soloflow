import React, { useState } from 'react';
import {
  User as UserIcon,
  Building,
  CreditCard,
  Sparkles,
  Shield,
  Save,
  RotateCcw,
  CheckCircle2,
  Lock
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { useToast } from '../components/ui/Toast';
import type { User } from '../types';

interface SettingsPageProps {
  user: User | null;
  onUpdateProfile: (data: Partial<User>) => Promise<void>;
  onResetDemo: () => Promise<void>;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  user,
  onUpdateProfile,
  onResetDemo
}) => {
  const { showToast } = useToast();
  const [activeSection, setActiveSection] = useState<'profile' | 'billing' | 'ai' | 'security'>('profile');

  // Form states
  const [name, setName] = useState(user?.name || '');
  const [businessName, setBusinessName] = useState(user?.businessName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [currency, setCurrency] = useState(user?.currency || 'USD');
  const [isSaving, setIsSaving] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onUpdateProfile({
        name,
        businessName,
        email,
        currency
      });
      showToast('Settings saved', 'success');
    } catch (err) {
      showToast('Failed to save settings', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-[#1A1918]">Settings</h1>
        <p className="text-xs text-[#8C8278] mt-0.5">
          Manage your business profile, invoicing details, and AI configurations.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
        {/* Navigation Sidebar */}
        <div className="md:col-span-3 space-y-1">
          {[
            { id: 'profile', label: 'Business Profile', icon: UserIcon },
            { id: 'billing', label: 'Invoicing & Payouts', icon: CreditCard },
            { id: 'ai', label: 'AI Assistant', icon: Sparkles },
            { id: 'security', label: 'System & Demo Data', icon: Shield }
          ].map(sec => {
            const Icon = sec.icon;
            return (
              <button
                key={sec.id}
                onClick={() => setActiveSection(sec.id as any)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-left transition-colors cursor-pointer ${activeSection === sec.id
                    ? 'bg-black/[0.06] text-[#1A1918]'
                    : 'text-[#8C8278] hover:bg-black/[0.03] hover:text-[#1A1918]'
                  }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{sec.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content Area */}
        <div className="md:col-span-9">
          {activeSection === 'profile' && (
            <Card padding="md" className="space-y-3.5">
              <h3 className="font-semibold text-xs text-[#1A1918] pb-2 border-b border-[#EDE8E1]">
                Business Profile
              </h3>

              <form onSubmit={handleSaveProfile} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-[#1A1918] mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-[#EDE8E1] rounded-lg focus:outline-none focus:border-[#0071E3] focus:ring-2 focus:ring-[#0071E3]/15"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-[#1A1918] mb-1">
                      Studio / Business Name
                    </label>
                    <input
                      type="text"
                      value={businessName}
                      onChange={e => setBusinessName(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-[#EDE8E1] rounded-lg focus:outline-none focus:border-[#0071E3] focus:ring-2 focus:ring-[#0071E3]/15"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-[#1A1918] mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-[#EDE8E1] rounded-lg focus:outline-none focus:border-[#0071E3] focus:ring-2 focus:ring-[#0071E3]/15"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-[#1A1918] mb-1">
                      Currency
                    </label>
                    <select
                      value={currency}
                      onChange={e => setCurrency(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-[#EDE8E1] rounded-lg focus:outline-none focus:border-[#0071E3]"
                    >
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="GBP">GBP (£)</option>
                      <option value="CAD">CAD ($)</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end pt-3 border-t border-[#EDE8E1]">
                  <Button type="submit" variant="primary" size="sm" isLoading={isSaving} icon={<Save className="w-3 h-3" />}>
                    Save Profile
                  </Button>
                </div>
              </form>
            </Card>
          )}

          {activeSection === 'billing' && (
            <Card padding="md" className="space-y-3">
              <h3 className="font-semibold text-xs text-[#1A1918] pb-2 border-b border-[#EDE8E1]">
                Invoicing & Banking Details
              </h3>
              <p className="text-[11px] text-[#8C8278]">
                Included on generated invoice PDFs for direct bank transfers.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-[11px] font-medium text-[#1A1918] mb-1">Bank Name</label>
                  <input
                    type="text"
                    defaultValue="Silicon Valley Bank"
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-[#EDE8E1] rounded-lg focus:outline-none focus:border-[#0071E3]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-[#1A1918] mb-1">Account Holder</label>
                  <input
                    type="text"
                    defaultValue="John Doe Design Studio"
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-[#EDE8E1] rounded-lg focus:outline-none focus:border-[#0071E3]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-[#1A1918] mb-1">Routing Number</label>
                  <input
                    type="text"
                    defaultValue="121000358"
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-[#EDE8E1] rounded-lg focus:outline-none focus:border-[#0071E3]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-[#1A1918] mb-1">Account Number</label>
                  <input
                    type="text"
                    defaultValue="•••• •••• 9941"
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-[#EDE8E1] rounded-lg focus:outline-none focus:border-[#0071E3]"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-3 border-t border-[#EDE8E1]">
                <Button
                  onClick={() => showToast('Banking details saved', 'success')}
                  variant="primary"
                  size="sm"
                  icon={<Save className="w-3 h-3" />}
                >
                  Save Banking
                </Button>
              </div>
            </Card>
          )}

          {activeSection === 'ai' && (
            <Card padding="md" className="space-y-3">
              <h3 className="font-semibold text-xs text-[#1A1918] pb-2 border-b border-[#EDE8E1]">
                AI Proposal Engine
              </h3>
              <p className="text-[11px] text-[#8C8278]">
                Configure the LLM generation preset used when drafting proposals.
              </p>

              <div className="space-y-3 pt-1">
                <div>
                  <label className="block text-[11px] font-medium text-[#1A1918] mb-1">Active AI Model</label>
                  <input
                    type="text"
                    disabled
                    value="Gemini 2.5 Flash"
                    className="w-full px-2.5 py-1.5 text-xs bg-[#F4F0EA] border border-[#EDE8E1] rounded-lg text-[#6E6E73]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-[#1A1918] mb-1">Default Pitch Tone</label>
                  <select className="w-full px-2.5 py-1.5 text-xs bg-white border border-[#EDE8E1] rounded-lg focus:outline-none focus:border-[#0071E3]">
                    <option>Professional & Clear</option>
                    <option>Friendly & Direct</option>
                    <option>Executive & Enterprise</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end pt-3 border-t border-[#EDE8E1]">
                <Button
                  onClick={() => showToast('AI settings saved', 'success')}
                  variant="primary"
                  size="sm"
                >
                  Save Config
                </Button>
              </div>
            </Card>
          )}

          {activeSection === 'security' && (
            <Card padding="md" className="space-y-3">
              <h3 className="font-semibold text-xs text-[#1A1918] pb-2 border-b border-[#EDE8E1]">
                System & Demonstration Reset
              </h3>

              <div className="p-3 rounded-lg bg-[#FF9500]/10 border border-[#FF9500]/20 text-[11px] text-[#C97100] space-y-0.5">
                <p className="font-medium">Reset Demo Workspace</p>
                <p>
                  Restore initial demo seeds (Acme Corp, Nexus Tech, active invoices, and proposals).
                </p>
              </div>

              <div className="flex justify-start pt-1">
                <Button
                  onClick={() => setConfirmReset(true)}
                  variant="secondary"
                  size="sm"
                  icon={<RotateCcw className="w-3 h-3" />}
                >
                  Reset Demo Seeds
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Reset Demo Confirmation */}
      <ConfirmDialog
        isOpen={confirmReset}
        onClose={() => setConfirmReset(false)}
        onConfirm={async () => {
          setConfirmReset(false);
          await onResetDemo();
          showToast('Database reset to demo seeds', 'success');
        }}
        tone="warning"
        title="Reset the workspace?"
        description="All current clients, projects, invoices and proposals will be replaced with the original demo seed data. Any changes you made will be lost."
        confirmLabel="Reset workspace"
        cancelLabel="Keep my data"
      />
    </div>
  );
};
