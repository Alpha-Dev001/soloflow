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

  @Prop({ enum: ['free', 'pro'], default: 'free' })
  plan: string;

  @Prop()
  avatarUrl?: string;

  // Banking details (for invoice PDFs)
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

  // AI configuration
  @Prop({
    type: { defaultTone: String },
    default: { defaultTone: 'Professional' },
  })
  aiSettings?: {
    defaultTone?: string;
  };
}

export const UserSchema = SchemaFactory.createForClass(User);

// Virtual `id` field (returns string representation of _id)
UserSchema.virtual('id').get(function () {
  return this._id.toHexString();
});

UserSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret) => {
    delete ret._id;
    delete ret.__v;
    delete ret.passwordHash; // Never expose password hash
    return ret;
  },
});

UserSchema.set('toObject', { virtuals: true });
