import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Proposal, ProposalDocument } from './proposal.schema';
import { Client } from '../clients/client.schema';
import { CreateProposalDto } from './dto/create-proposal.dto';
import { UpdateProposalDto } from './dto/update-proposal.dto';
import { ActivitiesService } from '../activities/activities.service';

@Injectable()
export class ProposalsService {
  constructor(
    @InjectModel(Proposal.name) private readonly proposalModel: Model<ProposalDocument>,
    @InjectModel(Client.name) private readonly clientModel: Model<any>,
    private readonly activitiesService: ActivitiesService,
  ) { }

  private async getClientName(userId: string, clientId: string): Promise<string> {
    const client = await this.clientModel
      .findOne({ _id: new Types.ObjectId(clientId), userId: new Types.ObjectId(userId) })
      .lean()
      .exec() as any;
    return client ? client.name : 'Unknown Client';
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

  private toResponse(proposal: ProposalDocument, clientName: string): any {
    const obj = proposal.toJSON();
    return {
      ...obj,
      clientId: String(obj.clientId),
      projectId: obj.projectId ? String(obj.projectId) : undefined,
      clientName,
    };
  }

  async findAll(
    userId: string,
    search?: string,
    clientId?: string,
  ): Promise<{ proposals: any[]; total: number }> {
    const query: any = { userId: new Types.ObjectId(userId) };
    if (clientId) query.clientId = new Types.ObjectId(clientId);
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

  async findOne(userId: string, proposalId: string): Promise<ProposalDocument> {
    const proposal = await this.proposalModel.findById(proposalId).exec();
    if (!proposal) throw new NotFoundException('Proposal not found');
    if (String(proposal.userId) !== userId) throw new ForbiddenException();
    return proposal;
  }

  async create(userId: string, dto: CreateProposalDto): Promise<any> {
    const clientName = await this.getClientName(userId, dto.clientId);
    const proposalNumber = await this.generateProposalNumber(userId);

    const proposal = new this.proposalModel({
      userId: new Types.ObjectId(userId),
      proposalNumber,
      clientId: new Types.ObjectId(dto.clientId),
      projectId: dto.projectId ? new Types.ObjectId(dto.projectId) : undefined,
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
      subtitle: `for ${clientName}`,
      iconType: 'proposal',
    });

    return { proposal: this.toResponse(saved, clientName) };
  }

  async update(userId: string, proposalId: string, dto: UpdateProposalDto): Promise<any> {
    const proposal = await this.findOne(userId, proposalId);
    const clientName = await this.getClientName(userId, String(proposal.clientId));

    const fields: any = { ...dto };
    if (dto.clientId) fields.clientId = new Types.ObjectId(dto.clientId);
    if (dto.projectId) fields.projectId = new Types.ObjectId(dto.projectId);
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
