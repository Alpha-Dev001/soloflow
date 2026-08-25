import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AiUsageDocument = AiUsage & Document;

/**
 * Tracks a single user's daily AI feature usage.
 *
 * One document per (user, date). The unique compound index guarantees a
 * user has at most one usage record per day, so the day boundary is handled
 * purely by the `date` field (no cron resets needed).
 *
 * Only `proposalGenerations` is active today. The schema is structured so
 * additional AI usage counters (chat, rewrites, summaries) can be added
 * later without rework.
 */
@Schema({ collection: 'aiusage' })
export class AiUsage {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  /** 'YYYY-MM-DD' in the configured AI_USAGE_TIMEZONE. */
  @Prop({ required: true })
  date: string;

  @Prop({ default: 0 })
  proposalGenerations: number;

  // Future extensibility (not yet active) — left commented to document intent.
  // @Prop({ default: 0 }) chatRequests?: number;
  // @Prop({ default: 0 }) rewrites?: number;
  // @Prop({ default: 0 }) summaries?: number;
}

export const AiUsageSchema = SchemaFactory.createForClass(AiUsage);

// Enforce one usage document per user per day.
AiUsageSchema.index({ userId: 1, date: 1 }, { unique: true });