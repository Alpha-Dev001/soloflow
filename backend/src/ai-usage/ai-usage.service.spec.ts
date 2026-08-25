import 'reflect-metadata';
import { Types } from 'mongoose';
import { AiUsageService } from './ai-usage.service';
import { UserDocument } from '../users/user.schema';

/**
 * Minimal fake for a Mongoose `Model<AiUsageDocument>`.
 *
 * Counters are stored in-memory, keyed by `${userHex}:${date}`. Every operation
 * (`findOneAndUpdate`, `updateOne`) performs its read-modify-write *synchronously*
 * before resolving — which mirrors how MongoDB's atomic `$inc` serializes
 * concurrent updates, letting us assert concurrency safety.
 */
class FakeAiUsageModel {
  public store = new Map<string, number>();

  private key(filter: any): string {
    const u = filter.userId;
    const hex =
      u && typeof u === 'object' && typeof u.toHexString === 'function'
        ? u.toHexString()
        : String(u);
    return `${hex}:${filter.date}`;
  }

  findOne(filter: any) {
    const self = this;
    const chain = {
      select() {
        return chain;
      },
      lean() {
        return chain;
      },
      exec: async () => {
        const c = self.store.get(self.key(filter));
        return c === undefined ? null : { proposalGenerations: c };
      },
    };
    return chain;
  }

  findOneAndUpdate(filter: any, update: any) {
    const self = this;
    return {
      exec: async () => {
        const k = self.key(filter);
        const inc = update?.$inc?.proposalGenerations ?? 0;
        const next = (self.store.get(k) ?? 0) + inc;
        self.store.set(k, next);
        return { userId: filter.userId, date: filter.date, proposalGenerations: next };
      },
    };
  }

  updateOne(filter: any, update: any) {
    const self = this;
    return {
      exec: async () => {
        const k = self.key(filter);
        let inc = 0;
        if (Array.isArray(update)) {
          inc = -1;
        } else {
          inc = update?.$inc?.proposalGenerations ?? 0;
        }
        const v = self.store.get(k) ?? 0;
        self.store.set(k, Math.max(0, v + inc));
        return { n: 1 };
      },
    };
  }

  total(userIdHex: string, date: string): number {
    return this.store.get(`${userIdHex}:${date}`) ?? 0;
  }
}

function fakeConfig(overrides: Record<string, string | number> = {}) {
  const map: Record<string, any> = {
    STARTER_AI_PROPOSAL_LIMIT: 3,
    PRO_AI_PROPOSAL_LIMIT: 20,
    AI_USAGE_TIMEZONE: 'UTC',
    ...overrides,
  };
  return { get: (k: string, def?: any) => (map[k] !== undefined ? map[k] : def) };
}

function makeUser(plan: 'free' | 'pro'): UserDocument {
  const user: any = { _id: new Types.ObjectId(), plan };
  return user as UserDocument;
}

function todayKey(svc: AiUsageService): string {
  return svc.dateKey(new Date(), svc.getTimezone());
}

describe('AiUsageService', () => {
  let model: FakeAiUsageModel;
  let config: any;
  let svc: AiUsageService;

  beforeEach(() => {
    model = new FakeAiUsageModel();
    config = fakeConfig();
    svc = new AiUsageService(model as any, config as any);
  });

  describe('plan detection', () => {
    it('maps free -> STARTER and pro -> PRO', () => {
      expect(svc.derivePlan(makeUser('free'))).toBe('STARTER');
      expect(svc.derivePlan(makeUser('pro'))).toBe('PRO');
    });

    it('reads configurable limits from env with safe defaults', () => {
      expect(svc.getLimit('STARTER')).toBe(3);
      expect(svc.getLimit('PRO')).toBe(20);
      const custom = new AiUsageService(
        model as any,
        fakeConfig({ STARTER_AI_PROPOSAL_LIMIT: 5, PRO_AI_PROPOSAL_LIMIT: 99 }) as any,
      );
      expect(custom.getLimit('STARTER')).toBe(5);
      expect(custom.getLimit('PRO')).toBe(99);
      // invalid values fall back to defaults
      const bad = new AiUsageService(
        model as any,
        fakeConfig({ STARTER_AI_PROPOSAL_LIMIT: -1, PRO_AI_PROPOSAL_LIMIT: 'abc' }) as any,
      );
      expect(bad.getLimit('STARTER')).toBe(3);
      expect(bad.getLimit('PRO')).toBe(20);
    });
  });

  // 1. Starter with 0 usage -> allowed
  it('allows a Starter user with 0 usage', async () => {
    const user = makeUser('free');
    const r = await svc.reserveProposalGeneration(user);
    expect(r.allowed).toBe(true);
    expect(r.usage.limit).toBe(3);
    expect(r.usage.used).toBe(1);
    expect(model.total(String(user._id), todayKey(svc))).toBe(1);
  });

  // 2. Starter with 2 usage -> allowed (3rd allowed)
  it('allows a Starter user with 2 usage to take the 3rd slot', async () => {
    const user = makeUser('free');
    model.store.set(`${user._id.toHexString()}:${todayKey(svc)}`, 2);
    const r = await svc.reserveProposalGeneration(user);
    expect(r.allowed).toBe(true);
    expect(r.usage.used).toBe(3);
    expect(r.usage.remaining).toBe(0);
  });

  // 3. Starter with 3 usage -> rejected
  it('rejects a Starter user at the 3-usage limit', async () => {
    const user = makeUser('free');
    model.store.set(`${user._id.toHexString()}:${todayKey(svc)}`, 3);
    const r = await svc.reserveProposalGeneration(user);
    expect(r.allowed).toBe(false);
    expect(r.usage.used).toBe(3);
    expect(r.usage.remaining).toBe(0);
    expect(model.total(String(user._id), todayKey(svc))).toBe(3);
  });

  // 4. Pro user with 19 usage -> allowed
  it('allows a Pro user with 19 usage to take the 20th slot', async () => {
    const user = makeUser('pro');
    model.store.set(`${user._id.toHexString()}:${todayKey(svc)}`, 19);
    const r = await svc.reserveProposalGeneration(user);
    expect(r.allowed).toBe(true);
    expect(r.usage.limit).toBe(20);
    expect(r.usage.used).toBe(20);
  });

  // 5. Pro user with 20 usage -> rejected
  it('rejects a Pro user at the 20-usage limit', async () => {
    const user = makeUser('pro');
    model.store.set(`${user._id.toHexString()}:${todayKey(svc)}`, 20);
    const r = await svc.reserveProposalGeneration(user);
    expect(r.allowed).toBe(false);
    expect(r.usage.used).toBe(20);
    expect(model.total(String(user._id), todayKey(svc))).toBe(20);
  });

  // 9. User A cannot access User B's usage
  it('isolates usage between different users', async () => {
    const a = makeUser('free');
    const b = makeUser('free');
    model.store.set(`${String(a._id)}:${todayKey(svc)}`, 3);
    const ra = await svc.reserveProposalGeneration(a);
    expect(ra.allowed).toBe(false);
    const rb = await svc.reserveProposalGeneration(b);
    expect(rb.allowed).toBe(true);
    expect(rb.usage.used).toBe(1);
  });

  // 10. New day -> fresh quota (no cron)
  it('grants a fresh quota on a new day without a cron job', async () => {
    const user = makeUser('free');
    const today = todayKey(svc);
    const yesterdayKey = svc.dateKey(new Date(Date.now() - 48 * 3_600_000));
        expect(yesterdayKey).not.toBe(today);
    model.store.set(`${String(user._id)}:${yesterdayKey}`, 3);

    const r = await svc.reserveProposalGeneration(user);
    expect(r.allowed).toBe(true);
    expect(r.usage.used).toBe(1);
    // yesterday's record untouched
    expect(model.store.get(`${String(user._id)}:${yesterdayKey}`)).toBe(3);
    // today's record now holds exactly one generation (fresh, not 3)
    expect(model.total(String(user._id), today)).toBe(1);
  });

  // 11. Concurrent requests cannot bypass the quota
  it('does not allow concurrent requests to bypass the quota', async () => {
    const user = makeUser('free');
    const requests = Array.from({ length: 4 }, () =>
      svc.reserveProposalGeneration(user),
    );
    const results = await Promise.all(requests);
    const allowed = results.filter((r) => r.allowed).length;
    const denied = results.filter((r) => !r.allowed).length;
    expect(allowed).toBe(3);
    expect(denied).toBe(1);
    expect(model.total(String(user._id), todayKey(svc))).toBe(3);
  });

  it('computes a UTC resetAt by default', () => {
    const reset = svc.nextResetAt(new Date('2026-08-25T10:00:00.000Z'));
    expect(reset).toBe('2026-08-26T00:00:00.000Z');
  });
});
