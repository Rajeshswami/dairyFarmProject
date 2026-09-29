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
    enum: [0, 0.25, 0.5, 0.75, 1],
  })
  morning: number;

  @Prop({
    required: true,
    min: 0,
    enum: [0, 0.25, 0.5, 0.75, 1],
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