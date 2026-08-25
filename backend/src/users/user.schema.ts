import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email: string;

  @Prop({ required: true })
  passwordHash: string;

  @Prop({ trim: true })
  businessName?: string;

  @Prop({ trim: true })
  company?: string;

  @Prop({ default: 'USD' })
  currency: string;

  /** Platform role — independent of subscription plan. */
  @Prop({ enum: ['USER', 'ADMIN'], default: 'USER' })
  role: string;

  /**
   * Billing plan mirror of the active Subscription.
   * 'free' = Starter, 'pro' = Pro. Never trust client-supplied values.
   */
  @Prop({ enum: ['free', 'pro'], default: 'free' })
  plan: string;

  @Prop({
    enum: ['none', 'active', 'canceled', 'expired', 'pending'],
    default: 'active',
  })
  subscriptionStatus: string;

  @Prop({ enum: ['active', 'suspended'], default: 'active' })
  accountStatus: string;

  @Prop()
  avatarUrl?: string;

  @Prop({
    type: {
      bankName: String,
      accountHolder: String,
      routingNumber: String,
      accountNumber: String,
    },
    default: {},
  })
  bankDetails?: {
    bankName?: string;
    accountHolder?: string;
    routingNumber?: string;
    accountNumber?: string;
  };

  @Prop({
    type: { defaultTone: String },
    default: { defaultTone: 'Professional' },
  })
  aiSettings?: {
    defaultTone?: string;
  };
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.virtual('id').get(function () {
  return this._id.toHexString();
});

UserSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret) => {
    delete ret._id;
    delete ret.__v;
    delete ret.passwordHash;
    return ret;
  },
});

UserSchema.set('toObject', { virtuals: true });
