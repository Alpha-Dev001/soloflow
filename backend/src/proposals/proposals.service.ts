import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Proposal, ProposalDocument } from './proposal.schema';
import { Client } from '../clients/client.schema';
import { CreateProposalDto, GenerateProposalDto } from './dto/create-proposal.dto';
import { UpdateProposalDto } from './dto/update-proposal.dto';
import { ActivitiesService } from '../activities/activities.service';
import { AiService } from '../ai/ai.service';
import { AiUsageService, AiUsageInfo } from '../ai-usage/ai-usage.service';
import { UserDocument } from '../users/user.schema';

export interface GenerateProposalResponse {
  proposal: any;
  usage: AiUsageInfo;
}

@Injectable()
export class ProposalsService {
  constructor(
    @InjectModel(Proposal.name) private readonly proposalModel: Model<ProposalDocument>,
    @InjectModel(Client.name) private readonly clientModel: Model<any>,
    private readonly activitiesService: ActivitiesService,
    private readonly aiService: AiService,
    private readonly aiUsageService: AiUsageService,
  ) { }

  /** Verify that the client exists and belongs to the authenticated user */
  async validateClient(userId: string, clientId: string): Promise<any> {
    if (!clientId || !Types.ObjectId.isValid(clientId)) {
      throw new NotFoundException('Valid client ID is required');
    }
    const client = await this.clientModel
      .findOne({ _id: new Types.ObjectId(clientId), userId: new Types.ObjectId(userId) })
      .lean()
      .exec() as any;
    if (!client) {
      throw new NotFoundException('Client not found or does not belong to user');
    }
    return client;
  }

  private async getClientName(userId: string, clientId: string): Promise<string> {
    try {
      const client = await this.validateClient(userId, clientId);
      return client.name;
    } catch {
      return 'Unknown Client';
    }
  }

  /** Generate a per-user sequential proposal number: PROP-YYYY-NNN */
  private async generateProposalNumber(userId: string): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.proposalModel
      .countDocuments({ userId: new Types.ObjectId(userId) })
      .exec();
    const seq = String(count + 1).padStart(3, '0');
    return `PROP-${year}-${seq}`;
  }

  toResponse(proposal: any, clientName: string): any {
    const obj = proposal.toJSON ? proposal.toJSON() : { ...proposal };
    return {
      ...obj,
      id: obj.id || String(proposal._id),
      clientId: String(obj.clientId),
      projectId: obj.projectId ? String(obj.projectId) : undefined,
      clientName,
    };
  }

  /**
   * AI proposal generation with a backend-enforced daily quota.
   *
   * Flow: reserve slot (atomic) → if exhausted, 429 (Gemini NOT called) →
   * Gemini → only a real Gemini success keeps the slot; otherwise the slot is
   * released so a failed/invalid generation does NOT consume quota.
   */
  async generateProposal(
    user: UserDocument,
    dto: GenerateProposalDto,
  ): Promise<GenerateProposalResponse> {
    const userId = String(user._id);

    const reservation = await this.aiUsageService.reserveProposalGeneration(user);
    if (!reservation.allowed) {
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: 'Daily AI proposal generation limit reached.',
          limit: reservation.usage.limit,
          used: reservation.usage.used,
          remaining: reservation.usage.remaining,
          plan: reservation.usage.plan,
          resetAt: reservation.usage.resetAt,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    try {
      const { proposal, success } = await this.aiService.generateProposal(dto);

      if (!success) {
        // Gemini did not produce a valid proposal — do not consume quota.
        await this.aiUsageService
          .releaseProposalGeneration(user)
          .catch(() => undefined);
      }

      return {
        proposal,
        usage: await this.aiUsageService.getUsage(user),
      };
    } catch (e) {
      // Any error during generation (network, timeout, invalid key, ...): free the slot.
      await this.aiUsageService
        .releaseProposalGeneration(user)
        .catch(() => undefined);
      throw e;
    }
  }

  async findAll(
    userId: string,
    search?: string,
    clientId?: string,
  ): Promise<{ proposals: any[]; total: number }> {
    const query: any = { userId: new Types.ObjectId(userId) };
    if (clientId) {
      if (!Types.ObjectId.isValid(clientId)) {
        throw new NotFoundException('Invalid clientId');
      }
      query.clientId = new Types.ObjectId(clientId);
    }
    if (search && search.trim()) {
      query.$or = [
        { title: { $regex: search.trim(), $options: 'i' } },
        { proposalNumber: { $regex: search.trim(), $options: 'i' } },
      ];
    }

    const proposals = await this.proposalModel
      .find(query)
      .sort({ createdAt: -1 })
      .exec();

    const clientMap = new Map<string, string>();
    const enriched = await Promise.all(
      proposals.map(async (p) => {
        const cid = String(p.clientId);
        if (!clientMap.has(cid)) {
          clientMap.set(cid, await this.getClientName(userId, cid));
        }
        return this.toResponse(p, clientMap.get(cid)!);
      }),
    );

    return { proposals: enriched, total: enriched.length };
  }

  async findByClient(userId: string, clientId: string): Promise<{ proposals: any[]; total: number }> {
    const client = await this.validateClient(userId, clientId);
    const proposals = await this.proposalModel
      .find({ userId: new Types.ObjectId(userId), clientId: new Types.ObjectId(clientId) })
      .sort({ createdAt: -1 })
      .exec();

    const enriched = proposals.map((p) => this.toResponse(p, client.name));
    return { proposals: enriched, total: enriched.length };
  }

  async findOne(userId: string, proposalId: string): Promise<ProposalDocument> {
    if (!Types.ObjectId.isValid(proposalId)) {
      throw new NotFoundException('Proposal not found');
    }
    const proposal = await this.proposalModel.findById(proposalId).exec();
    if (!proposal) throw new NotFoundException('Proposal not found');
    if (String(proposal.userId) !== userId) throw new ForbiddenException();
    return proposal;
  }

  async findOneDetails(userId: string, proposalId: string): Promise<any> {
    const proposal = await this.findOne(userId, proposalId);
    const client = await this.validateClient(userId, String(proposal.clientId));
    return {
      proposal: this.toResponse(proposal, client.name),
      client: {
        ...client,
        id: String(client._id),
        _id: undefined,
      },
    };
  }

  async create(userId: string, dto: CreateProposalDto): Promise<any> {
    const client = await this.validateClient(userId, dto.clientId);
    const proposalNumber = await this.generateProposalNumber(userId);

    const proposal = new this.proposalModel({
      userId: new Types.ObjectId(userId),
      proposalNumber,
      clientId: new Types.ObjectId(client._id),
      projectId: dto.projectId && Types.ObjectId.isValid(dto.projectId) ? new Types.ObjectId(dto.projectId) : undefined,
      title: dto.title,
      amount: dto.amount || 0,
      status: dto.status || 'Draft',
      tone: dto.tone || 'Professional',
      overview: dto.overview || '',
      scopeOfWork: dto.scopeOfWork || [],
      deliverables: dto.deliverables || [],
      timeline: dto.timeline || '',
      investment: dto.investment || '',
      terms: dto.terms || '',
    });

    const saved = await proposal.save();

    await this.activitiesService.log({
      userId,
      type: 'proposal_generated',
      title: `New proposal ${proposalNumber}`,
      subtitle: `for ${client.name}`,
      iconType: 'proposal',
    });

    return { proposal: this.toResponse(saved, client.name) };
  }

  async update(userId: string, proposalId: string, dto: UpdateProposalDto): Promise<any> {
    const proposal = await this.findOne(userId, proposalId);
    let targetClientId = String(proposal.clientId);

    if (dto.clientId && dto.clientId !== targetClientId) {
      const newClient = await this.validateClient(userId, dto.clientId);
      proposal.clientId = new Types.ObjectId(newClient._id) as any;
      targetClientId = String(newClient._id);
    }

    const clientName = await this.getClientName(userId, targetClientId);

    const fields: any = { ...dto };
    if (dto.clientId) fields.clientId = new Types.ObjectId(targetClientId);
    if (dto.projectId) {
      fields.projectId = Types.ObjectId.isValid(dto.projectId) ? new Types.ObjectId(dto.projectId) : undefined;
    }
    delete fields.clientName;

    Object.assign(proposal, fields);
    const saved = await proposal.save();
    return { proposal: this.toResponse(saved, clientName) };
  }

  async updateStatus(userId: string, proposalId: string, status: string): Promise<any> {
    const proposal = await this.findOne(userId, proposalId);
    const clientName = await this.getClientName(userId, String(proposal.clientId));

    proposal.status = status;
    const saved = await proposal.save();

    if (status === 'Accepted') {
      await this.activitiesService.log({
        userId,
        type: 'proposal_accepted',
        title: `Proposal ${proposal.proposalNumber}`,
        subtitle: `accepted by ${clientName}`,
        iconType: 'proposal',
      });
    }

    return { proposal: this.toResponse(saved, clientName) };
  }

  async remove(userId: string, proposalId: string): Promise<void> {
    const proposal = await this.findOne(userId, proposalId);
    await proposal.deleteOne();
  }
}
