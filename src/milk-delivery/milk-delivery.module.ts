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
import { MonthlyBill, MonthlyBillSchema } from '../bills/schema/monthly-bill.schema';
import { Payment, PaymentSchema } from '../payments/schema/payment.schema';

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
      { name: MonthlyBill.name, schema: MonthlyBillSchema },
      { name: Payment.name, schema: PaymentSchema },
    ]),
  ],

  controllers: [MilkDeliveryController],

  providers: [MilkDeliveryService],

  exports: [MilkDeliveryService],
})
export class MilkDeliveryModule {}