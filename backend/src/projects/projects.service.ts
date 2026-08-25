import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Project, ProjectDocument } from './project.schema';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ActivitiesService } from '../activities/activities.service';
import { Client } from '../clients/client.schema';

/** Parse a date that may be ISO ("2024-06-15") or human-readable ("Jun 15, 2024") */
function parseDate(input: string): Date {
  if (!input) return new Date();
  // ISO format
  if (/^\d{4}-\d{2}-\d{2}/.test(input)) return new Date(input);
  // Human-readable — let Date constructor handle it
  const parsed = new Date(input);
  return isNaN(parsed.getTime()) ? new Date() : parsed;
}

@Injectable()
export class ProjectsService {
  constructor(
    @InjectModel(Project.name) private readonly projectModel: Model<ProjectDocument>,
    @InjectModel(Client.name) private readonly clientModel: Model<any>,
    private readonly activitiesService: ActivitiesService,
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

  /** Serialize a project document to the frontend shape */
  toResponse(proj: any, clientName: string): any {
    const obj = proj.toJSON ? proj.toJSON() : { ...proj };
    return {
      ...obj,
      id: obj.id || String(proj._id),
      clientId: String(obj.clientId),
      clientName,
      deadline: obj.deadline
        ? new Date(obj.deadline).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })
        : '',
      startDate: obj.startDate
        ? new Date(obj.startDate).toISOString()
        : undefined,
    };
  }

  async findAll(
    userId: string,
    search?: string,
    clientId?: string,
  ): Promise<{ projects: any[]; total: number }> {
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
        { description: { $regex: search.trim(), $options: 'i' } },
      ];
    }

    const projects = await this.projectModel
      .find(query)
      .sort({ createdAt: -1 })
      .exec();

    // Enrich with clientName
    const clientMap = new Map<string, string>();
    const enriched = await Promise.all(
      projects.map(async (p) => {
        const cid = String(p.clientId);
        if (!clientMap.has(cid)) {
          clientMap.set(cid, await this.getClientName(userId, cid));
        }
        return this.toResponse(p, clientMap.get(cid)!);
      }),
    );

    return { projects: enriched, total: enriched.length };
  }

  async findByClient(userId: string, clientId: string): Promise<{ projects: any[]; total: number }> {
    const client = await this.validateClient(userId, clientId);
    const projects = await this.projectModel
      .find({ userId: new Types.ObjectId(userId), clientId: new Types.ObjectId(clientId) })
      .sort({ createdAt: -1 })
      .exec();

    const enriched = projects.map((p) => this.toResponse(p, client.name));
    return { projects: enriched, total: enriched.length };
  }

  async findOne(userId: string, projectId: string): Promise<ProjectDocument> {
    if (!Types.ObjectId.isValid(projectId)) {
      throw new NotFoundException('Project not found');
    }
    const project = await this.projectModel.findById(projectId).exec();
    if (!project) throw new NotFoundException('Project not found');
    if (String(project.userId) !== userId) throw new ForbiddenException();
    return project;
  }

  async findOneDetails(userId: string, projectId: string): Promise<any> {
    const project = await this.findOne(userId, projectId);
    const client = await this.validateClient(userId, String(project.clientId));
    return {
      project: this.toResponse(project, client.name),
      client: {
        ...client,
        id: String(client._id),
        _id: undefined,
      },
    };
  }

  async create(userId: string, dto: CreateProjectDto): Promise<any> {
    const client = await this.validateClient(userId, dto.clientId);

    const project = new this.projectModel({
      userId: new Types.ObjectId(userId),
      clientId: new Types.ObjectId(client._id),
      title: dto.title,
      description: dto.description || '',
      budget: dto.budget || 0,
      priority: dto.priority || 'Medium',
      status: dto.status || 'To Do',
      deadline: parseDate(dto.deadline),
      startDate: dto.startDate ? parseDate(dto.startDate) : undefined,
      tags: dto.tags || [],
      proposalId: dto.proposalId && Types.ObjectId.isValid(dto.proposalId) ? new Types.ObjectId(dto.proposalId) : undefined,
    });
    const saved = await project.save();

    await this.activitiesService.log({
      userId,
      type: 'project_created',
      title: `Project "${saved.title}"`,
      subtitle: `created for ${client.name}`,
      iconType: 'project',
    });

    return { project: this.toResponse(saved, client.name) };
  }

  async update(userId: string, projectId: string, dto: UpdateProjectDto): Promise<any> {
    const project = await this.findOne(userId, projectId);
    let targetClientId = String(project.clientId);

    if (dto.clientId && dto.clientId !== targetClientId) {
      const newClient = await this.validateClient(userId, dto.clientId);
      project.clientId = new Types.ObjectId(newClient._id) as any;
      targetClientId = String(newClient._id);
    }

    const clientName = await this.getClientName(userId, targetClientId);

    if (dto.title !== undefined) project.title = dto.title;
    if (dto.description !== undefined) project.description = dto.description;
    if (dto.budget !== undefined) project.budget = dto.budget;
    if (dto.priority !== undefined) project.priority = dto.priority;
    if (dto.status !== undefined) project.status = dto.status;
    if (dto.deadline !== undefined) project.deadline = parseDate(dto.deadline) as any;
    if (dto.startDate !== undefined) project.startDate = parseDate(dto.startDate) as any;
    if (dto.tags !== undefined) project.tags = dto.tags;

    const saved = await project.save();
    return { project: this.toResponse(saved, clientName) };
  }

  async updateStatus(userId: string, projectId: string, status: string): Promise<any> {
    const project = await this.findOne(userId, projectId);
    const clientName = await this.getClientName(userId, String(project.clientId));

    project.status = status;
    const saved = await project.save();

    await this.activitiesService.log({
      userId,
      type: 'project_status',
      title: `Project "${saved.title}"`,
      subtitle: `marked as ${status}`,
      iconType: 'project',
    });

    return { project: this.toResponse(saved, clientName) };
  }

  async remove(userId: string, projectId: string): Promise<void> {
    const project = await this.findOne(userId, projectId);
    await project.deleteOne();
  }
}
