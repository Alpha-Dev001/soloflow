import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type InvoiceDocument = Invoice & Document;

const InvoiceItemSchema = {
  description: { type: String, required: true },
  quantity: { type: Number, default: 1 },
  unitPrice: { type: Number, default: 0 },
  amount: { type: Number, default: 0 },
};

@Schema({ timestamps: true })
export class Invoice {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  invoiceNumber: string; // e.g. INV-2024-015

  @Prop({ type: Types.ObjectId, ref: 'Client', required: true })
  clientId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Project' })
  projectId?: Types.ObjectId;

  @Prop({ default: () => new Date() })
  issueDate: Date;

  @Prop({ required: true })
  dueDate: Date;

  @Prop({
    enum: ['Paid', 'Pending', 'Overdue', 'Sent', 'Draft'],
    default: 'Draft',
  })
  status: string;

  @Prop({ type: [InvoiceItemSchema], default: [] })
  items: {
    description: string;
    quantity: number;
    unitPrice: number;
    amount: number;
  }[];

  @Prop({ default: 0 })
  subtotal: number;

  @Prop({ default: 0 })
  taxRate: number;

  @Prop({ default: 0 })
  taxAmount: number;

  @Prop({ default: 0 })
  total: number;

  @Prop({ default: 'USD' })
  currency: string;

  @Prop({ default: '' })
  notes: string;

  @Prop()
  paidAt?: Date;
}

export const InvoiceSchema = SchemaFactory.createForClass(Invoice);

InvoiceSchema.index({ userId: 1, status: 1 });
InvoiceSchema.index({ userId: 1, clientId: 1 });

InvoiceSchema.virtual('id').get(function () {
  return this._id.toHexString();
});

InvoiceSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret) => {
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

InvoiceSchema.set('toObject', { virtuals: true });
