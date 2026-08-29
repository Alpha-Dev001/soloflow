import React, { useCallback, useEffect, useState } from 'react';
import {
  Search,
  Users,
  Crown,
  UserMinus,
  Shield,
  RefreshCw,
  Ban,
  CheckCircle2,
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useToast } from '../components/ui/Toast';
import { api } from '../services/api';
import type { User } from '../types';

interface AdminPageProps {
  user: User | null;
}

export const AdminPage: React.FC<AdminPageProps> = ({ user }) => {
  const { showToast } = useToast();
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [planFilter, setPlanFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [s, u] = await Promise.all([
        api.getAdminStats(),
        api.getAdminUsers({
          search: search || undefined,
          plan: planFilter || undefined,
          status: statusFilter || undefined,
        }),
      ]);
      setStats(s);
      setUsers(u.users || []);
    } catch (e: any) {
      showToast(e?.message || 'Failed to load admin data', 'error');
    } finally {
      setLoading(false);
    }
  }, [search, planFilter, statusFilter, showToast]);

  useEffect(() => {
    void load();
  }, [load]);

  const grant = async (id: string) => {
    setBusyId(id);
    try {
      await api.adminGrantPro(id);
      showToast('Pro access granted', 'success');
      await load();
    } catch (e: any) {
      showToast(e?.message || 'Failed', 'error');
    } finally {
      setBusyId(null);
    }
  };

  const revoke = async (id: string) => {
    setBusyId(id);
    try {
      await api.adminRevokePro(id);
      showToast('Pro access revoked', 'success');
      await load();
    } catch (e: any) {
      showToast(e?.message || 'Failed', 'error');
    } finally {
      setBusyId(null);
    }
  };

  const setStatus = async (id: string, accountStatus: 'active' | 'suspended') => {
    setBusyId(id);
    try {
      await api.adminSetAccountStatus(id, accountStatus);
      showToast(
        accountStatus === 'suspended' ? 'Account suspended' : 'Account restored',
        'success',
      );
      await load();
    } catch (e: any) {
      showToast(e?.message || 'Failed', 'error');
    } finally {
      setBusyId(null);
    }
  };

  if (user?.role !== 'ADMIN') {
    return (
      <div className="max-w-lg mx-auto py-16 text-center">
        <Shield className="w-10 h-10 mx-auto text-[#B4552F]" />
        <h1 className="mt-4 text-xl font-semibold text-[#1A1918]">Access denied</h1>
        <p className="mt-2 text-sm text-[#8C8278]">
          This area is restricted to SoloFlow administrators.
        </p>
      </div>
    );
  }

  const totals = stats?.totals || {};

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-[#1A1918]">
            Admin
          </h1>
          <p className="text-xs text-[#8C8278] mt-0.5">
            Platform users, plans, and subscription activity
          </p>
        </div>
        <Button variant="ghost" onClick={() => void load()} disabled={loading}>
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total users', value: totals.users ?? '—', icon: Users },
          { label: 'Starter', value: totals.starterUsers ?? '—', icon: Users },
          { label: 'Pro', value: totals.proUsers ?? '—', icon: Crown },
          { label: 'Active Pro subs', value: totals.activeSubscriptions ?? '—', icon: CheckCircle2 },
        ].map((s) => (
          <Card key={s.label} padding="md">
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase tracking-wider text-[#8C8278]">
                {s.label}
              </span>
              <s.icon className="w-4 h-4 text-[#B39C82]" />
            </div>
            <div className="mt-2 text-2xl font-semibold text-[#1A1918]">{s.value}</div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
        <Card padding="md">
          <div className="text-[#8C8278] text-xs">Inactive / expired</div>
          <div className="font-semibold text-[#1A1918] mt-1">
            {totals.inactiveSubscriptions ?? 0}
          </div>
        </Card>
        <Card padding="md">
          <div className="text-[#8C8278] text-xs">Upgraded</div>
          <div className="font-semibold text-[#1A1918] mt-1">{totals.upgraded ?? 0}</div>
        </Card>
        <Card padding="md">
          <div className="text-[#8C8278] text-xs">Downgraded</div>
          <div className="font-semibold text-[#1A1918] mt-1">{totals.downgraded ?? 0}</div>
        </Card>
        <Card padding="md">
          <div className="text-[#8C8278] text-xs">Suspended</div>
          <div className="font-semibold text-[#1A1918] mt-1">{totals.suspendedUsers ?? 0}</div>
        </Card>
      </div>

      <Card padding="md" className="space-y-4">
        <div className="flex flex-wrap gap-2 items-center">
          <div className="relative flex-1 min-w-[180px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#8C8278]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name or email…"
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-[#EDE8E1] bg-white focus:outline-none focus:ring-2 focus:ring-[#82694E]/30"
            />
          </div>
          <select
            value={planFilter}
            onChange={(e) => setPlanFilter(e.target.value)}
            className="text-sm rounded-lg border border-[#EDE8E1] px-3 py-2 bg-white"
          >
            <option value="">All plans</option>
            <option value="free">Starter</option>
            <option value="pro">Pro</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-sm rounded-lg border border-[#EDE8E1] px-3 py-2 bg-white"
          >
            <option value="">All accounts</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="text-[11px] uppercase tracking-wider text-[#8C8278] border-b border-[#EDE8E1]">
                <th className="py-2 pr-3 font-medium">User</th>
                <th className="py-2 pr-3 font-medium">Role</th>
                <th className="py-2 pr-3 font-medium">Plan</th>
                <th className="py-2 pr-3 font-medium">Sub status</th>
                <th className="py-2 pr-3 font-medium">Joined</th>
                <th className="py-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-[#F2ECE5] last:border-0">
                  <td className="py-3 pr-3">
                    <div className="font-medium text-[#1A1918]">{u.name}</div>
                    <div className="text-xs text-[#8C8278]">{u.email}</div>
                    {u.accountStatus === 'suspended' && (
                      <span className="inline-block mt-1 text-[10px] uppercase tracking-wide text-[#B4552F] bg-[#FBF1EC] px-1.5 py-0.5 rounded">
                        Suspended
                      </span>
                    )}
                  </td>
                  <td className="py-3 pr-3 text-[#4A4037]">{u.role || 'USER'}</td>
                  <td className="py-3 pr-3">
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        u.plan === 'pro'
                          ? 'bg-[#1A1918] text-white'
                          : 'bg-[#F2ECE5] text-[#4A4037]'
                      }`}
                    >
                      {u.plan === 'pro' ? 'Pro' : 'Starter'}
                    </span>
                  </td>
                  <td className="py-3 pr-3 text-[#4A4037] capitalize">
                    {u.subscriptionStatus || '—'}
                  </td>
                  <td className="py-3 pr-3 text-xs text-[#8C8278]">
                    {u.createdAt
                      ? new Date(u.createdAt).toLocaleDateString()
                      : '—'}
                  </td>
                  <td className="py-3">
                    <div className="flex flex-wrap gap-1.5">
                      {u.plan !== 'pro' ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={busyId === u.id || u.role === 'ADMIN'}
                          onClick={() => void grant(u.id)}
                        >
                          <Crown className="w-3.5 h-3.5" /> Grant Pro
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={busyId === u.id}
                          onClick={() => void revoke(u.id)}
                        >
                          <UserMinus className="w-3.5 h-3.5" /> Revoke
                        </Button>
                      )}
                      {u.role !== 'ADMIN' &&
                        (u.accountStatus === 'suspended' ? (
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={busyId === u.id}
                            onClick={() => void setStatus(u.id, 'active')}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" /> Restore
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={busyId === u.id}
                            onClick={() => void setStatus(u.id, 'suspended')}
                          >
                            <Ban className="w-3.5 h-3.5" /> Suspend
                          </Button>
                        ))}
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && users.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-[#8C8278]">
                    No users found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {stats?.recentSubscriptionActivity?.length > 0 && (
        <Card padding="md">
          <h3 className="text-sm font-semibold text-[#1A1918] mb-3">
            Recent subscription activity
          </h3>
          <ul className="space-y-2">
            {stats.recentSubscriptionActivity.slice(0, 10).map((a: any) => (
              <li
                key={a.id}
                className="flex flex-wrap gap-2 text-xs text-[#4A4037] border-b border-[#F2ECE5] pb-2 last:border-0"
              >
                <span className="font-medium capitalize">{a.plan}</span>
                <span className="text-[#8C8278]">→ {a.status}</span>
                <span className="text-[#8C8278]">via {a.provider}</span>
                {a.previousPlan && (
                  <span className="text-[#8C8278]">
                    (was {a.previousPlan === 'pro' ? 'Pro' : 'Starter'})
                  </span>
                )}
                <span className="ml-auto text-[#8C8278]">
                  {a.createdAt ? new Date(a.createdAt).toLocaleString() : ''}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
};
