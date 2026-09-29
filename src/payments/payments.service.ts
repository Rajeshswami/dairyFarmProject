import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import {
  Payment,
  PaymentDocument,
} from './schema/payment.schema';

import {
  MonthlyBill,
  MonthlyBillDocument,
} from '../bills/schema/monthly-bill.schema';

import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { startOfFarmDate } from '../common/utils/farm-date.util';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectModel(Payment.name)
    private readonly paymentModel:
      Model<PaymentDocument>,

    @InjectModel(MonthlyBill.name)
    private readonly billModel:
      Model<MonthlyBillDocument>,
  ) { }

  async createPayment(dto: CreatePaymentDto) {
    // 1. Find bill by bill ID only
    const bill = await this.billModel.findById(dto.billId);

    if (!bill) {
      throw new NotFoundException('Bill not found');
    }

    // 2. Verify that bill belongs to customer
    if (bill.customerId.toString() !== dto.customerId) {
      throw new BadRequestException(
        'This bill does not belong to the specified customer',
      );
    }

    // 3. Calculate remaining amount
    const remaining =
      bill.totalAmount - bill.paidAmount;

    if (dto.amount > remaining) {
      throw new BadRequestException(
        `Payment exceeds pending amount of ₹${remaining}`,
      );
    }

    // 4. Create payment
    const payment = new this.paymentModel({
      customerId: dto.customerId,
      billId: dto.billId,
      amount: dto.amount,
      paymentDate: startOfFarmDate(dto.paymentDate),
      paymentMethod: dto.paymentMethod,
      note: dto.note,
    });

    const savedPayment = await payment.save();

    // 5. Update bill
    const updatedBill =
      await this.recalculateBill(bill._id.toString());

    // 6. Return result
    return {
      payment: savedPayment,
      bill: {
        id: updatedBill._id,
        totalAmount: updatedBill.totalAmount,
        paidAmount: updatedBill.paidAmount,
        pendingAmount: updatedBill.pendingAmount,
        status: updatedBill.status,
      },
    };
  }
  async getCustomerPayments(customerId: string) {
    const payments = await this.paymentModel
      .find({ customerId })
      .populate(
        'billId',
        'year month totalAmount paidAmount pendingAmount status',
      )
      .sort({ paymentDate: -1 });

    const totalPaid = payments.reduce(
      (sum, payment) => sum + payment.amount,
      0,
    );

    return {
      customerId,
      count: payments.length,
      totalPaid,
      payments: payments.map((payment) => ({
        paymentId: payment._id,
        amount: payment.amount,
        paymentDate: payment.paymentDate,
        paymentMethod: payment.paymentMethod,
        note: payment.note,
        bill: payment.billId,
      })),
    };
  }
  private async recalculateBill(billId: string) {
    const bill = await this.billModel.findById(billId);

    if (!bill) {
      throw new NotFoundException('Bill not found');
    }

    const payments = await this.paymentModel.find({
      billId: bill._id,
    });

    const paidAmount = payments.reduce(
      (sum, payment) => sum + payment.amount,
      0,
    );

    const pendingAmount =
      Math.max(0, bill.totalAmount - paidAmount);

    let status: 'PENDING' | 'PARTIAL' | 'PAID';

    if (pendingAmount <= 0) {
      status = 'PAID';
    } else if (paidAmount > 0) {
      status = 'PARTIAL';
    } else {
      status = 'PENDING';
    }

    bill.paidAmount = paidAmount;
    bill.pendingAmount = pendingAmount;
    bill.status = status;

    await bill.save();

    return bill;
  }
  async findOne(id: string) {
  const payment = await this.paymentModel
    .findById(id)
    .populate(
      'customerId',
      'name mobile address',
    )
    .populate(
      'billId',
      'year month totalAmount paidAmount pendingAmount status',
    );

  if (!payment) {
    throw new NotFoundException(
      'Payment not found',
    );
  }

  return payment;
}
async update(
  id: string,
  dto: UpdatePaymentDto,
) {
  const payment =
    await this.paymentModel.findById(id);

  if (!payment) {
    throw new NotFoundException(
      'Payment not found',
    );
  }

  const bill =
    await this.billModel.findById(payment.billId);

  if (!bill) {
    throw new NotFoundException(
      'Associated bill not found',
    );
  }

  // --------------------------------
  // Calculate existing payments
  // excluding this payment
  // --------------------------------

  const otherPayments =
    await this.paymentModel.find({
      billId: payment.billId,
      _id: { $ne: payment._id },
    });

  const otherPaidAmount =
    otherPayments.reduce(
      (sum, item) => sum + item.amount,
      0,
    );

  const newAmount =
    dto.amount !== undefined
      ? dto.amount
      : payment.amount;

  const newTotalPaid =
    otherPaidAmount + newAmount;

  if (newTotalPaid > bill.totalAmount) {
    throw new BadRequestException(
      `Payment exceeds bill amount. Maximum allowed is ₹${
        bill.totalAmount - otherPaidAmount
      }`,
    );
  }

  // --------------------------------
  // Update payment
  // --------------------------------

  if (dto.amount !== undefined) {
    payment.amount = dto.amount;
  }

  if (dto.paymentDate !== undefined) {
    payment.paymentDate =
   startOfFarmDate(dto.paymentDate)
  }

  if (dto.paymentMethod !== undefined) {
    payment.paymentMethod =
      dto.paymentMethod;
  }

  if (dto.note !== undefined) {
    payment.note = dto.note;
  }

  const updatedPayment =
    await payment.save();

  // --------------------------------
  // Recalculate bill
  // --------------------------------

  const updatedBill =
    await this.recalculateBill(
      payment.billId.toString(),
    );

  return {
    payment: updatedPayment,

    bill: {
      id: updatedBill._id,
      totalAmount: updatedBill.totalAmount,
      paidAmount: updatedBill.paidAmount,
      pendingAmount: updatedBill.pendingAmount,
      status: updatedBill.status,
    },
  };
}
async remove(id: string) {
  const payment =
    await this.paymentModel.findById(id);

  if (!payment) {
    throw new NotFoundException(
      'Payment not found',
    );
  }

  const billId =
    payment.billId.toString();

  await this.paymentModel.findByIdAndDelete(id);

  const updatedBill =
    await this.recalculateBill(billId);

  return {
    message:
      'Payment deleted successfully',

    bill: {
      id: updatedBill._id,
      totalAmount: updatedBill.totalAmount,
      paidAmount: updatedBill.paidAmount,
      pendingAmount: updatedBill.pendingAmount,
      status: updatedBill.status,
    },
  };
}
}