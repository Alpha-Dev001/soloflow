/**
 * Centralized SoloFlow plan & feature definitions.
 *
 * All features are fully free with unlimited usage.
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

/** Feature keys — all enabled for everyone. */
export enum Feature {
  CLIENT_LIMIT = 'CLIENT_LIMIT',
  PROJECT_LIMIT = 'PROJECT_LIMIT',
  INVOICE_LIMIT = 'INVOICE_LIMIT',
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
  limits: {
    activeClients: number;
    activeProjects: number;
    invoicesPerMonth: number;
  };
  features: {
    [Feature.ADVANCED_ANALYTICS]: boolean;
    [Feature.FULL_CALENDAR]: boolean;
  };
  benefits: string[];
}

export const PLAN_DEFINITIONS: Record<PlanId, PlanDefinition> = {
  free: {
    id: 'free',
    label: 'STARTER',
    displayName: 'Full Access',
    priceMonthly: 0,
    currency: 'USD',
    limits: {
      activeClients: UNLIMITED,
      activeProjects: UNLIMITED,
      invoicesPerMonth: UNLIMITED,
    },
    features: {
      [Feature.ADVANCED_ANALYTICS]: true,
      [Feature.FULL_CALENDAR]: true,
    },
    benefits: [
      'Unlimited clients & active projects',
      'Unlimited invoicing & payment tracking',
      'Financial analytics & win-rate metrics',
      'Unified deadline & payment calendar',
    ],
  },
  pro: {
    id: 'pro',
    label: 'PRO',
    displayName: 'Full Access',
    priceMonthly: 0,
    currency: 'USD',
    limits: {
      activeClients: UNLIMITED,
      activeProjects: UNLIMITED,
      invoicesPerMonth: UNLIMITED,
    },
    features: {
      [Feature.ADVANCED_ANALYTICS]: true,
      [Feature.FULL_CALENDAR]: true,
    },
    benefits: [
      'Unlimited clients & active projects',
      'Unlimited invoicing & payment tracking',
      'Financial analytics & win-rate metrics',
      'Unified deadline & payment calendar',
    ],
  },
};

/** No features require Pro — everything is free. */
export const PRO_ONLY_FEATURES: Feature[] = [];

export function toPlanLabel(plan: string | undefined | null): PlanLabel {
  return plan === 'pro' ? 'PRO' : 'STARTER';
}

export function toPlanId(plan: string | undefined | null): PlanId {
  return plan === 'pro' ? 'pro' : 'free';
}

export function getPlanDefinition(plan: string | undefined | null): PlanDefinition {
  return PLAN_DEFINITIONS[toPlanId(plan)];
}
