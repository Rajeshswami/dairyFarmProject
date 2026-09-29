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