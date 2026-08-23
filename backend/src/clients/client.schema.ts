import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ClientDocument = Client & Document;

@Schema({ timestamps: true })
export class Client {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ trim: true, default: '' })
  company: string;

  @Prop({ trim: true, lowercase: true, default: '' })
  email: string;

  @Prop({ trim: true, default: '' })
  phone: string;

  @Prop({ trim: true, default: '' })
  website: string;

  @Prop({ trim: true, default: '' })
  address: string;

  @Prop({ enum: ['Active', 'Lead', 'Inactive'], default: 'Active' })
  status: string;

  @Prop({ enum: ['Enterprise', 'Startup', 'SMB'], default: 'Startup' })
  tier: string;

  @Prop({ default: 'US' })
  country: string;

  @Prop({ default: '' })
  notes: string;
}

export const ClientSchema = SchemaFactory.createForClass(Client);

// Compound index for fast per-user queries
ClientSchema.index({ userId: 1, createdAt: -1 });

ClientSchema.virtual('id').get(function () {
  return this._id.toHexString();
});

ClientSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret) => {
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

ClientSchema.set('toObject', { virtuals: true });
