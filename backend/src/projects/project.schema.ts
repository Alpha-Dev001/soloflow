import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ProjectDocument = Project & Document;

@Schema({ timestamps: true })
export class Project {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Client', required: true })
  clientId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ default: '' })
  description: string;

  @Prop({ default: 0 })
  budget: number;

  @Prop({ enum: ['Low', 'Medium', 'High', 'Urgent'], default: 'Medium' })
  priority: string;

  @Prop({
    enum: ['To Do', 'In Progress', 'Completed', 'On Hold', 'Cancelled'],
    default: 'To Do',
  })
  status: string;

  @Prop()
  startDate?: Date;

  @Prop({ required: true })
  deadline: Date;

  @Prop({ type: [String], default: [] })
  tags: string[];

  @Prop({
    type: [{ id: String, title: String, completed: Boolean }],
    default: [],
  })
  tasks: { id: string; title: string; completed: boolean }[];

  @Prop({ type: Types.ObjectId, ref: 'Proposal' })
  proposalId?: Types.ObjectId;
}

export const ProjectSchema = SchemaFactory.createForClass(Project);

ProjectSchema.index({ userId: 1, status: 1 });
ProjectSchema.index({ userId: 1, clientId: 1 });

ProjectSchema.virtual('id').get(function () {
  return this._id.toHexString();
});

ProjectSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret) => {
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

ProjectSchema.set('toObject', { virtuals: true });
