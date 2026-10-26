import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type CustomerDocument = HydratedDocument<Customer>;

@Schema({
  timestamps: true,
})
export class Customer {
  @Prop({
    required: true,
    trim: true,
  })
  name: string;

  @Prop({
    required: true, 
    trim: true,
  })
  mobile: string;

  @Prop({
    trim: true,
  })
  address: string;

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
    default: 75,
  })
  ratePerLiter: number;

  @Prop({
    required: true,
  })
  startDate: Date;

  @Prop({
    default: true,
  })
  active: boolean;
}

export const CustomerSchema = SchemaFactory.createForClass(Customer);