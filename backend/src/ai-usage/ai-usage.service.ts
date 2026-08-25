import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AiUsage, AiUsageDocument } from './ai-usage.schema';
import { UserDocument } from '../users/user.schema';

export type PlanType = 'STARTER' | 'PRO';

export interface AiUsageInfo {
  plan: PlanType;
  limit: number;
  used: number;
  remaining: number;
  resetAt: string | null;
}

export interface ReservationResult {
  allowed: boolean;
  usage: AiUsageInfo;
}

const DEFAULT_STARTER_LIMIT = 3;
const DEFAULT_PRO_LIMIT = 20;
const DEFAULT_TIMEZONE = 'UTC';

@Injectable()
export class AiUsageService {
  private readonly logger = new Logger(AiUsageService.name);

  constructor(
    @InjectModel(AiUsage.name) private readonly model: Model<AiUsageDocument>,
    private readonly configService: ConfigService,
  ) {}

  /** Map the stored DB `plan` field (free|pro) to a billing tier. */
  derivePlan(user: UserDocument): PlanType {
    return user?.plan === 'pro' ? 'PRO' : 'STARTER';
  }

  /** Configurable daily generation limit for a plan (env, with safe defaults). */
  getLimit(plan: PlanType): number {
    const configured =
      plan === 'PRO'
        ? this.configService.get<number>(
            'PRO_AI_PROPOSAL_LIMIT',
            DEFAULT_PRO_LIMIT,
          )
        : this.configService.get<number>(
            'STARTER_AI_PROPOSAL_LIMIT',
            DEFAULT_STARTER_LIMIT,
          );
    const num = Number(configured);
    return Number.isInteger(num) && num > 0
      ? num
      : plan === 'PRO'
        ? DEFAULT_PRO_LIMIT
        : DEFAULT_STARTER_LIMIT;
  }

    /** Configured timezone for daily boundaries (defaults to UTC). */
  getTimezone(): string {
    return this.configService.get<string>('AI_USAGE_TIMEZONE', DEFAULT_TIMEZONE);
  }

  /** 'YYYY-MM-DD' for `at` in the configured timezone (single source of truth). */
  dateKey(at: Date = new Date(), timeZone: string = this.getTimezone()): string {
    const fmt = new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    return fmt.format(at);
  }

  /** Instant (UTC ISO) of the next midnight in `timeZone` after `at`. */
  nextResetAt(
    at: Date = new Date(),
    timeZone: string = this.getTimezone(),
  ): string {
    const todayKey = this.dateKey(at, timeZone);
    const getKey = (t: number) => this.dateKey(new Date(t), timeZone);

    const hourMs = 3_600_000;
    const base = at.getTime();
    const nextHour = base + hourMs - (base % hourMs);
    let hi = nextHour + 26 * hourMs; // enough to cross any local midnight

    let lo = nextHour;
    let ans = hi;
    while (lo <= hi) {
      const mid = Math.floor((lo + hi) / 2);
      if (getKey(mid) !== todayKey) {
        ans = mid;
        hi = mid - 1;
      } else {
        lo = mid + 1;
      }
    }
    return new Date(ans).toISOString();
  }

  private toInfo(
    plan: PlanType,
    limit: number,
    used: number,
    resetAt: string,
  ): AiUsageInfo {
    return {
      plan,
      limit,
      used,
      remaining: Math.max(0, limit - used),
      resetAt,
    };
  }

  /** Current usage info for the authenticated user. */
  async getUsage(user: UserDocument): Promise<AiUsageInfo> {
    const plan = this.derivePlan(user);
    const limit = this.getLimit(plan);
    const used = await this.getUsedCount(String(user._id));
    return this.toInfo(plan, limit, used, this.nextResetAt());
  }

  private async getUsedCount(userId: string): Promise<number> {
    const doc = await this.model
      .findOne({ userId: new Types.ObjectId(userId), date: this.dateKey() })
      .select('proposalGenerations')
      .lean()
      .exec();
    return doc?.proposalGenerations ?? 0;
  }

  /**
   * Atomically reserve a generation slot. This is the concurrency-safe gate:
   * `$inc` runs as a single atomic operation on the unique (userId, date)
   * document, so simultaneous requests receive strictly increasing counts and
   * the configured limit can never be silently exceeded.
   *
   * Returns `allowed: false` once the limit is reached — the caller MUST NOT
   * call Gemini in that case. On a failed generation the caller calls
   * {@link releaseProposalGeneration} to return the slot (quota not consumed).
   */
  async reserveProposalGeneration(user: UserDocument): Promise<ReservationResult> {
    const plan = this.derivePlan(user);
    const limit = this.getLimit(plan);
    const userId = new Types.ObjectId(String(user._id));
    const date = this.dateKey();

    const doc = await this.model
      .findOneAndUpdate(
        { userId, date },
        { $inc: { proposalGenerations: 1 } },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      )
      .exec();

    const used = doc?.proposalGenerations ?? 1;

    if (used > limit) {
      // Rollback the reservation before reporting the denial.
      await this.model
        .updateOne({ userId, date }, { $inc: { proposalGenerations: -1 } })
        .exec();
      const before = Math.max(0, used - 1);
      return {
        allowed: false,
        usage: this.toInfo(plan, limit, before, this.nextResetAt()),
      };
    }

    return {
      allowed: true,
      usage: this.toInfo(plan, limit, used, this.nextResetAt()),
    };
  }

  /**
   * Release a previously reserved slot (e.g. the AI call failed or produced an
   * invalid result). Net effect: the generation does NOT consume quota.
   */
  async releaseProposalGeneration(user: UserDocument): Promise<void> {
    await this.model
      .updateOne(
        { userId: new Types.ObjectId(String(user._id)), date: this.dateKey() },
        [
          {
            $set: {
              proposalGenerations: {
                $max: [0, { $subtract: ['$proposalGenerations', 1] }],
              },
            },
          },
        ],
      )
      .exec();
  }
}