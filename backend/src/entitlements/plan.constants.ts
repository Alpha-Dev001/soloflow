/**
 * Centralized SoloFlow plan & feature definitions.
 * Single source of truth — do not scatter plan checks elsewhere.
 *
 * Limits match the public pricing page (Landing #pricing / FAQ):
 *   Starter: 2 active clients, 1 active project, 3 invoices/month
 *   Pro:     unlimited resources, Pro-only features unlocked
 *
 * AI daily proposal quotas remain configurable via env
 * (STARTER_AI_PROPOSAL_LIMIT / PRO_AI_PROPOSAL_LIMIT); defaults 3 / 20.
 */

/** Stored on User.plan — keep 'free'|'pro' for DB compatibility with existing data. */
export type PlanId = 'free' | 'pro';

/** Public / API-facing plan labels. */
export type PlanLabel = 'STARTER' | 'PRO';

export type UserRole = 'USER' | 'ADMIN';

export type SubscriptionStatus =
  | 'none'
  | 'active'
  | 'canceled'
  | 'expired'
  | 'pending';

export type AccountStatus = 'active' | 'suspended';

/** Feature keys used by FeatureGuard / EntitlementsService. */
export enum Feature {
  CLIENT_LIMIT = 'CLIENT_LIMIT',
  PROJECT_LIMIT = 'PROJECT_LIMIT',
  INVOICE_LIMIT = 'INVOICE_LIMIT',
  AI_PROPOSAL = 'AI_PROPOSAL',
  AI_ASSISTANT = 'AI_ASSISTANT',
  ADVANCED_ANALYTICS = 'ADVANCED_ANALYTICS',
  FULL_CALENDAR = 'FULL_CALENDAR',
}

export const UNLIMITED = -1;

export interface PlanDefinition {
  id: PlanId;
  label: PlanLabel;
  displayName: string;
  priceMonthly: number;
  currency: string;
  /** null / UNLIMITED (-1) = unlimited */
  limits: {
    activeClients: number;
    activeProjects: number;
    invoicesPerMonth: number;
    aiProposalsPerDay: number;
  };
  features: {
    [Feature.AI_ASSISTANT]: boolean;
    [Feature.ADVANCED_ANALYTICS]: boolean;
    [Feature.FULL_CALENDAR]: boolean;
    [Feature.AI_PROPOSAL]: boolean;
  };
  benefits: string[];
}

export const PLAN_DEFINITIONS: Record<PlanId, PlanDefinition> = {
  free: {
    id: 'free',
    label: 'STARTER',
    displayName: 'Starter',
    priceMonthly: 0,
    currency: 'USD',
    limits: {
      activeClients: 2,
      activeProjects: 1,
      invoicesPerMonth: 3,
      aiProposalsPerDay: 3,
    },
    features: {
      [Feature.AI_ASSISTANT]: false,
      [Feature.ADVANCED_ANALYTICS]: false,
      [Feature.FULL_CALENDAR]: false,
      [Feature.AI_PROPOSAL]: true, // limited daily quota
    },
    benefits: [
      'Up to 2 active clients',
      '1 active project board',
      '3 invoices per month',
      'Manual proposal editor',
      '3 AI proposal generations per day',
    ],
  },
  pro: {
    id: 'pro',
    label: 'PRO',
    displayName: 'Pro',
    priceMonthly: 19,
    currency: 'USD',
    limits: {
      activeClients: UNLIMITED,
      activeProjects: UNLIMITED,
      invoicesPerMonth: UNLIMITED,
      aiProposalsPerDay: 20,
    },
    features: {
      [Feature.AI_ASSISTANT]: true,
      [Feature.ADVANCED_ANALYTICS]: true,
      [Feature.FULL_CALENDAR]: true,
      [Feature.AI_PROPOSAL]: true,
    },
    benefits: [
      'Unlimited clients & active projects',
      'Unlimited invoicing & payment tracking',
      '20 AI proposal generations per day',
      'AI Business Assistant',
      'Financial analytics & win-rate metrics',
      'Unified deadline & payment calendar',
      'Custom branding & PDF exports',
    ],
  },
};

/** Boolean features that require Pro (used by FeatureGuard). */
export const PRO_ONLY_FEATURES: Feature[] = [
  Feature.AI_ASSISTANT,
  Feature.ADVANCED_ANALYTICS,
  Feature.FULL_CALENDAR,
];

export function toPlanLabel(plan: string | undefined | null): PlanLabel {
  return plan === 'pro' ? 'PRO' : 'STARTER';
}

export function toPlanId(plan: string | undefined | null): PlanId {
  return plan === 'pro' ? 'pro' : 'free';
}

export function getPlanDefinition(plan: string | undefined | null): PlanDefinition {
  return PLAN_DEFINITIONS[toPlanId(plan)];
}
