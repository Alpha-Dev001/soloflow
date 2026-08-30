import type {
  User,
  Client,
  Project,
  Invoice,
  DashboardMetrics,
  AnalyticsData,
  CalendarEvent
} from '../types';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

/**
 * Safely parse a response as JSON.
 * Returns null when the response is not JSON (e.g. HTML 404 page from
 * a hosting provider) instead of throwing a cryptic parse error.
 */
async function safeJson(res: Response): Promise<any> {
  const ct = res.headers.get('content-type') || '';
  if (!ct.includes('application/json')) {
    // Non-JSON response — likely an HTML error page from the host
    const text = await res.text().catch(() => '');
    throw new Error(
      res.ok
        ? 'The server returned an unexpected response. Please try again later.'
        : `Server error (${res.status}). ${text.slice(0, 120)}`,
    );
  }
  return res.json();
}

/** Convert empty-string values to undefined so optional DTO validators pass */
function sanitizePayload<T extends Record<string, any>>(obj: T): T {
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(obj)) {
    out[k] = v === '' ? undefined : v;
  }
  return out as T;
}

/** Read the JWT from localStorage — set after login/register */
function getAuthHeader(): Record<string, string> {
  try {
    const token = localStorage.getItem('soloflow_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch {
    return {};
  }
}

/**
 * Centralised fetch wrapper.
 * - Automatically attaches Authorization header.
 * - On 401: clears auth state and redirects to login (except for auth routes).
 */
async function apiFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...getAuthHeader(),
    ...(options.headers as Record<string, string> || {}),
  };

  const res = await fetch(url, { ...options, headers });

  if (res.status === 401 && !url.includes('/auth/login') && !url.includes('/auth/register')) {
    // Token expired or invalid — clear session and redirect
    try {
      localStorage.removeItem('soloflow_user');
      localStorage.removeItem('soloflow_token');
    } catch {
      // ignore
    }
    window.location.href = '/login';
    throw new Error('Session expired. Please log in again.');
  }

  return res;
}

export const api = {
  // ── Auth ────────────────────────────────────────────────────────────────────

  async getMe(): Promise<{ user: User }> {
    const res = await apiFetch(`${API_BASE}/auth/me`);
    if (!res.ok) throw new Error('Failed to fetch user');
    return safeJson(res);
  },

  async login(email: string, password: string): Promise<{ user: User; token: string }> {
    const res = await apiFetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    if (!res.ok) {
      const err = await safeJson(res).catch(() => ({}));
      throw new Error((err as any).message || 'Login failed');
    }
    return safeJson(res);
  },

  async register(name: string, email: string, password: string, company?: string): Promise<{ user: User; token: string }> {
    const res = await apiFetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      body: JSON.stringify({ name, email, password, company }),
    });
    if (!res.ok) {
      const err = await safeJson(res).catch(() => ({}));
      throw new Error((err as any).message || 'Registration failed');
    }
    return safeJson(res);
  },

  async updateProfile(profile: Partial<User>): Promise<{ user: User }> {
    const res = await apiFetch(`${API_BASE}/auth/profile`, {
      method: 'PUT',
      body: JSON.stringify(profile)
    });
    if (!res.ok) throw new Error('Failed to update profile');
    return res.json();
  },

  // ── Clients ─────────────────────────────────────────────────────────────────

  async getClients(search?: string): Promise<{ clients: Client[]; total: number }> {
    const url = search ? `${API_BASE}/clients?search=${encodeURIComponent(search)}` : `${API_BASE}/clients`;
    const res = await apiFetch(url);
    if (!res.ok) throw new Error('Failed to fetch clients');
    return res.json();
  },

  async getClientById(id: string): Promise<{ client: Client; projects: Project[]; invoices: Invoice[]; activities: import('../types').ActivityItem[] }> {
    const res = await apiFetch(`${API_BASE}/clients/${id}`);
    if (!res.ok) throw new Error('Client not found');
    return res.json();
  },

  async getClientProjects(clientId: string): Promise<{ projects: Project[]; total: number }> {
    const res = await apiFetch(`${API_BASE}/clients/${clientId}/projects`);
    if (!res.ok) throw new Error('Failed to fetch client projects');
    return res.json();
  },

  async getClientInvoices(clientId: string): Promise<{ invoices: Invoice[]; total: number }> {
    const res = await apiFetch(`${API_BASE}/clients/${clientId}/invoices`);
    if (!res.ok) throw new Error('Failed to fetch client invoices');
    return res.json();
  },

  async createClient(client: Partial<Client>): Promise<{ client: Client }> {
    const res = await apiFetch(`${API_BASE}/clients`, {
      method: 'POST',
      body: JSON.stringify(sanitizePayload(client as Record<string, any>))
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      const e = new Error((err as any).message || 'Failed to create client') as Error & {
        code?: string;

      };
      e.code = (err as any).code;

      throw e;
    }
    return res.json();
  },

  async updateClient(id: string, client: Partial<Client>): Promise<{ client: Client }> {
    const res = await apiFetch(`${API_BASE}/clients/${id}`, {
      method: 'PUT',
      body: JSON.stringify(sanitizePayload(client as Record<string, any>))
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error((err as any).message || 'Failed to update client');
    }
    return res.json();
  },

  async deleteClient(id: string): Promise<{ success: boolean }> {
    const res = await apiFetch(`${API_BASE}/clients/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete client');
    return res.json();
  },

  // ── Projects ─────────────────────────────────────────────────────────────────

  async getProjects(search?: string, clientId?: string): Promise<{ projects: Project[]; total: number }> {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (clientId) params.append('clientId', clientId);
    const res = await apiFetch(`${API_BASE}/projects?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch projects');
    return res.json();
  },

  async getProjectById(id: string): Promise<{ project: Project; client?: Client; invoices: Invoice[] }> {
    const res = await apiFetch(`${API_BASE}/projects/${id}`);
    if (!res.ok) throw new Error('Project not found');
    return res.json();
  },

  async createProject(project: Partial<Project>): Promise<{ project: Project }> {
    const res = await apiFetch(`${API_BASE}/projects`, {
      method: 'POST',
      body: JSON.stringify(project)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      const e = new Error((err as any).message || 'Failed to create project') as Error & {
        code?: string;

      };
      e.code = (err as any).code;

      throw e;
    }
    return res.json();
  },

  /** Create a project inside a specific client via the client-scoped endpoint */
  async createClientProject(clientId: string, project: Partial<Project>): Promise<{ project: Project }> {
    const res = await apiFetch(`${API_BASE}/clients/${encodeURIComponent(clientId)}/projects`, {
      method: 'POST',
      body: JSON.stringify(project)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      const e = new Error((err as any).message || 'Failed to create project') as Error & {
        code?: string;

      };
      e.code = (err as any).code;

      throw e;
    }
    return res.json();
  },

  async updateProject(id: string, project: Partial<Project>): Promise<{ project: Project }> {
    const res = await apiFetch(`${API_BASE}/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(project)
    });
    if (!res.ok) throw new Error('Failed to update project');
    return res.json();
  },

  async updateProjectStatus(id: string, status: string): Promise<{ project: Project }> {
    const res = await apiFetch(`${API_BASE}/projects/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    });
    if (!res.ok) throw new Error('Failed to update project status');
    return res.json();
  },

  async deleteProject(id: string): Promise<{ success: boolean }> {
    const res = await apiFetch(`${API_BASE}/projects/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete project');
    return res.json();
  },

  // ── Invoices ─────────────────────────────────────────────────────────────────

  async getInvoices(search?: string, clientId?: string): Promise<{ invoices: Invoice[]; total: number }> {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (clientId) params.append('clientId', clientId);
    const res = await apiFetch(`${API_BASE}/invoices?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch invoices');
    return res.json();
  },

  async getInvoiceById(id: string): Promise<{ invoice: Invoice; client?: Client }> {
    const res = await apiFetch(`${API_BASE}/invoices/${id}`);
    if (!res.ok) throw new Error('Invoice not found');
    return res.json();
  },

  async createInvoice(invoice: Partial<Invoice>): Promise<{ invoice: Invoice }> {
    const res = await apiFetch(`${API_BASE}/invoices`, {
      method: 'POST',
      body: JSON.stringify(invoice)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      const e = new Error((err as any).message || 'Failed to create invoice') as Error & {
        code?: string;

      };
      e.code = (err as any).code;

      throw e;
    }
    return res.json();
  },

  /** Create an invoice inside a specific client via the client-scoped endpoint */
  async createClientInvoice(clientId: string, invoice: Partial<Invoice>): Promise<{ invoice: Invoice }> {
    const res = await apiFetch(`${API_BASE}/clients/${encodeURIComponent(clientId)}/invoices`, {
      method: 'POST',
      body: JSON.stringify(invoice)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      const e = new Error((err as any).message || 'Failed to create invoice') as Error & {
        code?: string;

      };
      e.code = (err as any).code;

      throw e;
    }
    return res.json();
  },

  async updateInvoice(id: string, invoice: Partial<Invoice>): Promise<{ invoice: Invoice }> {
    const res = await apiFetch(`${API_BASE}/invoices/${id}`, {
      method: 'PUT',
      body: JSON.stringify(invoice)
    });
    if (!res.ok) throw new Error('Failed to update invoice');
    return res.json();
  },

  async updateInvoiceStatus(id: string, status: string): Promise<{ invoice: Invoice }> {
    const res = await apiFetch(`${API_BASE}/invoices/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    });
    if (!res.ok) throw new Error('Failed to update invoice status');
    return res.json();
  },

  async deleteInvoice(id: string): Promise<{ success: boolean }> {
    const res = await apiFetch(`${API_BASE}/invoices/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete invoice');
    return res.json();
  },

  // ── Dashboard & Analytics ───────────────────────────────────────────────────

  async getDashboard(): Promise<{ metrics: DashboardMetrics }> {
    const res = await apiFetch(`${API_BASE}/dashboard`);
    if (!res.ok) throw new Error('Failed to fetch dashboard data');
    const data = await res.json();
    return { metrics: data.metrics || data };
  },

  async getAnalytics(): Promise<{ analytics: AnalyticsData; locked?: boolean }> {
    const res = await apiFetch(`${API_BASE}/analytics`);
    if (res.status === 403) {
      const err = await res.json().catch(() => ({}));
      return {
        analytics: {
          totalRevenue: 0,
          avgProjectValue: 0,
          collectionRate: 0,
          monthlyRevenue: [],
          topClientsRevenue: [],
        },
        locked: true,
        ...(err as any),
      } as any;
    }
    if (!res.ok) throw new Error('Failed to fetch analytics data');
    const data = await res.json();
    const raw = data.analytics || data;
    return {
      analytics: {
        totalRevenue: raw.totalRevenue ?? 0,
        avgProjectValue: raw.avgProjectValue ?? 0,
        collectionRate: raw.collectionRate ?? 0,
        monthlyRevenue: raw.monthlyRevenue ?? [],
        topClientsRevenue: raw.topClientsRevenue ?? []
      }
    };
  },

  // ── Calendar ─────────────────────────────────────────────────────────────────

  async getCalendar(): Promise<{ events: CalendarEvent[] }> {
    const res = await apiFetch(`${API_BASE}/calendar`);
    if (!res.ok) throw new Error('Failed to fetch calendar');
    return res.json();
  },

  async createCalendarEvent(event: Partial<CalendarEvent>): Promise<{ event: CalendarEvent }> {
    const res = await apiFetch(`${API_BASE}/calendar`, {
      method: 'POST',
      body: JSON.stringify(event)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error((err as any).message || 'Failed to create calendar event');
    }
    return res.json();
  },

  async updateCalendarEvent(id: string, data: Partial<CalendarEvent>): Promise<{ event: CalendarEvent }> {
    const res = await apiFetch(`${API_BASE}/calendar/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to update calendar event');
    return res.json();
  },

  async deleteCalendarEvent(id: string): Promise<{ success: boolean }> {
    const res = await apiFetch(`${API_BASE}/calendar/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error((err as any).message || 'Failed to delete calendar event');
    }
    return res.json();
  },

  // ── Admin ───────────────────────────────────────────────────────────────────

  async getAdminStats(): Promise<any> {
    const res = await apiFetch(`${API_BASE}/admin/stats`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error((err as any).message || 'Admin access denied');
    }
    return res.json();
  },

  async getAdminUsers(params: {
    search?: string;
    plan?: string;
    status?: string;
    page?: number;
  } = {}): Promise<any> {
    const q = new URLSearchParams();
    if (params.search) q.set('search', params.search);
    if (params.plan) q.set('plan', params.plan);
    if (params.status) q.set('status', params.status);
    if (params.page) q.set('page', String(params.page));
    const res = await apiFetch(`${API_BASE}/admin/users?${q.toString()}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error((err as any).message || 'Admin access denied');
    }
    return res.json();
  },

  async adminGrantPro(userId: string, note?: string): Promise<any> {
    const res = await apiFetch(`${API_BASE}/admin/users/${userId}/grant-pro`, {
      method: 'POST',
      body: JSON.stringify({ note }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error((err as any).message || 'Failed to grant Pro');
    }
    return res.json();
  },

  async adminRevokePro(userId: string, note?: string): Promise<any> {
    const res = await apiFetch(`${API_BASE}/admin/users/${userId}/revoke-pro`, {
      method: 'POST',
      body: JSON.stringify({ note }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error((err as any).message || 'Failed to revoke Pro');
    }
    return res.json();
  },

  async adminSetAccountStatus(
    userId: string,
    accountStatus: 'active' | 'suspended',
    note?: string,
  ): Promise<any> {
    const res = await apiFetch(`${API_BASE}/admin/users/${userId}/account-status`, {
      method: 'PATCH',
      body: JSON.stringify({ accountStatus, note }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error((err as any).message || 'Failed to update account');
    }
    return res.json();
  },

  // ── Demo / Dev only ─────────────────────────────────────────────────────────

  async resetDemo(): Promise<void> {
    const res = await apiFetch(`${API_BASE}/seed/reset`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to reset seed data');
  }
};
