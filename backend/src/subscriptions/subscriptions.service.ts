import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Subscription,
  SubscriptionDocument,
} from './subscription.schema';
import { UsersService } from '../users/users.service';
import { PaymentService } from '../payments/payment.service';
import { PLAN_DEFINITIONS, UNLIMITED } from '../entitlements/plan.constants';
import { UserDocument } from '../users/user.schema';
import { Client } from '../clients/client.schema';
import { Project } from '../projects/project.schema';
import { Invoice } from '../invoices/invoice.schema';
import { EntitlementsService } from '../entitlements/entitlements.service';

const PRO_PERIOD_DAYS = 30;
const ACTIVE_PROJECT_STATUSES = ['To Do', 'In Progress', 'On Hold'];

@Injectable()
export class SubscriptionsService {
  constructor(
    @InjectModel(Subscription.name)
    private readonly subscriptionModel: Model<SubscriptionDocument>,
    @InjectModel(Client.name) private readonly clientModel: Model<any>,
    @InjectModel(Project.name) private readonly projectModel: Model<any>,
    @InjectModel(Invoice.name) private readonly invoiceModel: Model<any>,
    private readonly usersService: UsersService,
    private readonly paymentService: PaymentService,
    private readonly entitlements: EntitlementsService,
  ) {}

  async findCurrentForUser(userId: string): Promise<SubscriptionDocument | null> {
    return this.subscriptionModel
      .findOne({ userId: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .exec();
  }

  async ensureStarterSubscription(userId: string): Promise<SubscriptionDocument> {
    const existing = await this.findCurrentForUser(userId);
    if (existing) return existing;

    const sub = new this.subscriptionModel({
      userId: new Types.ObjectId(userId),
      plan: 'free',
      status: 'active',
      startedAt: new Date(),
      provider: 'system',
      providerReference: 'starter_default',
    });
    return sub.save();
  }

  async activatePro(
    userId: string,
    opts: {
      provider: string;
      providerReference: string;
      previousPlan?: string;
      expiresAt?: Date;
      metadata?: Record<string, any>;
    },
  ): Promise<{ subscription: SubscriptionDocument; user: UserDocument }> {
    const user = await this.usersService.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    const startedAt = new Date();
    const expiresAt =
      opts.expiresAt ||
      new Date(startedAt.getTime() + PRO_PERIOD_DAYS * 24 * 60 * 60 * 1000);

    const previousPlan = opts.previousPlan || user.plan || 'free';

    await this.subscriptionModel.updateMany(
      {
        userId: new Types.ObjectId(userId),
        status: { $in: ['active', 'pending'] },
      },
      { $set: { status: 'canceled', canceledAt: new Date() } },
    );

    const subscription = await this.subscriptionModel.create({
      userId: new Types.ObjectId(userId),
      plan: 'pro',
      status: 'active',
      startedAt,
      expiresAt,
      provider: opts.provider,
      providerReference: opts.providerReference,
      previousPlan,
      metadata: opts.metadata || {},
    });

    const updatedUser = await this.usersService.update(userId, {
      plan: 'pro',
      subscriptionStatus: 'active',
    } as any);

    return { subscription, user: updatedUser };
  }

  async activateStarter(
    userId: string,
    opts: {
      provider: string;
      reason?: string;
      metadata?: Record<string, any>;
    },
  ): Promise<{ subscription: SubscriptionDocument; user: UserDocument }> {
    const user = await this.usersService.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    const previousPlan = user.plan || 'free';

    await this.subscriptionModel.updateMany(
      {
        userId: new Types.ObjectId(userId),
        status: { $in: ['active', 'pending'] },
      },
      { $set: { status: 'canceled', canceledAt: new Date() } },
    );

    const subscription = await this.subscriptionModel.create({
      userId: new Types.ObjectId(userId),
      plan: 'free',
      status: 'active',
      startedAt: new Date(),
      provider: opts.provider,
      providerReference: opts.reason || 'downgrade',
      previousPlan,
      metadata: opts.metadata || {},
    });

    const updatedUser = await this.usersService.update(userId, {
      plan: 'free',
      subscriptionStatus: 'active',
    } as any);

    return { subscription, user: updatedUser };
  }

  async expireIfNeeded(userId: string): Promise<UserDocument | null> {
    const user = await this.usersService.findById(userId);
    if (!user || user.plan !== 'pro') return user;

    const current = await this.findCurrentForUser(userId);
    if (
      current &&
      current.plan === 'pro' &&
      current.status === 'active' &&
      current.expiresAt &&
      current.expiresAt.getTime() < Date.now()
    ) {
      current.status = 'expired';
      await current.save();
      return this.usersService.update(userId, {
        plan: 'free',
        subscriptionStatus: 'expired',
      } as any);
    }
    return user;
  }

  async createUpgradeCheckout(
    user: UserDocument,
    simulate?: 'success' | 'failure',
  ) {
    if (user.accountStatus === 'suspended') {
      throw new ForbiddenException('Account suspended');
    }
    await this.expireIfNeeded(String(user._id));
    const fresh = await this.usersService.findById(String(user._id));
    if (fresh?.plan === 'pro' && fresh.subscriptionStatus === 'active') {
      throw new BadRequestException('You are already on the Pro plan');
    }

    const pro = PLAN_DEFINITIONS.pro;
    const session = await this.paymentService.createCheckoutSession({
      userId: String(user._id),
      email: user.email,
      plan: 'pro',
      amountCents: Math.round(pro.priceMonthly * 100),
      currency: pro.currency,
      simulate,
    });

    return {
      ...session,
      plan: 'pro',
      displayName: pro.displayName,
      priceMonthly: pro.priceMonthly,
      benefits: pro.benefits,
    };
  }

  async completeUpgrade(
    user: UserDocument,
    sessionId: string,
    simulate?: 'success' | 'failure',
  ) {
    if (user.accountStatus === 'suspended') {
      throw new ForbiddenException('Account suspended');
    }

    const result = await this.paymentService.confirmPayment({
      sessionId,
      userId: String(user._id),
      simulate,
    });

    if (result.status !== 'succeeded') {
      throw new BadRequestException({
        message: result.message || 'Payment failed',
        code: 'PAYMENT_FAILED',
        sessionId,
      });
    }

    const { subscription, user: updated } = await this.activatePro(
      String(user._id),
      {
        provider: result.provider,
        providerReference: result.providerReference,
        previousPlan: user.plan || 'free',
        metadata: { sessionId },
      },
    );

    return {
      success: true,
      subscription: subscription.toJSON(),
      user: {
        ...updated.toJSON(),
        entitlements: this.entitlements.snapshot(updated),
      },
      message: 'Welcome to SoloFlow Pro!',
    };
  }

  async getUsage(user: UserDocument) {
    const userId = String(user._id);
    const now = new Date();
    const monthStart = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1),
    );
    const monthEnd = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1),
    );

    const [activeClients, activeProjects, invoicesThisMonth] =
      await Promise.all([
        this.clientModel.countDocuments({
          userId: new Types.ObjectId(userId),
          status: { $in: ['Active', 'Lead'] },
        }),
        this.projectModel.countDocuments({
          userId: new Types.ObjectId(userId),
          status: { $in: ACTIVE_PROJECT_STATUSES },
        }),
        this.invoiceModel.countDocuments({
          userId: new Types.ObjectId(userId),
          createdAt: { $gte: monthStart, $lt: monthEnd },
        }),
      ]);

    const ent = this.entitlements.snapshot(user);
    const lim = ent.limits;

    return {
      activeClients: {
        used: activeClients,
        limit: lim.activeClients,
        unlimited: lim.activeClients === UNLIMITED,
      },
      activeProjects: {
        used: activeProjects,
        limit: lim.activeProjects,
        unlimited: lim.activeProjects === UNLIMITED,
      },
      invoicesThisMonth: {
        used: invoicesThisMonth,
        limit: lim.invoicesPerMonth,
        unlimited: lim.invoicesPerMonth === UNLIMITED,
      },
    };
  }

  async getSubscriptionInfo(userId: string) {
    await this.expireIfNeeded(userId);
    const user = await this.usersService.findById(userId);
    if (!user) throw new NotFoundException('User not found');
    const subscription = await this.findCurrentForUser(userId);
    const def =
      PLAN_DEFINITIONS[this.entitlements.resolveEffectivePlan(user)];
    const entitlements = this.entitlements.snapshot(user);
    const usage = await this.getUsage(user);
    return {
      user: {
        ...user.toJSON(),
        entitlements,
      },
      subscription: subscription ? subscription.toJSON() : null,
      plan: def,
      entitlements,
      usage,
    };
  }
}
