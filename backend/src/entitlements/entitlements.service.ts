import {
  Injectable,
  ForbiddenException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import {
  Feature,
  PlanDefinition,
  PlanId,
  PlanLabel,
  UNLIMITED,
  getPlanDefinition,
  toPlanLabel,
  PRO_ONLY_FEATURES,
} from './plan.constants';
import { UserDocument } from '../users/user.schema';

export interface EntitlementSnapshot {
  plan: PlanId;
  planLabel: PlanLabel;
  displayName: string;
  priceMonthly: number;
  subscriptionStatus: string;
  accountStatus: string;
  role: string;
  features: PlanDefinition['features'];
  limits: PlanDefinition['limits'];
  benefits: string[];
  isPro: boolean;
  canUpgrade: boolean;
}

@Injectable()
export class EntitlementsService {
  /**
   * Effective plan for a user.
   * Expired / canceled / suspended users fall back to Starter entitlements.
   */
  resolveEffectivePlan(user: UserDocument): PlanId {
    if (user.accountStatus === 'suspended') {
      return 'free';
    }
    if (user.plan !== 'pro') {
      return 'free';
    }
    const status = user.subscriptionStatus;
    if (status === 'expired' || status === 'canceled') {
      return 'free';
    }
    // active, pending, none (legacy pro without status), or undefined → Pro
    return 'pro';
  }

  getDefinition(user: UserDocument): PlanDefinition {
    return getPlanDefinition(this.resolveEffectivePlan(user));
  }

  snapshot(user: UserDocument): EntitlementSnapshot {
    const plan = this.resolveEffectivePlan(user);
    const def = getPlanDefinition(plan);
    return {
      plan,
      planLabel: def.label,
      displayName: def.displayName,
      priceMonthly: def.priceMonthly,
      subscriptionStatus: user.subscriptionStatus || 'none',
      accountStatus: user.accountStatus || 'active',
      role: user.role || 'USER',
      features: def.features,
      limits: def.limits,
      benefits: def.benefits,
      isPro: plan === 'pro',
      canUpgrade: plan !== 'pro' && (user.accountStatus || 'active') === 'active',
    };
  }

  /** Whether a boolean Pro feature is unlocked. */
  hasFeature(user: UserDocument, feature: Feature): boolean {
    if (user.accountStatus === 'suspended') return false;
    const def = this.getDefinition(user);
    if (feature === Feature.CLIENT_LIMIT ||
        feature === Feature.PROJECT_LIMIT ||
        feature === Feature.INVOICE_LIMIT) {
      return true; // limit features are always "available"; enforcement is via assertWithinLimit
    }
    return Boolean(def.features[feature as keyof typeof def.features]);
  }

  assertFeature(user: UserDocument, feature: Feature): void {
    if (user.accountStatus === 'suspended') {
      throw new ForbiddenException({
        message: 'Your account has been suspended. Contact support.',
        code: 'ACCOUNT_SUSPENDED',
      });
    }
    if (PRO_ONLY_FEATURES.includes(feature) && !this.hasFeature(user, feature)) {
      throw new ForbiddenException({
        message: 'This feature is available on Pro. Upgrade to unlock it.',
        code: 'PRO_REQUIRED',
        feature,
        upgradeRequired: true,
      });
    }
  }

  assertAccountActive(user: UserDocument): void {
    if (user.accountStatus === 'suspended') {
      throw new ForbiddenException({
        message: 'Your account has been suspended. Contact support.',
        code: 'ACCOUNT_SUSPENDED',
      });
    }
  }

  /**
   * Throw HTTP 402/403-style plan limit error when current usage >= limit.
   * `currentCount` should be the count BEFORE creating the new resource
   * (i.e. reject when currentCount >= limit).
   */
  assertWithinLimit(
    user: UserDocument,
    kind: 'activeClients' | 'activeProjects' | 'invoicesPerMonth',
    currentCount: number,
  ): void {
    this.assertAccountActive(user);
    const def = this.getDefinition(user);
    const limit = def.limits[kind];
    if (limit === UNLIMITED) return;
    if (currentCount >= limit) {
      const labels: Record<typeof kind, string> = {
        activeClients: 'active clients',
        activeProjects: 'active projects',
        invoicesPerMonth: 'invoices this month',
      };
      throw new HttpException(
        {
          message: `Starter plan allows up to ${limit} ${labels[kind]}. Upgrade to Pro for unlimited access.`,
          code: 'PLAN_LIMIT_REACHED',
          limit,
          used: currentCount,
          resource: kind,
          upgradeRequired: true,
          plan: toPlanLabel(def.id),
        },
        HttpStatus.FORBIDDEN,
      );
    }
  }
}
