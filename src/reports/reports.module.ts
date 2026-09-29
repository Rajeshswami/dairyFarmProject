import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import {
  MonthlyBill,
  MonthlyBillSchema,
} from '../bills/schema/monthly-bill.schema';
import {
  MilkProduction,
  MilkProductionSchema,
} from '../milk-production/schema/milk-production.schema';
import {
  MilkDelivery,
  MilkDeliverySchema,
} from '../milk-delivery/schema/milk-delivery.schema';

import {
  Animal,
  AnimalSchema,
} from '../animal/schema/animal.schema';

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

  controllers: [ReportsController],

  providers: [ReportsService],
})
export class ReportsModule {}