import type {
  User,
  Client,
  Project,
  Proposal,
  Invoice,
  DashboardMetrics,
  AnalyticsData,
  CalendarEvent
} from '../types';

const API_BASE = '/api';

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
    return res.json();
  },

  async login(email: string, password: string): Promise<{ user: User; token: string }> {
    const res = await apiFetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error((err as any).message || 'Login failed');
    }
    return res.json();
  },

  async register(name: string, email: string, password: string, company?: string): Promise<{ user: User; token: string }> {
    const res = await apiFetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      body: JSON.stringify({ name, email, password, company })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error((err as any).message || 'Registration failed');
    }
    return res.json();
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

  async getClientById(id: string): Promise<{ client: Client; projects: Project[]; proposals: Proposal[]; invoices: Invoice[] }> {
    const res = await apiFetch(`${API_BASE}/clients/${id}`);
    if (!res.ok) throw new Error('Client not found');
    return res.json();
  },

  async createClient(client: Partial<Client>): Promise<{ client: Client }> {
    const res = await apiFetch(`${API_BASE}/clients`, {
      method: 'POST',
      body: JSON.stringify(client)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error((err as any).message || 'Failed to create client');
    }
    return res.json();
  },

  async updateClient(id: string, client: Partial<Client>): Promise<{ client: Client }> {
    const res = await apiFetch(`${API_BASE}/clients/${id}`, {
      method: 'PUT',
      body: JSON.stringify(client)
    });
    if (!res.ok) throw new Error('Failed to update client');
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

  async getProjectById(id: string): Promise<{ project: Project; client?: Client; proposals: Proposal[]; invoices: Invoice[] }> {
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
      throw new Error((err as any).message || 'Failed to create project');
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

  // ── Proposals ─────────────────────────────────────────────────────────────────

  async getProposals(search?: string, clientId?: string): Promise<{ proposals: Proposal[]; total: number }> {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (clientId) params.append('clientId', clientId);
    const res = await apiFetch(`${API_BASE}/proposals?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch proposals');
    return res.json();
  },

  async getProposalById(id: string): Promise<{ proposal: Proposal; client?: Client }> {
    const res = await apiFetch(`${API_BASE}/proposals/${id}`);
    if (!res.ok) throw new Error('Proposal not found');
    return res.json();
  },

  async generateProposalAI(payload: {
    clientName: string;
    projectName?: string;
    projectTitle: string;
    description: string;
    budget?: string | number;
    tone?: string;
  }): Promise<{ proposal: any }> {
    const res = await apiFetch(`${API_BASE}/proposals/generate`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Failed to generate proposal with AI');
    return res.json();
  },

  async createProposal(proposal: Partial<Proposal>): Promise<{ proposal: Proposal }> {
    const res = await apiFetch(`${API_BASE}/proposals`, {
      method: 'POST',
      body: JSON.stringify(proposal)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error((err as any).message || 'Failed to save proposal');
    }
    return res.json();
  },

  async updateProposal(id: string, proposal: Partial<Proposal>): Promise<{ proposal: Proposal }> {
    const res = await apiFetch(`${API_BASE}/proposals/${id}`, {
      method: 'PUT',
      body: JSON.stringify(proposal)
    });
    if (!res.ok) throw new Error('Failed to update proposal');
    return res.json();
  },

  async updateProposalStatus(id: string, status: string): Promise<{ proposal: Proposal }> {
    const res = await apiFetch(`${API_BASE}/proposals/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    });
    if (!res.ok) throw new Error('Failed to update proposal status');
    return res.json();
  },

  async deleteProposal(id: string): Promise<{ success: boolean }> {
    const res = await apiFetch(`${API_BASE}/proposals/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete proposal');
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
      throw new Error((err as any).message || 'Failed to create invoice');
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

  async getAnalytics(): Promise<{ analytics: AnalyticsData }> {
    const res = await apiFetch(`${API_BASE}/analytics`);
    if (!res.ok) throw new Error('Failed to fetch analytics data');
    const data = await res.json();
    // Backend returns { analytics: { ... } } — unwrap it
    const raw = data.analytics || data;
    return {
      analytics: {
        totalRevenue: raw.totalRevenue ?? 0,
        avgProjectValue: raw.avgProjectValue ?? 0,
        proposalWinRate: raw.proposalWinRate ?? 0,
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

  // ── AI Chat ─────────────────────────────────────────────────────────────────

  async askAI(prompt: string, context?: any): Promise<{ reply: string }> {
    const res = await apiFetch(`${API_BASE}/ai/chat`, {
      method: 'POST',
      body: JSON.stringify({ message: prompt, context })
    });
    if (!res.ok) throw new Error('Failed to send message to AI');
    return res.json();
  },

  // ── Demo / Dev only ─────────────────────────────────────────────────────────

  async resetDemo(): Promise<void> {
    const res = await apiFetch(`${API_BASE}/seed/reset`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to reset seed data');
  }
};
