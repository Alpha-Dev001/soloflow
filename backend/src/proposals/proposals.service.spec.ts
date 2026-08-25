import { HttpException } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';
import { ProposalsService } from './proposals.service';
import { AiService } from '../ai/ai.service';
import { AiUsageService, ReservationResult } from '../ai-usage/ai-usage.service';
import { ActivitiesService } from '../activities/activities.service';

/** Minimal fake GenerateProposalDto for the tests. */
const validDto = {
  clientName: 'Acme',
  projectTitle: 'Website',
  description: 'A marketing site',
};

const starterUser = (overrides: Record<string, any> = {}) =>
  ({ _id: new Types.ObjectId(), plan: 'free', ...overrides } as any);

/** A reservation result that signals "allowed". */
function allowedUsage(used = 1): ReservationResult {
  return {
    allowed: true,
    usage: {
      plan: 'STARTER',
      limit: 3,
      used,
      remaining: 3 - used,
      resetAt: new Date('2026-08-26T00:00:00.000Z').toISOString(),
    },
  };
}

function exhaustedUsage(): ReservationResult {
  return {
    allowed: false,
    usage: {
      plan: 'STARTER',
      limit: 3,
      used: 3,
      remaining: 0,
      resetAt: new Date('2026-08-26T00:00:00.000Z').toISOString(),
    },
  };
}

describe('ProposalsService.generateProposal', () => {
  let service: ProposalsService;
  const aiService = { generateProposal: jest.fn() };
    const aiUsageService = {
    reserveProposalGeneration: jest.fn(),
    releaseProposalGeneration: jest.fn().mockResolvedValue(undefined),
    getUsage: jest.fn().mockResolvedValue({
      plan: 'STARTER',
      limit: 3,
      used: 1,
      remaining: 2,
      resetAt: new Date('2026-08-26T00:00:00.000Z').toISOString(),
    }),
  };
  const proposalModel = { findOne: jest.fn(), countDocuments: jest.fn(), create: jest.fn() };
  const clientModel = { findOne: jest.fn() };
  const activitiesService = { log: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProposalsService,
        { provide: AiService, useValue: aiService },
        { provide: AiUsageService, useValue: aiUsageService },
        { provide: getModelToken('Proposal'), useValue: proposalModel },
        { provide: getModelToken('Client'), useValue: clientModel },
        { provide: ActivitiesService, useValue: activitiesService },
      ],
    }).compile();

        service = module.get(ProposalsService);
  });

  // 12. Quota exhausted -> Gemini NOT called, 429 thrown
  it('rejects with 429 and does not call Gemini when quota is exhausted', async () => {
    aiUsageService.reserveProposalGeneration.mockResolvedValueOnce(exhaustedUsage());

    let thrown: any;
    try {
      await service.generateProposal(starterUser(), validDto as any);
    } catch (e) {
      thrown = e;
    }
    expect(thrown).toBeInstanceOf(HttpException);
    expect(thrown.getStatus()).toBe(429);
    expect(thrown.getResponse()).toMatchObject({
      statusCode: 429,
      message: 'Daily AI proposal generation limit reached.',
      limit: 3,
      used: 3,
      remaining: 0,
      plan: 'STARTER',
    });
    // Gemini must NOT be called
    expect(aiService.generateProposal).not.toHaveBeenCalled();
    // No release needed (no slot reserved)
    expect(aiUsageService.releaseProposalGeneration).not.toHaveBeenCalled();
  });

  // 6. Gemini failure -> usage does not increase (slot released)
  it('releases the slot and rethrows when Gemini rejects', async () => {
    aiUsageService.reserveProposalGeneration.mockResolvedValueOnce(allowedUsage(1));
    aiService.generateProposal.mockRejectedValueOnce(new Error('Gemini is down'));

    await expect(service.generateProposal(starterUser(), validDto as any)).rejects.toThrow(
      'Gemini is down',
    );
    expect(aiUsageService.releaseProposalGeneration).toHaveBeenCalled();
  });

  // 7. Invalid Gemini response -> usage does not increase (slot released)
  it('releases the slot when Gemini returns an invalid response', async () => {
    aiUsageService.reserveProposalGeneration.mockResolvedValueOnce(allowedUsage(1));
    aiService.generateProposal.mockResolvedValueOnce({ proposal: null, success: false });

    const result = await service.generateProposal(starterUser(), validDto as any);
    expect(aiUsageService.releaseProposalGeneration).toHaveBeenCalled();
    // Service still returns the payload shape; no usage increment happened
    expect(result.proposal).toBeNull();
  });

  // Happy path: reservation -> Gemini success -> returns proposal + usage
  it('returns the proposal and usage on a successful generation', async () => {
    const fakeProposal = { title: 'Proposal', sections: [] };
    aiUsageService.reserveProposalGeneration.mockResolvedValueOnce(allowedUsage(1));
    aiService.generateProposal.mockResolvedValueOnce({ proposal: fakeProposal, success: true });
    aiUsageService.getUsage.mockResolvedValueOnce({
      plan: 'STARTER',
      limit: 3,
      used: 1,
      remaining: 2,
      resetAt: new Date('2026-08-26T00:00:00.000Z').toISOString(),
    });

    const result = await service.generateProposal(starterUser(), validDto as any);
    expect(result.proposal).toEqual(fakeProposal);
    expect(result.usage).toMatchObject({ plan: 'STARTER', limit: 3, used: 1, remaining: 2 });
    expect(aiUsageService.releaseProposalGeneration).not.toHaveBeenCalled();
  });

  // 8. Unauthenticated request -> rejected at the guard layer.
  // (This test documents that generateProposal does NOT accept unauthenticated callers:
  //  the controller delegates to @UseGuards(JwtAuthGuard), so `user` is always a real,
  //  authenticated document. Here we assert the contract: passing no user throws.)
  it('throws when no authenticated user is supplied', async () => {
    await expect(
      service.generateProposal(undefined as any, validDto as any),
    ).rejects.toThrow();
    expect(aiUsageService.reserveProposalGeneration).not.toHaveBeenCalled();
    expect(aiService.generateProposal).not.toHaveBeenCalled();
  });
});


