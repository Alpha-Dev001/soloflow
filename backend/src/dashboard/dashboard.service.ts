import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Invoice } from '../invoices/invoice.schema';
import { Project } from '../projects/project.schema';
import { Client } from '../clients/client.schema';
import { Proposal } from '../proposals/proposal.schema';
import { ActivitiesService } from '../activities/activities.service';
import { CalendarEvent } from '../calendar/calendar-event.schema';

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

@Injectable()
export class DashboardService {
  constructor(
    @InjectModel(Invoice.name) private readonly invoiceModel: Model<any>,
    @InjectModel(Project.name) private readonly projectModel: Model<any>,
    @InjectModel(Client.name) private readonly clientModel: Model<any>,
    @InjectModel(Proposal.name) private readonly proposalModel: Model<any>,
    @InjectModel(CalendarEvent.name) private readonly calendarModel: Model<any>,
    private readonly activitiesService: ActivitiesService,
  ) { }

  async getMetrics(userId: string) {
    const userObjId = new Types.ObjectId(userId);

    // Build the 6-month rolling window
    const now = new Date();
    const months: { year: number; month: number; label: string }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({ year: d.getFullYear(), month: d.getMonth(), label: MONTHS_SHORT[d.getMonth()] });
    }

    // Parallel data fetches
    const [
      totalRevResult,
      pendingResult,
      activeProjectsCount,
      completedProjectsCount,
      revenueTimeline,
      topClientsAgg,
      projectStatusBreakdown,
      recentActivities,
      upcomingEvents,
    ] = await Promise.all([
      // Total revenue (all paid invoices ever)
      this.invoiceModel.aggregate([
        { $match: { userId: userObjId, status: 'Paid' } },
        { $group: { _id: null, total: { $sum: '$total' } } },
      ]),
      // Pending payments (Sent + Pending invoices)
      this.invoiceModel.aggregate([
        { $match: { userId: userObjId, status: { $in: ['Sent', 'Pending'] } } },
        { $group: { _id: null, total: { $sum: '$total' } } },
      ]),
      // Active projects count
      this.projectModel.countDocuments({ userId: userObjId, status: 'In Progress' }),
      // Completed projects count
      this.projectModel.countDocuments({ userId: userObjId, status: 'Completed' }),
      // Monthly revenue timeline — last 6 months, paid invoices only
      this.invoiceModel.aggregate([
        {
          $match: {
            userId: userObjId,
            status: 'Paid',
            paidAt: {
              $gte: new Date(now.getFullYear(), now.getMonth() - 5, 1),
            },
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
      // Top clients by total spent (paid invoices)
      this.invoiceModel.aggregate([
        { $match: { userId: userObjId, status: 'Paid' } },
        { $group: { _id: '$clientId', totalSpent: { $sum: '$total' } } },
        { $sort: { totalSpent: -1 } },
        { $limit: 5 },
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
            id: { $toString: '$_id' },
            name: { $ifNull: ['$client.name', 'Unknown'] },
            totalSpent: 1,
            projectsCount: 0,
          },
        },
      ]),
      // Project status breakdown
      this.projectModel.aggregate([
        { $match: { userId: userObjId } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      // Recent activities
      this.activitiesService.findRecent(userId, 10),
      // Upcoming calendar events (next 30 days)
      this.calendarModel
        .find({
          userId: userObjId,
          date: {
            $gte: new Date(),
            $lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          },
          sourceType: 'manual',
        })
        .sort({ date: 1 })
        .limit(5)
        .lean()
        .exec(),
    ]);

    const totalRevenue = totalRevResult[0]?.total || 0;
    const pendingPayments = pendingResult[0]?.total || 0;

    // Build timeline from real data, filling gaps with 0
    const revenueMap = new Map<string, number>();
    for (const r of revenueTimeline) {
      revenueMap.set(`${r._id.year}-${r._id.month - 1}`, r.amount);
    }

    const timeline = months.map((m) => ({
      month: m.label,
      amount: revenueMap.get(`${m.year}-${m.month}`) || 0,
    }));

    // Last month revenue for growth %
    const currentMonthAmt = timeline[5]?.amount || 0;
    const prevMonthAmt = timeline[4]?.amount || 0;
    const revenueGrowthPercent =
      prevMonthAmt > 0
        ? Math.round(((currentMonthAmt - prevMonthAmt) / prevMonthAmt) * 100)
        : 0;

    // Project status breakdown
    const statusMap: any = { active: 0, onHold: 0, completed: 0, cancelled: 0 };
    for (const s of projectStatusBreakdown) {
      if (s._id === 'In Progress') statusMap.active = s.count;
      else if (s._id === 'On Hold') statusMap.onHold = s.count;
      else if (s._id === 'Completed') statusMap.completed = s.count;
      else if (s._id === 'Cancelled') statusMap.cancelled = s.count;
    }

    // Top clients
    const topClients = topClientsAgg.map((c: any) => ({
      id: c.id,
      name: c.name,
      avatarChar: c.name.charAt(0).toUpperCase(),
      totalSpent: c.totalSpent,
      projectsCount: 0,
    }));

    // Upcoming items
    const upcoming = [
      ...upcomingEvents.map((ev: any) => ({
        id: String(ev._id),
        type: ev.type,
        title: ev.title,
        subtitle: ev.clientName || '',
        dayNumber: String(new Date(ev.date).getDate()),
        monthShort: MONTHS_SHORT[new Date(ev.date).getMonth()].toUpperCase(),
        fullDate: new Date(ev.date).toISOString().slice(0, 10),
        dateStr: new Date(ev.date).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }),
      })),
    ];

    return {
      metrics: {
        totalRevenue,
        revenueGrowthPercent,
        activeProjects: activeProjectsCount,
        activeProjectsGrowth: 0,
        pendingPayments,
        pendingPaymentsGrowthPercent: 0,
        completedProjects: completedProjectsCount,
        completedProjectsGrowth: 0,
        revenueOverview: {
          period: '6M',
          total: totalRevenue,
          growthPercent: revenueGrowthPercent,
          timeline,
        },
        recentActivities: recentActivities.map((a) =>
          this.activitiesService.toActivityItem(a),
        ),
        upcoming,
        topClients,
        projectStatusBreakdown: statusMap,
      },
    };
  }
}
