import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

import {
  Customer,
  CustomerSchema,
} from '../customers/schema/customer.schema';

import {
  Animal,
  AnimalSchema,
} from '../animal/schema/animal.schema';

import {
  MilkProduction,
  MilkProductionSchema,
} from '../milk-production/schema/milk-production.schema';

import {
  MilkDelivery,
  MilkDeliverySchema,
} from '../milk-delivery/schema/milk-delivery.schema';

import {
  MonthlyBill,
  MonthlyBillSchema,
} from '../bills/schema/monthly-bill.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Customer.name,
        schema: CustomerSchema,
      },
      {
        name: Animal.name,
        schema: AnimalSchema,
      },
      {
        name: MilkProduction.name,
        schema: MilkProductionSchema,
      },
      {
        name: MilkDelivery.name,
        schema: MilkDeliverySchema,
      },
      {
        name: MonthlyBill.name,
        schema: MonthlyBillSchema,
      },
    ]),
  ],

  controllers: [DashboardController],

  providers: [DashboardService],
})
export class DashboardModule {}