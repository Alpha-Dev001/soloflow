import React, { useState } from 'react';
import {
  User as UserIcon,
  Globe,
  Save,
  Crown,
  CheckCircle2,
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
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
}) => {
  const { showToast } = useToast();
  const [activeSection, setActiveSection] = useState<'profile' | 'account'>('profile');

  // Profile form
  const [name, setName] = useState(user?.name || '');
  const [businessName, setBusinessName] = useState(user?.businessName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [currency, setCurrency] = useState(user?.currency || 'USD');
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onUpdateProfile({ name, businessName, email, currency });
      showToast('Profile saved successfully', 'success');
    } catch {
      showToast('Failed to save profile', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const sections = [
    { id: 'profile' as const, label: 'Profile', icon: UserIcon },
    { id: 'account' as const, label: 'Account', icon: Crown },
  ];

  const inputClass = 'w-full px-2.5 py-1.5 text-xs bg-white border border-[#EDE8E1] rounded-lg focus:outline-none focus:border-[#82694E] focus:ring-2 focus:ring-[#82694E]/15 transition-all';

  return (
    <div className="space-y-4 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-[#1A1918]">Settings</h1>
        <p className="text-xs text-[#8C8278] mt-0.5">
          Manage your profile, account, and workspace settings.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
        {/* Navigation Sidebar */}
        <div className="md:col-span-3 space-y-1">
          {sections.map(sec => {
            const Icon = sec.icon;
            return (
              <button
                key={sec.id}
                onClick={() => setActiveSection(sec.id)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-left transition-colors cursor-pointer ${
                  activeSection === sec.id
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
          {/* ── Profile Section ── */}
          {activeSection === 'profile' && (
            <Card padding="md" className="space-y-3.5">
              <div className="flex items-center gap-2 pb-2 border-b border-[#EDE8E1]">
                <UserIcon className="w-4 h-4" style={{ color: '#82694E' }} />
                <h3 className="font-semibold text-xs text-[#1A1918]">Profile</h3>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-[#1A1918] mb-1">Full Name</label>
                    <input
                      type="text"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-[#1A1918] mb-1">Business Name</label>
                    <input
                      type="text"
                      value={businessName}
                      onChange={e => setBusinessName(e.target.value)}
                      placeholder="Optional"
                      className={inputClass}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-[#1A1918] mb-1">Email</label>
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-[#1A1918] mb-1">Currency</label>
                    <select
                      value={currency}
                      onChange={e => setCurrency(e.target.value)}
                      className={inputClass}
                    >
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="GBP">GBP (£)</option>
                      <option value="RWF">RWF (RWF)</option>
                      <option value="KES">KES (KSh)</option>
                      <option value="NGN">NGN (₦)</option>
                      <option value="CAD">CAD ($)</option>
                      <option value="AUD">AUD ($)</option>
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

          {/* ── Account Section ── */}
          {activeSection === 'account' && (
            <Card padding="md" className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-[#EDE8E1]">
                <Crown className="w-4 h-4" style={{ color: '#82694E' }} />
                <h3 className="font-semibold text-xs text-[#1A1918]">Account</h3>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-[#1A1918]">Full Access</span>
                <span className="text-[10px] font-bold uppercase tracking-wide bg-[#1A1918] text-white px-2 py-0.5 rounded">
                  Free
                </span>
              </div>
              <p className="text-xs text-[#6B6158]">
                All features are unlocked — unlimited clients, projects, invoices, analytics, calendar, and more.
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                {[
                  { label: 'Clients', value: 'Unlimited' },
                  { label: 'Projects', value: 'Unlimited' },
                  { label: 'Invoices', value: 'Unlimited' },
                  { label: 'Analytics', value: 'Unlimited' },
                  { label: 'Calendar', value: 'Unlimited' },
                  { label: 'Storage', value: 'Unlimited' },
                ].map(item => (
                  <div key={item.label} className="flex items-center gap-2 p-2 rounded-lg bg-[#F8F7F5]">
                    <CheckCircle2 className="w-3 h-3 text-[#82694E] shrink-0" />
                    <div>
                      <div className="text-[10px] text-[#8C8278]">{item.label}</div>
                      <div className="text-[11px] font-semibold text-[#1A1918]">{item.value}</div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

        </div>
      </div>
    </div>
  );
};
