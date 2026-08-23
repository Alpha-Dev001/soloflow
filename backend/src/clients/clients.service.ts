import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Client, ClientDocument } from './client.schema';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { ActivitiesService } from '../activities/activities.service';

@Injectable()
export class ClientsService {
  constructor(
    @InjectModel(Client.name) private readonly clientModel: Model<ClientDocument>,
    private readonly activitiesService: ActivitiesService,
  ) { }

  /**
   * Returns all clients for the user, enriched with computed
   * totalSpent (sum of paid invoices) and projectsCount via aggregation.
   */
  async findAll(
    userId: string,
    search?: string,
  ): Promise<{ clients: any[]; total: number }> {
    const matchStage: any = { userId: new Types.ObjectId(userId) };
    if (search && search.trim()) {
      const q = search.trim();
      matchStage.$or = [
        { name: { $regex: q, $options: 'i' } },
        { company: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
      ];
    }

    const clients = await this.clientModel
      .aggregate([
        { $match: matchStage },
        { $sort: { createdAt: -1 } },
        // Lookup paid invoices to compute totalSpent
        {
          $lookup: {
            from: 'invoices',
            let: { clientId: '$_id' },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ['$clientId', '$$clientId'] },
                  status: 'Paid',
                },
              },
              { $group: { _id: null, total: { $sum: '$total' } } },
            ],
            as: 'paidInvoices',
          },
        },
        // Lookup project count
        {
          $lookup: {
            from: 'projects',
            let: { clientId: '$_id' },
            pipeline: [
              { $match: { $expr: { $eq: ['$clientId', '$$clientId'] } } },
              { $count: 'count' },
            ],
            as: 'projectsAgg',
          },
        },
        {
          $addFields: {
            totalSpent: {
              $ifNull: [{ $arrayElemAt: ['$paidInvoices.total', 0] }, 0],
            },
            projectsCount: {
              $ifNull: [{ $arrayElemAt: ['$projectsAgg.count', 0] }, 0],
            },
            id: { $toString: '$_id' },
          },
        },
        {
          $project: {
            id: 1,
            name: 1,
            company: 1,
            email: 1,
            phone: 1,
            website: 1,
            address: 1,
            status: 1,
            tier: 1,
            country: 1,
            notes: 1,
            totalSpent: 1,
            projectsCount: 1,
            createdAt: 1,
            updatedAt: 1,
          },
        },
      ])
      .exec();

    return { clients, total: clients.length };
  }

  async findOne(
    userId: string,
    clientId: string,
  ): Promise<ClientDocument> {
    const client = await this.clientModel.findById(clientId).exec();
    if (!client) throw new NotFoundException('Client not found');
    if (String(client.userId) !== userId) throw new ForbiddenException();
    return client;
  }

  async create(userId: string, dto: CreateClientDto): Promise<ClientDocument> {
    const client = new this.clientModel({
      ...dto,
      userId: new Types.ObjectId(userId),
    });
    const saved = await client.save();

    // Log activity
    await this.activitiesService.log({
      userId,
      type: 'client_added',
      title: `Client ${saved.name}`,
      subtitle: 'added',
      iconType: 'client',
    });

    return saved;
  }

  async update(
    userId: string,
    clientId: string,
    dto: UpdateClientDto,
  ): Promise<ClientDocument> {
    const client = await this.clientModel.findById(clientId).exec();
    if (!client) throw new NotFoundException('Client not found');
    if (String(client.userId) !== userId) throw new ForbiddenException();

    Object.assign(client, dto);
    return client.save();
  }

  async remove(userId: string, clientId: string): Promise<void> {
    const client = await this.clientModel.findById(clientId).exec();
    if (!client) throw new NotFoundException('Client not found');
    if (String(client.userId) !== userId) throw new ForbiddenException();
    await client.deleteOne();
  }
}
