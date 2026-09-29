import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type AnimalDocument = HydratedDocument<Animal>;

@Schema({ timestamps: true })
export class Animal {
  @Prop({
    required: true,
    trim: true,
    unique: true,
  })
  tagNumber: string;

  @Prop({
    trim: true,
  })
  name?: string;

  @Prop({
    required: true,
    trim: true,
  })
  breed: string;

  @Prop({
    required: true,
    enum: ['MALE', 'FEMALE'],
  })
  gender: string;

  @Prop()
  dateOfBirth?: Date;

  @Prop()
  purchaseDate?: Date;

  @Prop({
    min: 0,
  })
  purchasePrice?: number;

  @Prop({
    required: true,
    enum: ['ACTIVE', 'SOLD', 'DEAD'],
    default: 'ACTIVE',
  })
  status: string;

  @Prop({
    trim: true,
  })
  notes?: string;
}

export const AnimalSchema =
  SchemaFactory.createForClass(Animal);