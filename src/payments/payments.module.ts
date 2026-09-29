import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import {
  Payment,
  PaymentSchema,
} from './schema/payment.schema';

import {
  MonthlyBill,
  MonthlyBillSchema,
} from '../bills/schema/monthly-bill.schema';

import {
  Customer,
  CustomerSchema,
} from '../customers/schema/customer.schema';

import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Payment.name,
        schema: PaymentSchema,
      },
      {
        name: MonthlyBill.name,
        schema: MonthlyBillSchema,
      },
      {
        name: Customer.name,
        schema: CustomerSchema,
      },
    ]),
  ],

  controllers: [PaymentsController],

  providers: [PaymentsService],

  exports: [PaymentsService],
})
export class PaymentsModule {}