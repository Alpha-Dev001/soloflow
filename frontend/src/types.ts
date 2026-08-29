 export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  businessName?: string;
  company?: string;
  currency: string;
  plan?: 'free' | 'pro';
  role?: 'USER' | 'ADMIN';
  subscriptionStatus?: 'none' | 'active' | 'canceled' | 'expired' | 'pending';
  accountStatus?: 'active' | 'suspended';
  entitlements?: Entitlements;
}

export interface Entitlements {
  plan: 'free' | 'pro';
  planLabel: 'STARTER' | 'PRO';
  displayName: string;
  priceMonthly: number;
  subscriptionStatus: string;
  accountStatus: string;
  role: string;
  features: {
    ADVANCED_ANALYTICS: boolean;
    FULL_CALENDAR: boolean;
  };
  limits: {
    activeClients: number;
    activeProjects: number;
    invoicesPerMonth: number;
  };
  benefits: string[];
  isPro: boolean;
  canUpgrade: boolean;
}

export interface ApiErrorBody {
  message?: string;
  code?: string;
  feature?: string;
  limit?: number;
  used?: number;
  resource?: string;
}

export interface Client {
  id: string;
  name: string;
  company: string;
  email: string;
  phone?: string;
  website?: string;
  address?: string;
  status: 'Active' | 'Lead' | 'Inactive';
  totalSpent: number;
  projectsCount: number;
  invoiceCount?: number;
  notes?: string;
  tier?: 'Enterprise' | 'Startup' | 'SMB';
  country?: string;
  createdAt: string;
  updatedAt: string;
}

export type ProjectStatus = 'To Do' | 'In Progress' | 'Completed' | 'On Hold' | 'Cancelled';
export type ProjectPriority = 'Low' | 'Medium' | 'High' | 'Urgent';

export interface Project {
  id: string;
  title: string;
  clientId: string;
  clientName: string;
  clientAvatar?: string;
  description: string;
  budget: number;
  priority: ProjectPriority;
  status: ProjectStatus;
  startDate?: string;
  deadline: string;
  tags?: string[];
  tasks?: { id: string; title: string; completed: boolean }[];
  invoiceIds?: string[];
  createdAt: string;
  updatedAt: string;
}

export type InvoiceStatus = 'Paid' | 'Pending' | 'Overdue' | 'Sent' | 'Draft';

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string; // e.g. INV-2024-015
  clientId: string;
  clientName: string;
  projectId?: string;
  projectName?: string;
  issueDate: string;
  dueDate: string;
  status: InvoiceStatus;
  items: InvoiceItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  currency: string;
  notes?: string;
  paidAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ActivityItem {
  id: string;
  type: 'invoice_paid' | 'invoice_overdue' | 'project_status' | 'client_added' | string;
  title: string;
  subtitle: string;
  timeAgo: string;
  timestamp: string;
  iconType?: 'check' | 'project' | 'invoice' | 'client' | string;
  clientId?: string;
}

export interface UpcomingItem {
  id: string;
  type: 'Project deadline' | 'Invoice due' | 'Client meeting' | string;
  title: string;
  subtitle: string;
  dateStr?: string;
  dayNumber: string;
  monthShort: string;
  fullDate?: string;
}

export interface TopClientSummary {
  id: string;
  name: string;
  avatarChar?: string;
  avatarBgColor?: string;
  totalSpent: number;
  projectsCount: number;
}

export interface DashboardMetrics {
  totalRevenue: number;
  revenueGrowthPercent: number;
  activeProjects: number;
  activeProjectsGrowth: number;
  pendingPayments: number;
  pendingPaymentsGrowthPercent: number;
  completedProjects: number;
  completedProjectsGrowth: number;
  revenueOverview: {
    period: string;
    total: number;
    growthPercent: number;
    timeline: { month: string; amount: number; target?: number }[];
  };
  recentActivities: ActivityItem[];
  upcoming: UpcomingItem[];
  topClients: TopClientSummary[];
  projectStatusBreakdown: {
    active: number;
    onHold: number;
    completed: number;
    cancelled: number;
  };
}

export interface AnalyticsData {
  totalRevenue: number;
  avgProjectValue: number;
  collectionRate: number;
  monthlyRevenue: {
    month: string;
    amount: number;
  }[];
  topClientsRevenue: {
    name: string;
    total: number;
  }[];
}

export interface AnalyticsMetrics {
  totalRevenue?: number;
  revenue?: number;
  revenueGrowth?: number;
  avgProjectValue?: number;
  avgProjectValueGrowth?: number;
  proposalWinRate?: number;
  collectionRate?: number;
  collectionRateGrowth?: number;
  totalProjects?: number;
  totalProjectsGrowth?: number;
  monthlyRevenue?: {
    month: string;
    amount: number;
  }[];
  topClientsRevenue?: {
    name: string;
    total: number;
  }[];
  revenueOverTime?: {
    month: string;
    amount: number;
    target?: number;
  }[];
  revenueByClient?: {
    clientId?: string;
    name: string;
    amount: number;
    percentage: number;
    color?: string;
  }[];
}

export interface CalendarEvent {
  id: string;
  title: string;
  clientName: string;
  date: string;
  type: 'deadline' | 'meeting' | 'milestone' | 'invoice_due' | string;
  description?: string;
  completed?: boolean;
}


