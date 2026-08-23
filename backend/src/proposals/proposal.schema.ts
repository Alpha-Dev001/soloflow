import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ProposalDocument = Proposal & Document;

@Schema({ timestamps: true })
export class Proposal {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  proposalNumber: string; // e.g. PROP-2024-008

  @Prop({ type: Types.ObjectId, ref: 'Client', required: true })
  clientId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Project' })
  projectId?: Types.ObjectId;

  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ default: 0 })
  amount: number;

  @Prop({
    enum: ['Draft', 'Sent', 'Viewed', 'Accepted', 'Rejected', 'Expired'],
    default: 'Draft',
  })
  status: string;

  @Prop({ default: 'Professional' })
  tone: string;

  @Prop({ default: '' })
  overview: string;

  @Prop({ type: [String], default: [] })
  scopeOfWork: string[];

  @Prop({ type: [String], default: [] })
  deliverables: string[];

  @Prop({ default: '' })
  timeline: string;

  @Prop({ default: '' })
  investment: string;

  @Prop({ default: '' })
  terms: string;
}

export const ProposalSchema = SchemaFactory.createForClass(Proposal);

ProposalSchema.index({ userId: 1, createdAt: -1 });
ProposalSchema.index({ userId: 1, clientId: 1 });

ProposalSchema.virtual('id').get(function () {
  return this._id.toHexString();
});

ProposalSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret) => {
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

ProposalSchema.set('toObject', { virtuals: true });
