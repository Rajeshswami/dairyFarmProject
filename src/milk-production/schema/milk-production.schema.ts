import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type MilkProductionDocument =
  HydratedDocument<MilkProduction>;

@Schema({ timestamps: true })
export class MilkProduction {
  @Prop({
    required: true,
    type: Types.ObjectId,
    ref: 'Animal',
  })
  animalId: Types.ObjectId;

  @Prop({ required: true })
  date: Date;

  @Prop({
    required: true,
    min: 0,
    default: 0,
  })
  morning: number;

  @Prop({
    required: true,
    min: 0,
    default: 0,
  })
  evening: number;

  @Prop({
    required: true,
    min: 0,
  })
  totalLiters: number;

  @Prop()
  note?: string;
}

export const MilkProductionSchema =
  SchemaFactory.createForClass(MilkProduction);

MilkProductionSchema.index(
  {
    animalId: 1,
    date: 1,
  },
  {
    unique: true,
  },
);