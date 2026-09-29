import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type PaymentDocument =
  HydratedDocument<Payment>;

@Schema({
  timestamps: true,
})
export class Payment {
  @Prop({
    required: true,
    type: Types.ObjectId,
    ref: 'Customer',
  })
  customerId: Types.ObjectId;

  @Prop({
    required: true,
    type: Types.ObjectId,
    ref: 'MonthlyBill',
  })
  billId: Types.ObjectId;

  @Prop({
    required: true,
    min: 0,
  })
  amount: number;

  @Prop({
    required: true,
  })
  paymentDate: Date;

  @Prop({
    required: true,
    enum: ['CASH', 'UPI', 'BANK'],
  })
  paymentMethod: string;

  @Prop()
  note?: string;
}

export const PaymentSchema =
  SchemaFactory.createForClass(Payment);