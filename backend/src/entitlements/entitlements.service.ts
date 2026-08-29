import { Injectable, ForbiddenException } from '@nestjs/common';
import {
  Feature,
  PlanDefinition,
  PlanId,
  PlanLabel,
  UNLIMITED,
  getPlanDefinition,
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
  /** Always returns 'free' — all features are available to everyone. */
  resolveEffectivePlan(_user: UserDocument): PlanId {
    return 'free';
  }

  getDefinition(_user: UserDocument): PlanDefinition {
    return getPlanDefinition('free');
  }

  snapshot(user: UserDocument): EntitlementSnapshot {
    const def = getPlanDefinition('free');
    return {
      plan: 'free',
      planLabel: def.label,
      displayName: def.displayName,
      priceMonthly: 0,
      subscriptionStatus: user.subscriptionStatus || 'active',
      accountStatus: user.accountStatus || 'active',
      role: user.role || 'USER',
      features: def.features,
      limits: def.limits,
      benefits: def.benefits,
      isPro: true,
      canUpgrade: false,
    };
  }

  /** All features are always unlocked. */
  hasFeature(_user: UserDocument, _feature: Feature): boolean {
    return true;
  }

  assertFeature(user: UserDocument, _feature: Feature): void {
    this.assertAccountActive(user);
  }

  assertAccountActive(user: UserDocument): void {
    if (user.accountStatus === 'suspended') {
      throw new ForbiddenException({
        message: 'Your account has been suspended. Contact support.',
        code: 'ACCOUNT_SUSPENDED',
      });
    }
  }

  /** All limits are unlimited — never throws. */
  assertWithinLimit(
    _user: UserDocument,
    _kind: 'activeClients' | 'activeProjects' | 'invoicesPerMonth',
    _currentCount: number,
  ): void {
    // No limits enforced — everything is free
  }
}
