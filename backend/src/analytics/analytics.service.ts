import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Invoice } from '../invoices/invoice.schema';
import { Project } from '../projects/project.schema';
import { Client } from '../clients/client.schema';

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectModel(Invoice.name) private readonly invoiceModel: Model<any>,
    @InjectModel(Project.name) private readonly projectModel: Model<any>,
    @InjectModel(Client.name) private readonly clientModel: Model<any>,
  ) { }

  async getMetrics(userId: string) {
    const userObjId = new Types.ObjectId(userId);
    const now = new Date();

    // Build rolling 6-month window
    const months: { year: number; month: number; label: string }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({ year: d.getFullYear(), month: d.getMonth(), label: MONTHS_SHORT[d.getMonth()] });
    }

    const [
      totalRevAgg,
      totalInvoicedAgg,
      monthlyRevenueAgg,
      topClientsAgg,
      clientCount,
    ] = await Promise.all([
      // Total revenue from paid invoices
      this.invoiceModel.aggregate([
        { $match: { userId: userObjId, status: 'Paid' } },
        { $group: { _id: null, total: { $sum: '$total' } } },
      ]),
      // Total invoiced (all statuses)
      this.invoiceModel.aggregate([
        { $match: { userId: userObjId } },
        { $group: { _id: null, total: { $sum: '$total' } } },
      ]),
      // Monthly revenue (last 6 months, paid invoices)
      this.invoiceModel.aggregate([
        {
          $match: {
            userId: userObjId,
            status: 'Paid',
            paidAt: { $gte: new Date(now.getFullYear(), now.getMonth() - 5, 1) },
          },
        },
        {
          $group: {
            _id: {
              year: { $year: '$paidAt' },
              month: { $month: '$paidAt' },
            },
            amount: { $sum: '$total' },
          },
        },
      ]),
      // Top clients by paid invoices
      this.invoiceModel.aggregate([
        { $match: { userId: userObjId, status: 'Paid' } },
        { $group: { _id: '$clientId', total: { $sum: '$total' } } },
        { $sort: { total: -1 } },
        { $limit: 6 },
        {
          $lookup: {
            from: 'clients',
            localField: '_id',
            foreignField: '_id',
            as: 'client',
          },
        },
        { $unwind: { path: '$client', preserveNullAndEmptyArrays: true } },
        {
          $project: {
            name: { $ifNull: ['$client.name', 'Unknown'] },
            total: 1,
          },
        },
      ]),
      // Client count
      this.clientModel.countDocuments({ userId: userObjId }),
    ]);

    const totalRevenue = totalRevAgg[0]?.total || 0;
    const totalInvoiced = totalInvoicedAgg[0]?.total || 0;
    const collectionRate =
      totalInvoiced > 0
        ? Math.round((totalRevenue / totalInvoiced) * 100)
        : 0;

    const avgProjectValue =
      clientCount > 0 ? Math.round(totalRevenue / clientCount) : 0;

    // Build monthly revenue timeline with real data
    const revenueMap = new Map<string, number>();
    for (const r of monthlyRevenueAgg) {
      revenueMap.set(`${r._id.year}-${r._id.month - 1}`, r.amount);
    }
    const monthlyRevenue = months.map((m) => ({
      month: m.label,
      amount: revenueMap.get(`${m.year}-${m.month}`) || 0,
    }));

    const topClientsRevenue = topClientsAgg.map((c: any) => ({
      name: c.name,
      total: c.total,
    }));

    return {
      analytics: {
        totalRevenue,
        avgProjectValue,
        collectionRate,
        monthlyRevenue,
        topClientsRevenue,
      },
    };
  }
}
