import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type SubscriptionDocument = Subscription & Document;

@Schema({ timestamps: true })
export class Subscription {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  /** 'free' | 'pro' — mirrors User.plan */
  @Prop({ enum: ['free', 'pro'], required: true, default: 'free' })
  plan: string;

  @Prop({
    enum: ['none', 'active', 'canceled', 'expired', 'pending'],
    required: true,
    default: 'none',
  })
  status: string;

  @Prop()
  startedAt?: Date;

  @Prop()
  expiresAt?: Date;

  /** e.g. 'mock' | 'stripe' | 'admin' */
  @Prop({ default: 'mock' })
  provider: string;

  @Prop()
  providerReference?: string;

  /** last known previous plan — useful for admin "upgraded/downgraded" stats */
  @Prop({ enum: ['free', 'pro'] })
  previousPlan?: string;

  @Prop()
  canceledAt?: Date;

  @Prop({ type: Object, default: {} })
  metadata?: Record<string, any>;
}

export const SubscriptionSchema = SchemaFactory.createForClass(Subscription);

SubscriptionSchema.index({ userId: 1, createdAt: -1 });
SubscriptionSchema.index({ status: 1, plan: 1 });

SubscriptionSchema.virtual('id').get(function () {
  return this._id.toHexString();
});

SubscriptionSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret) => {
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

SubscriptionSchema.set('toObject', { virtuals: true });
