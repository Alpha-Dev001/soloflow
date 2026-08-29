import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Activity, ActivityDocument } from './activity.schema';

export interface LogActivityDto {
  userId: string;
  clientId?: string;
  type: string;
  title: string;
  subtitle: string;
  iconType?: string;
}

@Injectable()
export class ActivitiesService {
  constructor(
    @InjectModel(Activity.name)
    private readonly activityModel: Model<ActivityDocument>,
  ) {}

  async log(dto: LogActivityDto): Promise<ActivityDocument> {
    const activity = new this.activityModel({
      userId: new Types.ObjectId(dto.userId),
      clientId: dto.clientId ? new Types.ObjectId(dto.clientId) : undefined,
      type: dto.type,
      title: dto.title,
      subtitle: dto.subtitle,
      iconType: dto.iconType,
      timestamp: new Date(),
    });
    return activity.save();
  }

  async findByClient(userId: string, clientId: string, limit = 20): Promise<ActivityDocument[]> {
    return this.activityModel
      .find({ userId: new Types.ObjectId(userId), clientId: new Types.ObjectId(clientId) })
      .sort({ timestamp: -1 })
      .limit(limit)
      .exec();
  }

  async findRecent(userId: string, limit = 10): Promise<ActivityDocument[]> {
    return this.activityModel
      .find({ userId: new Types.ObjectId(userId) })
      .sort({ timestamp: -1 })
      .limit(limit)
      .exec();
  }

  /** Convert a persisted Activity to the frontend ActivityItem shape */
  toActivityItem(activity: ActivityDocument): any {
    const now = Date.now();
    const diffMs = now - new Date(activity.timestamp).getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffHr = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHr / 24);

    let timeAgo: string;
    if (diffMin < 1) timeAgo = 'just now';
    else if (diffMin < 60) timeAgo = `${diffMin}m ago`;
    else if (diffHr < 24) timeAgo = `${diffHr}h ago`;
    else timeAgo = `${diffDay}d ago`;

    return {
      id: String(activity._id),
      type: activity.type,
      title: activity.title,
      subtitle: activity.subtitle,
      timeAgo,
      timestamp: activity.timestamp.toISOString(),
      iconType: activity.iconType,
      clientId: (activity as any).clientId ? String((activity as any).clientId) : undefined,
    };
  }
}
