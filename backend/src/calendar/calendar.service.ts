import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CalendarEvent, CalendarEventDocument } from './calendar-event.schema';
import { Project } from '../projects/project.schema';
import { Invoice } from '../invoices/invoice.schema';
import { CreateCalendarEventDto, UpdateCalendarEventDto } from './dto/create-event.dto';

@Injectable()
export class CalendarService {
  constructor(
    @InjectModel(CalendarEvent.name)
    private readonly calendarModel: Model<CalendarEventDocument>,
    @InjectModel(Project.name)
    private readonly projectModel: Model<any>,
    @InjectModel(Invoice.name)
    private readonly invoiceModel: Model<any>,
  ) {}

  /**
   * Returns all calendar events for a user:
   *  - manually created events
   *  - derived from projects (deadline)
   *  - derived from invoices (dueDate if not paid)
   */
  async findAll(userId: string): Promise<{ events: any[] }> {
    const userObjId = new Types.ObjectId(userId);

    // Manually created events
    const manualEvents = await this.calendarModel
      .find({ userId: userObjId })
      .lean()
      .exec();

    // Derived from projects
    const projects = await this.projectModel
      .find({ userId: userObjId })
      .populate('clientId', 'name')
      .lean()
      .exec();

    // Derived from invoices (unpaid)
    const invoices = await this.invoiceModel
      .find({ userId: userObjId, status: { $ne: 'Paid' } })
      .populate('clientId', 'name')
      .lean()
      .exec();

    const normalize = (obj: any) => ({
      ...obj,
      id: obj.id || String(obj._id),
      _id: undefined,
      date: obj.date
        ? new Date(obj.date).toISOString().slice(0, 10)
        : undefined,
    });

    const projectEvents = projects.map((p: any) => ({
      id: `cal_proj_${String(p._id)}`,
      title: `Deadline: ${p.title}`,
      clientName: p.clientId?.name || 'Unknown Client',
      date: p.deadline
        ? new Date(p.deadline).toISOString().slice(0, 10)
        : new Date().toISOString().slice(0, 10),
      type: 'deadline',
      description: p.description || '',
      sourceType: 'project',
      sourceId: String(p._id),
    }));

    const invoiceEvents = invoices.map((inv: any) => ({
      id: `cal_inv_${String(inv._id)}`,
      title: `Invoice Due: ${inv.invoiceNumber}`,
      clientName: inv.clientId?.name || 'Unknown Client',
      date: inv.dueDate
        ? new Date(inv.dueDate).toISOString().slice(0, 10)
        : new Date().toISOString().slice(0, 10),
      type: 'invoice_due',
      description: `$${inv.total.toLocaleString()} due`,
      sourceType: 'invoice',
      sourceId: String(inv._id),
    }));

    const events = [
      ...manualEvents.map(normalize),
      ...projectEvents,
      ...invoiceEvents,
    ];

    return { events };
  }

  async create(
    userId: string,
    dto: CreateCalendarEventDto,
  ): Promise<{ event: any }> {
    const event = new this.calendarModel({
      userId: new Types.ObjectId(userId),
      title: dto.title,
      clientName: dto.clientName || '',
      clientId: dto.clientId ? new Types.ObjectId(dto.clientId) : undefined,
      date: new Date(dto.date),
      type: dto.type || 'meeting',
      description: dto.description || '',
      sourceType: 'manual',
    });
    const saved = await event.save();
    return { event: saved.toJSON() };
  }

  async update(
    userId: string,
    eventId: string,
    dto: UpdateCalendarEventDto,
  ): Promise<{ event: any }> {
    const event = await this.calendarModel.findById(eventId).exec();
    if (!event) throw new NotFoundException('Calendar event not found');
    if (String(event.userId) !== userId) throw new ForbiddenException();
    if (event.sourceType !== 'manual') {
      throw new BadRequestException(
        'Cannot update derived events (from projects/invoices)',
      );
    }

    if (dto.title !== undefined) event.title = dto.title;
    if (dto.date !== undefined) event.date = new Date(dto.date) as any;
    if (dto.completed !== undefined) event.completed = dto.completed;
    if (dto.description !== undefined) event.description = dto.description;

    const saved = await event.save();
    return { event: saved.toJSON() };
  }

  async remove(userId: string, eventId: string): Promise<void> {
    const event = await this.calendarModel.findById(eventId).exec();
    if (!event) throw new NotFoundException('Calendar event not found');
    if (String(event.userId) !== userId) throw new ForbiddenException();
    if (event.sourceType !== 'manual') {
      throw new BadRequestException(
        'Cannot delete derived events (from projects/invoices)',
      );
    }
    await event.deleteOne();
  }
}
