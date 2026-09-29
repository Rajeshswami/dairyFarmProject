import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { BillsController } from './bills.controller';
import { BillsService } from './bills.service';

import {
  MonthlyBill,
  MonthlyBillSchema,
} from './schema/monthly-bill.schema';

import {
  MilkDelivery,
  MilkDeliverySchema,
} from '../milk-delivery/schema/milk-delivery.schema';

import {
  Customer,
  CustomerSchema,
} from '../customers/schema/customer.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: MonthlyBill.name,
        schema: MonthlyBillSchema,
      },
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

  controllers: [BillsController],

  providers: [BillsService],

  exports: [BillsService],
})
export class BillsModule {}