import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Invoice, InvoiceDocument } from './invoice.schema';
import { Client } from '../clients/client.schema';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { ActivitiesService } from '../activities/activities.service';

function parseDate(input: string): Date {
  if (!input) return new Date();
  if (/^\d{4}-\d{2}-\d{2}/.test(input)) return new Date(input);
  const parsed = new Date(input);
  return isNaN(parsed.getTime()) ? new Date() : parsed;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

@Injectable()
export class InvoicesService {
  constructor(
    @InjectModel(Invoice.name) private readonly invoiceModel: Model<InvoiceDocument>,
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

  /** Per-user sequential invoice number: INV-YYYY-NNN */
  private async generateInvoiceNumber(userId: string): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.invoiceModel
      .countDocuments({ userId: new Types.ObjectId(userId) })
      .exec();
    const seq = String(count + 1).padStart(3, '0');
    return `INV-${year}-${seq}`;
  }

  private toResponse(invoice: InvoiceDocument, clientName: string): any {
    const obj = invoice.toJSON();
    return {
      ...obj,
      clientId: String(obj.clientId),
      projectId: obj.projectId ? String(obj.projectId) : undefined,
      clientName,
      issueDate: obj.issueDate ? formatDate(new Date(obj.issueDate)) : '',
      dueDate: obj.dueDate ? formatDate(new Date(obj.dueDate)) : '',
      paidAt: obj.paidAt ? new Date(obj.paidAt).toISOString() : undefined,
      // Ensure items have an id field
      items: (obj.items || []).map((item: any, idx: number) => ({
        id: item._id ? String(item._id) : String(idx),
        ...item,
        _id: undefined,
      })),
    };
  }

  async findAll(
    userId: string,
    search?: string,
    clientId?: string,
  ): Promise<{ invoices: any[]; total: number }> {
    const query: any = { userId: new Types.ObjectId(userId) };
    if (clientId) query.clientId = new Types.ObjectId(clientId);
    if (search && search.trim()) {
      query.$or = [
        { invoiceNumber: { $regex: search.trim(), $options: 'i' } },
      ];
    }

    const invoices = await this.invoiceModel
      .find(query)
      .sort({ createdAt: -1 })
      .exec();

    const clientMap = new Map<string, string>();
    const enriched = await Promise.all(
      invoices.map(async (inv) => {
        const cid = String(inv.clientId);
        if (!clientMap.has(cid)) {
          clientMap.set(cid, await this.getClientName(userId, cid));
        }
        return this.toResponse(inv, clientMap.get(cid)!);
      }),
    );

    return { invoices: enriched, total: enriched.length };
  }

  async findOne(userId: string, invoiceId: string): Promise<InvoiceDocument> {
    const invoice = await this.invoiceModel.findById(invoiceId).exec();
    if (!invoice) throw new NotFoundException('Invoice not found');
    if (String(invoice.userId) !== userId) throw new ForbiddenException();
    return invoice;
  }

  async create(userId: string, dto: CreateInvoiceDto): Promise<any> {
    const clientName = await this.getClientName(userId, dto.clientId);
    const invoiceNumber = await this.generateInvoiceNumber(userId);

    // Calculate totals from items
    const items = dto.items.map((item) => ({
      ...item,
      amount: item.quantity * item.unitPrice,
    }));
    const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
    const taxRate = dto.taxRate || 0;
    const taxAmount = (subtotal * taxRate) / 100;
    const total = subtotal + taxAmount;

    const invoice = new this.invoiceModel({
      userId: new Types.ObjectId(userId),
      invoiceNumber,
      clientId: new Types.ObjectId(dto.clientId),
      projectId: dto.projectId ? new Types.ObjectId(dto.projectId) : undefined,
      issueDate: dto.issueDate ? parseDate(dto.issueDate) : new Date(),
      dueDate: parseDate(dto.dueDate),
      status: dto.status || 'Sent',
      items,
      subtotal,
      taxRate,
      taxAmount,
      total,
      currency: dto.currency || 'USD',
      notes: dto.notes || '',
    });

    const saved = await invoice.save();
    return { invoice: this.toResponse(saved, clientName) };
  }

  async update(userId: string, invoiceId: string, dto: UpdateInvoiceDto): Promise<any> {
    const invoice = await this.findOne(userId, invoiceId);
    const clientName = await this.getClientName(userId, String(invoice.clientId));

    if (dto.items) {
      const items = dto.items.map((item) => ({
        ...item,
        amount: item.quantity * item.unitPrice,
      }));
      const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
      const taxRate = dto.taxRate !== undefined ? dto.taxRate : invoice.taxRate;
      const taxAmount = (subtotal * taxRate) / 100;
      invoice.items = items as any;
      invoice.subtotal = subtotal;
      invoice.taxRate = taxRate;
      invoice.taxAmount = taxAmount;
      invoice.total = subtotal + taxAmount;
    }
    if (dto.dueDate) invoice.dueDate = parseDate(dto.dueDate) as any;
    if (dto.status) invoice.status = dto.status;
    if (dto.notes !== undefined) invoice.notes = dto.notes;

    const saved = await invoice.save();
    return { invoice: this.toResponse(saved, clientName) };
  }

  async updateStatus(userId: string, invoiceId: string, status: string): Promise<any> {
    const invoice = await this.findOne(userId, invoiceId);
    const clientName = await this.getClientName(userId, String(invoice.clientId));

    invoice.status = status;
    if (status === 'Paid') {
      invoice.paidAt = new Date() as any;

      await this.activitiesService.log({
        userId,
        type: 'invoice_paid',
        title: `Invoice ${invoice.invoiceNumber}`,
        subtitle: `Paid by ${clientName}`,
        iconType: 'check',
      });
    }

    const saved = await invoice.save();
    return { invoice: this.toResponse(saved, clientName) };
  }

  async remove(userId: string, invoiceId: string): Promise<void> {
    const invoice = await this.findOne(userId, invoiceId);
    await invoice.deleteOne();
  }
}
