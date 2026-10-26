import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type MilkDeliveryDocument =
  HydratedDocument<MilkDelivery>;

@Schema({
  timestamps: true,
})
export class MilkDelivery {
  @Prop({
    required: true,
    type: Types.ObjectId,
    ref: 'Customer',
  })
  customerId: Types.ObjectId;

  @Prop({
    required: true,
  })
  date: Date;

  @Prop({
    required: true,
    min: 0,
    enum: Array.from({ length: 41 }, (_, index) => index * 0.25),
  })
  morning: number;

  @Prop({
    required: true,
    min: 0,
    enum: Array.from({ length: 41 }, (_, index) => index * 0.25),
  })
  evening: number;

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
  amount: number;
}

export const MilkDeliverySchema =
  SchemaFactory.createForClass(MilkDelivery);