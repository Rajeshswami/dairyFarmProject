import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type MonthlyBillDocument =
  HydratedDocument<MonthlyBill>;

@Schema({
  timestamps: true,
})
export class MonthlyBill {
  @Prop({
    required: true,
    type: Types.ObjectId,
    ref: 'Customer',
  })
  customerId: Types.ObjectId;

  @Prop({
    required: true,
  })
  year: number;

  @Prop({
    required: true,
    min: 1,
    max: 12,
  })
  month: number;

  @Prop({
    required: true,
  })
  totalLiters: number;

  @Prop({
    required: true,
  })
  ratePerLiter: number;

  @Prop({
    required: true,
  })
  totalAmount: number;

  @Prop({
    default: 0,
  })
  paidAmount: number;

  @Prop({
    required: true,
  })
  pendingAmount: number;

  @Prop({
    enum: ['PENDING', 'PARTIAL', 'PAID'],
    default: 'PENDING',
  })
  status: string;
}

export const MonthlyBillSchema =
  SchemaFactory.createForClass(MonthlyBill);

MonthlyBillSchema.index(
  {
    customerId: 1,
    year: 1,
    month: 1,
  },
  {
    unique: true,
  },
);