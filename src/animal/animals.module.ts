import { Module } from '@nestjs/common';

import { MongooseModule } from '@nestjs/mongoose';

import {
  Animal,
  AnimalSchema,
} from './schema/animal.schema';

import { AnimalsController } from './animals.controller';
import { AnimalsService } from './animals.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Animal.name,
        schema: AnimalSchema,
      },
    ]),
  ],

  controllers: [AnimalsController],

  providers: [AnimalsService],

  exports: [AnimalsService],
})
export class AnimalsModule {}