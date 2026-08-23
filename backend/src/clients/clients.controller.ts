import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserDocument } from '../users/user.schema';
import { ClientsService } from './clients.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Project } from '../projects/project.schema';
import { Proposal } from '../proposals/proposal.schema';
import { Invoice } from '../invoices/invoice.schema';

@Controller('clients')
@UseGuards(JwtAuthGuard)
export class ClientsController {
  constructor(
    private readonly clientsService: ClientsService,
    @InjectModel(Project.name) private readonly projectModel: Model<any>,
    @InjectModel(Proposal.name) private readonly proposalModel: Model<any>,
    @InjectModel(Invoice.name) private readonly invoiceModel: Model<any>,
  ) { }

  /** GET /api/clients?search= */
  @Get()
  async findAll(
    @CurrentUser() user: UserDocument,
    @Query('search') search?: string,
  ) {
    return this.clientsService.findAll(String(user._id), search);
  }

  /** GET /api/clients/:id — returns client + related projects/proposals/invoices */
  @Get(':id')
  async findOne(
    @CurrentUser() user: UserDocument,
    @Param('id') id: string,
  ) {
    const userId = String(user._id);
    const client = await this.clientsService.findOne(userId, id);
    const clientObjId = new Types.ObjectId(id);

    const [projects, proposals, invoices] = await Promise.all([
      this.projectModel
        .find({ userId: new Types.ObjectId(userId), clientId: clientObjId })
        .sort({ createdAt: -1 })
        .lean()
        .exec(),
      this.proposalModel
        .find({ userId: new Types.ObjectId(userId), clientId: clientObjId })
        .sort({ createdAt: -1 })
        .lean()
        .exec(),
      this.invoiceModel
        .find({ userId: new Types.ObjectId(userId), clientId: clientObjId })
        .sort({ createdAt: -1 })
        .lean()
        .exec(),
    ]);

    // Normalize _id → id for related records
    const normalize = (arr: any[]) =>
      arr.map((r) => ({ ...r, id: String(r._id), _id: undefined }));

    // Compute totalSpent and projectsCount for the single client
    const totalSpent = invoices
      .filter((inv: any) => inv.status === 'Paid')
      .reduce((sum: number, inv: any) => sum + (inv.total || 0), 0);
    const projectsCount = projects.length;

    return {
      client: {
        ...client.toJSON(),
        totalSpent,
        projectsCount,
      },
      projects: normalize(projects),
      proposals: normalize(proposals),
      invoices: normalize(invoices),
    };
  }

  /** POST /api/clients */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @CurrentUser() user: UserDocument,
    @Body() dto: CreateClientDto,
  ) {
    const client = await this.clientsService.create(String(user._id), dto);
    // Include computed fields (0 for a brand-new client) so the frontend
    // optimistic update can render the row without a separate GET call.
    return {
      client: {
        ...client.toJSON(),
        totalSpent: 0,
        projectsCount: 0,
      },
    };
  }

  /** PUT /api/clients/:id */
  @Put(':id')
  async update(
    @CurrentUser() user: UserDocument,
    @Param('id') id: string,
    @Body() dto: UpdateClientDto,
  ) {
    const client = await this.clientsService.update(String(user._id), id, dto);
    return { client: client.toJSON() };
  }

  /** DELETE /api/clients/:id */
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(
    @CurrentUser() user: UserDocument,
    @Param('id') id: string,
  ) {
    await this.clientsService.remove(String(user._id), id);
    return { success: true };
  }
}
