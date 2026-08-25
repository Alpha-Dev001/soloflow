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
    AI_ASSISTANT: boolean;
    ADVANCED_ANALYTICS: boolean;
    FULL_CALENDAR: boolean;
    AI_PROPOSAL: boolean;
  };
  limits: {
    activeClients: number;
    activeProjects: number;
    invoicesPerMonth: number;
    aiProposalsPerDay: number;
  };
  benefits: string[];
  isPro: boolean;
  canUpgrade: boolean;
}

export interface PlanUsageBucket {
  used: number;
  limit: number;
  unlimited: boolean;
}

export interface SubscriptionInfo {
  user: User;
  subscription: {
    id: string;
    plan: string;
    status: string;
    startedAt?: string;
    expiresAt?: string;
    provider?: string;
  } | null;
  entitlements: Entitlements;
  usage: {
    activeClients: PlanUsageBucket;
    activeProjects: PlanUsageBucket;
    invoicesThisMonth: PlanUsageBucket;
    aiProposalsToday: AiUsage;
  };
  plans: {
    starter: PlanDefinition;
    pro: PlanDefinition;
  };
}

export interface PlanDefinition {
  id: string;
  label: string;
  displayName: string;
  priceMonthly: number;
  currency: string;
  limits: Entitlements['limits'];
  features: Entitlements['features'];
  benefits: string[];
}

export interface ApiErrorBody {
  message?: string;
  code?: string;
  upgradeRequired?: boolean;
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
  proposalId?: string;
  invoiceIds?: string[];
  createdAt: string;
  updatedAt: string;
}

export type ProposalStatus = 'Draft' | 'Sent' | 'Viewed' | 'Accepted' | 'Rejected' | 'Expired';

export interface Proposal {
  id: string;
  proposalNumber: string; // e.g. PROP-2024-008
  title: string;
  clientId: string;
  clientName: string;
  projectId?: string;
  projectName?: string;
  amount: number;
  status: ProposalStatus;
  tone: string;
  overview: string;
  scopeOfWork: string[];
  deliverables: string[];
  timeline: string;
  investment: string;
  terms?: string;
  contentHtml?: string;
  contentMarkdown?: string;
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
  type: 'invoice_paid' | 'invoice_overdue' | 'proposal_generated' | 'proposal_accepted' | 'project_status' | 'client_added' | string;
  title: string;
  subtitle: string;
  timeAgo: string;
  timestamp: string;
  iconType?: 'check' | 'proposal' | 'project' | 'invoice' | 'client' | string;
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
  proposalWinRate: number;
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

/** Daily AI usage / quota state returned by the backend. */
export interface AiUsage {
  plan: 'STARTER' | 'PRO';
  limit: number;
  used: number;
  remaining: number;
  resetAt?: string;
}
