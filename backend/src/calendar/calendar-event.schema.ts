import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CalendarEventDocument = CalendarEvent & Document;

@Schema({ timestamps: true })
export class CalendarEvent {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ default: '' })
  clientName: string;

  @Prop({ type: Types.ObjectId, ref: 'Client' })
  clientId?: Types.ObjectId;

  @Prop({ required: true })
  date: Date;

  @Prop({
    enum: ['deadline', 'meeting', 'milestone', 'invoice_due'],
    default: 'meeting',
  })
  type: string;

  @Prop({ default: '' })
  description: string;

  @Prop({ default: false })
  completed: boolean;

  /** 'manual' = user-created, 'project' = derived from project, 'invoice' = derived from invoice */
  @Prop({ enum: ['manual', 'project', 'invoice'], default: 'manual' })
  sourceType: string;

  @Prop({ type: Types.ObjectId })
  sourceId?: Types.ObjectId;
}

export const CalendarEventSchema = SchemaFactory.createForClass(CalendarEvent);

CalendarEventSchema.index({ userId: 1, date: 1 });

CalendarEventSchema.virtual('id').get(function () {
  return this._id.toHexString();
});

CalendarEventSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret: any) => {
    delete ret._id;
    delete ret.__v;
    // Return date as ISO string YYYY-MM-DD for the frontend
    if (ret.date) {
      const d = ret.date instanceof Date ? ret.date : new Date(ret.date);
      ret.date = d.toISOString().slice(0, 10);
    }
    return ret;
  },
});

CalendarEventSchema.set('toObject', { virtuals: true });
