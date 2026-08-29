import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { UsersService } from '../users/users.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import {
  Subscription,
  SubscriptionDocument,
} from '../subscriptions/subscription.schema';
import { EntitlementsService } from '../entitlements/entitlements.service';

@Injectable()
export class AdminService {
  constructor(
    private readonly usersService: UsersService,
    private readonly subscriptionsService: SubscriptionsService,
    private readonly entitlements: EntitlementsService,
    @InjectModel(Subscription.name)
    private readonly subscriptionModel: Model<SubscriptionDocument>,
  ) {}

  private sanitizeUser(user: any) {
    const json = user.toJSON ? user.toJSON() : { ...user };
    delete json.passwordHash;
    delete json.bankDetails;
    return json;
  }

  async getStats() {
    const [
      totalUsers,
      starterUsers,
      proUsers,
      activeSubscriptions,
      inactiveSubscriptions,
      suspendedUsers,
      recentRegistrations,
      upgradedCount,
      downgradedCount,
    ] = await Promise.all([
      this.usersService.count({ role: 'USER' }),
      this.usersService.count({ role: 'USER', plan: 'free' }),
      this.usersService.count({ role: 'USER', plan: 'pro' }),
      this.usersService.count({
        role: 'USER',
        plan: 'pro',
        subscriptionStatus: 'active',
      }),
      this.usersService.count({
        role: 'USER',
        subscriptionStatus: { $in: ['canceled', 'expired', 'none'] },
      }),
      this.usersService.count({ accountStatus: 'suspended' }),
      this.usersService.findMany(
        { role: 'USER' },
        { limit: 10, sort: { createdAt: -1 } },
      ),
      this.subscriptionModel.countDocuments({
        plan: 'pro',
        previousPlan: 'free',
        provider: { $ne: 'system' },
      }),
      this.subscriptionModel.countDocuments({
        plan: 'free',
        previousPlan: 'pro',
      }),
    ]);

    const recentActivity = await this.subscriptionModel
      .find({ provider: { $ne: 'system' } })
      .sort({ createdAt: -1 })
      .limit(15)
      .lean()
      .exec();

    return {
      totals: {
        users: totalUsers,
        starterUsers,
        proUsers,
        activeSubscriptions,
        inactiveSubscriptions,
        suspendedUsers,
        upgraded: upgradedCount,
        downgraded: downgradedCount,
      },
      recentRegistrations: recentRegistrations.map((u) => this.sanitizeUser(u)),
      recentSubscriptionActivity: recentActivity.map((s: any) => ({
        id: String(s._id),
        userId: String(s.userId),
        plan: s.plan,
        status: s.status,
        provider: s.provider,
        previousPlan: s.previousPlan,
        startedAt: s.startedAt,
        createdAt: s.createdAt,
      })),
    };
  }

  async listUsers(opts: {
    search?: string;
    plan?: string;
    status?: string;
    role?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, opts.page || 1);
    const limit = Math.min(100, Math.max(1, opts.limit || 25));
    const filter: any = {};

    if (opts.plan === 'free' || opts.plan === 'pro') filter.plan = opts.plan;
    if (opts.status === 'active' || opts.status === 'suspended') {
      filter.accountStatus = opts.status;
    }
    if (opts.role === 'USER' || opts.role === 'ADMIN') filter.role = opts.role;
    if (opts.search && opts.search.trim()) {
      const q = opts.search.trim();
      filter.$or = [
        { name: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
        { businessName: { $regex: q, $options: 'i' } },
      ];
    }

    const [users, total] = await Promise.all([
      this.usersService.findMany(filter, {
        skip: (page - 1) * limit,
        limit,
        sort: { createdAt: -1 },
      }),
      this.usersService.count(filter),
    ]);

    return {
      users: users.map((u) => ({
        ...this.sanitizeUser(u),
        entitlements: this.entitlements.snapshot(u),
      })),
      total,
      page,
      limit,
      pages: Math.ceil(total / limit) || 1,
    };
  }

  async getUser(userId: string) {
    if (!Types.ObjectId.isValid(userId)) {
      throw new NotFoundException('User not found');
    }
    const user = await this.usersService.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    const subscription =
      await this.subscriptionsService.findCurrentForUser(userId);
    const history = await this.subscriptionModel
      .find({ userId: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .limit(20)
      .exec();

    return {
      user: this.sanitizeUser(user),
      entitlements: this.entitlements.snapshot(user),
      subscription: subscription ? subscription.toJSON() : null,
      subscriptionHistory: history.map((s) => s.toJSON()),
    };
  }

  async grantPro(adminId: string, userId: string, note?: string) {
    const user = await this.usersService.findById(userId);
    if (!user) throw new NotFoundException('User not found');
    if (user.role === 'ADMIN' && String(user._id) === adminId) {
      // Allow admins to grant themselves for testing
    }

    const { subscription, user: updated } =
      await this.subscriptionsService.activatePro(userId, {
        provider: 'admin',
        providerReference: `admin_grant_${adminId}`,
        previousPlan: user.plan || 'free',
        metadata: { grantedBy: adminId, note },
      });

    return {
      user: this.sanitizeUser(updated),
      subscription: subscription.toJSON(),
      message: 'Pro access granted',
    };
  }

  async revokePro(adminId: string, userId: string, note?: string) {
    const user = await this.usersService.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    const { subscription, user: updated } =
      await this.subscriptionsService.activateStarter(userId, {
        provider: 'admin',
        reason: `admin_revoke_${adminId}`,
        metadata: { revokedBy: adminId, note },
      });

    return {
      user: this.sanitizeUser(updated),
      subscription: subscription.toJSON(),
      message: 'Pro access revoked — user is now on Starter',
    };
  }

  async setAccountStatus(
    adminId: string,
    userId: string,
    accountStatus: 'active' | 'suspended',
    note?: string,
  ) {
    const user = await this.usersService.findById(userId);
    if (!user) throw new NotFoundException('User not found');
    if (user.role === 'ADMIN') {
      throw new BadRequestException('Cannot suspend an admin account');
    }

    const updated = await this.usersService.update(userId, {
      accountStatus,
    } as any);

    return {
      user: this.sanitizeUser(updated),
      message:
        accountStatus === 'suspended'
          ? 'Account suspended'
          : 'Account restored',
      meta: { by: adminId, note },
    };
  }
}
