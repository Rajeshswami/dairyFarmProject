import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { MilkDeliveryController } from './milk-delivery.controller';
import { MilkDeliveryService } from './milk-delivery.service';

import {
  MilkDelivery,
  MilkDeliverySchema,
} from './schema/milk-delivery.schema';

import {
  Customer,
  CustomerSchema,
} from '../customers/schema/customer.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: MilkDelivery.name,
        schema: MilkDeliverySchema,
      },
      {
        name: Customer.name,
        schema: CustomerSchema,
      },
    ]),
  ],

  controllers: [MilkDeliveryController],

  providers: [MilkDeliveryService],

  exports: [MilkDeliveryService],
})
export class MilkDeliveryModule {}