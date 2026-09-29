import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import {
  MilkProduction,
  MilkProductionSchema,
} from './schema/milk-production.schema';

import {
  Animal,
  AnimalSchema,
} from '../animal/schema/animal.schema';

import { MilkProductionController } from './milk-production.controller';
import { MilkProductionService } from './milk-production.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: MilkProduction.name,
        schema: MilkProductionSchema,
      },
      {
        name: Animal.name,
        schema: AnimalSchema,
      },
    ]),
  ],

  controllers: [
    MilkProductionController,
  ],

  providers: [
    MilkProductionService,
  ],

  exports: [
    MilkProductionService,
  ],
})
export class MilkProductionModule {}