import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import {
  startOfFarmMonth,
  startOfNextFarmMonth,
} from '../common/utils/farm-date.util';

import {
  MilkDelivery,
  MilkDeliveryDocument,
} from '../milk-delivery/schema/milk-delivery.schema';

import {
  MonthlyBill,
  MonthlyBillDocument,
} from './schema/monthly-bill.schema';

import { CreateMonthlyBillDto } from './dto/create-monthly-bill.dto';

@Injectable()
export class BillsService {
  constructor(
    @InjectModel(MonthlyBill.name)
    private readonly billModel: Model<MonthlyBillDocument>,

    @InjectModel(MilkDelivery.name)
    private readonly milkDeliveryModel: Model<MilkDeliveryDocument>,
  ) {}

  // =========================================================
  // GENERATE / REGENERATE MONTHLY BILL
  // =========================================================

  async generateMonthlyBill(
    dto: CreateMonthlyBillDto,
  ) {
    const { customerId, year, month } = dto;

    // -------------------------------------------------------
    // Validate customer ID
    // -------------------------------------------------------

    if (!Types.ObjectId.isValid(customerId)) {
      throw new BadRequestException(
        'Invalid customer ID',
      );
    }

    // -------------------------------------------------------
    // Validate year
    // -------------------------------------------------------

    if (
      !Number.isInteger(year) ||
      year < 2000 ||
      year > 2100
    ) {
      throw new BadRequestException(
        'Invalid year',
      );
    }

    // -------------------------------------------------------
    // Validate month
    // -------------------------------------------------------

    if (
      !Number.isInteger(month) ||
      month < 1 ||
      month > 12
    ) {
      throw new BadRequestException(
        'Invalid month',
      );
    }

    // -------------------------------------------------------
    // Get farm month boundaries
    //
    // IMPORTANT:
    // These are based on FARM_TIMEZONE,
    // not the server timezone.
    // -------------------------------------------------------

    const startDate = startOfFarmMonth(
      year,
      month,
    );

    const endDate = startOfNextFarmMonth(
      year,
      month,
    );

    // -------------------------------------------------------
    // Get actual milk deliveries
    // -------------------------------------------------------

    const deliveries =
      await this.milkDeliveryModel.find({
        customerId: new Types.ObjectId(customerId),

        date: {
          $gte: startDate,
          $lt: endDate,
        },
      });

    // -------------------------------------------------------
    // No deliveries = no bill
    // -------------------------------------------------------

    if (deliveries.length === 0) {
      throw new NotFoundException(
        'No milk deliveries found for this customer in the selected month',
      );
    }

    // -------------------------------------------------------
    // Calculate total milk
    //
    // IMPORTANT:
    // Billing is based on ACTUAL DELIVERY,
    // not customer's configured morning/evening quantity.
    // -------------------------------------------------------

    const totalLiters = deliveries.reduce(
      (sum, delivery) =>
        sum + Number(delivery.totalLiters || 0),
      0,
    );

    // -------------------------------------------------------
    // Calculate amount from each delivery's rate
    //
    // This is important if the rate changes during a month.
    //
    // Example:
    // 10L × ₹75
    // 10L × ₹80
    //
    // We calculate each delivery separately.
    // -------------------------------------------------------

    const totalAmount = deliveries.reduce(
      (sum, delivery) =>
        sum +
        Number(delivery.totalLiters || 0) *
          Number(delivery.ratePerLiter || 0),
      0,
    );

    // -------------------------------------------------------
    // Validate calculated values
    // -------------------------------------------------------

    if (totalLiters <= 0) {
      throw new BadRequestException(
        'Total milk quantity must be greater than zero',
      );
    }

    if (totalAmount <= 0) {
      throw new BadRequestException(
        'Total bill amount must be greater than zero',
      );
    }

    // -------------------------------------------------------
    // Find existing bill
    //
    // If the bill already exists, this operation becomes
    // a REGENERATION rather than creating a second bill.
    // -------------------------------------------------------

    const existingBill =
      await this.billModel.findOne({
        customerId: new Types.ObjectId(customerId),
        year,
        month,
      });

    // -------------------------------------------------------
    // Preserve existing payments
    // -------------------------------------------------------

    const paidAmount = existingBill
      ? Number(existingBill.paidAmount || 0)
      : 0;

    // -------------------------------------------------------
    // Important accounting protection
    //
    // Example:
    //
    // Existing bill = ₹3,000
    // Paid          = ₹2,500
    //
    // Delivery correction makes new bill = ₹2,000
    //
    // We DO NOT silently reduce paidAmount.
    // Instead, we stop regeneration and require
    // payment adjustment/refund/credit handling.
    // -------------------------------------------------------

    if (paidAmount > totalAmount) {
      throw new BadRequestException(
        `Existing payments ₹${paidAmount} exceed the regenerated bill amount ₹${totalAmount}. Payment adjustment is required before regenerating this bill.`,
      );
    }

    // -------------------------------------------------------
    // Calculate pending amount
    // -------------------------------------------------------

    const pendingAmount =
      totalAmount - paidAmount;

    // -------------------------------------------------------
    // Calculate bill status
    // -------------------------------------------------------

    let status:
      | 'PENDING'
      | 'PARTIAL'
      | 'PAID';

    if (
      pendingAmount === 0 &&
      paidAmount > 0
    ) {
      status = 'PAID';
    } else if (paidAmount > 0) {
      status = 'PARTIAL';
    } else {
      status = 'PENDING';
    }

    // -------------------------------------------------------
    // Calculate average rate
    //
    // This is only a reference/display value.
    //
    // totalAmount is the authoritative billing value
    // because each delivery can have its own rate.
    // -------------------------------------------------------

    const averageRate =
      deliveries.reduce(
        (sum, delivery) =>
          sum +
          Number(delivery.ratePerLiter || 0),
        0,
      ) / deliveries.length;

    // -------------------------------------------------------
    // Create or update bill
    // -------------------------------------------------------

    if (existingBill) {
      existingBill.totalLiters =
        totalLiters;

      existingBill.ratePerLiter =
        averageRate;

      existingBill.totalAmount =
        totalAmount;

      existingBill.paidAmount =
        paidAmount;

      existingBill.pendingAmount =
        pendingAmount;

      existingBill.status =
        status;

      return existingBill.save();
    }

    // -------------------------------------------------------
    // Create new bill
    // -------------------------------------------------------

    const bill =
      new this.billModel({
        customerId:
          new Types.ObjectId(customerId),

        year,

        month,

        totalLiters,

        ratePerLiter:
          averageRate,

        totalAmount,

        paidAmount: 0,

        pendingAmount:
          totalAmount,

        status: 'PENDING',
      });

    return bill.save();
  }

  // =========================================================
  // GET MONTHLY BILL SUMMARY
  // =========================================================

  async getMonthlySummary(
    year: number,
    month: number,
  ) {
    // -------------------------------------------------------
    // Validate year
    // -------------------------------------------------------

    if (
      !Number.isInteger(year) ||
      year < 2000 ||
      year > 2100
    ) {
      throw new BadRequestException(
        'Invalid year',
      );
    }

    // -------------------------------------------------------
    // Validate month
    // -------------------------------------------------------

    if (
      !Number.isInteger(month) ||
      month < 1 ||
      month > 12
    ) {
      throw new BadRequestException(
        'Invalid month',
      );
    }

    // -------------------------------------------------------
    // Get bills
    // -------------------------------------------------------

    const bills =
      await this.billModel
        .find({
          year,
          month,
        })
        .populate(
          'customerId',
          'name mobile address',
        )
        .sort({
          createdAt: -1,
        });

    // -------------------------------------------------------
    // Summary
    // -------------------------------------------------------

    const summary = bills.reduce(
      (result, bill) => {
        result.totalCustomers += 1;

        result.totalMilkLiters +=
          Number(bill.totalLiters || 0);

        result.totalBilling +=
          Number(bill.totalAmount || 0);

        result.totalCollected +=
          Number(bill.paidAmount || 0);

        result.totalPending +=
          Number(bill.pendingAmount || 0);

        return result;
      },
      {
        totalCustomers: 0,
        totalMilkLiters: 0,
        totalBilling: 0,
        totalCollected: 0,
        totalPending: 0,
      },
    );

    // -------------------------------------------------------
    // Customer-wise bills
    // -------------------------------------------------------

    const customers = bills.map(
      (bill) => ({
        billId: bill._id,

        customer: bill.customerId,

        totalLiters:
          bill.totalLiters,

        totalAmount:
          bill.totalAmount,

        paidAmount:
          bill.paidAmount,

        pendingAmount:
          bill.pendingAmount,

        status:
          bill.status,
      }),
    );

    return {
      year,
      month,

      summary,

      customers,
    };
  }

  // =========================================================
  // GET PENDING BILLS
  // =========================================================

  async getPendingBills(
    year: number,
    month: number,
  ) {
    // -------------------------------------------------------
    // Validate year
    // -------------------------------------------------------

    if (
      !Number.isInteger(year) ||
      year < 2000 ||
      year > 2100
    ) {
      throw new BadRequestException(
        'Invalid year',
      );
    }

    // -------------------------------------------------------
    // Validate month
    // -------------------------------------------------------

    if (
      !Number.isInteger(month) ||
      month < 1 ||
      month > 12
    ) {
      throw new BadRequestException(
        'Invalid month',
      );
    }

    // -------------------------------------------------------
    // Get pending/partial bills
    // -------------------------------------------------------

    const bills =
      await this.billModel
        .find({
          year,
          month,

          status: {
            $in: [
              'PENDING',
              'PARTIAL',
            ],
          },

          pendingAmount: {
            $gt: 0,
          },
        })
        .populate(
          'customerId',
          'name mobile address',
        )
        .sort({
          pendingAmount: -1,
        });

    // -------------------------------------------------------
    // Calculate total pending
    // -------------------------------------------------------

    const totalPending =
      bills.reduce(
        (sum, bill) =>
          sum +
          Number(
            bill.pendingAmount || 0,
          ),
        0,
      );

    return {
      count: bills.length,

      totalPending,

      bills: bills.map(
        (bill) => ({
          billId: bill._id,

          customer: bill.customerId,

          year: bill.year,

          month: bill.month,

          totalLiters:
            bill.totalLiters,

          totalAmount:
            bill.totalAmount,

          paidAmount:
            bill.paidAmount,

          pendingAmount:
            bill.pendingAmount,

          status:
            bill.status,
        }),
      ),
    };
  }

  // =========================================================
  // GET SINGLE BILL
  // =========================================================

  async findOne(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException(
        'Invalid bill ID',
      );
    }

    const bill =
      await this.billModel
        .findById(id)
        .populate(
          'customerId',
          'name mobile address ratePerLiter active',
        );

    if (!bill) {
      throw new NotFoundException(
        'Bill not found',
      );
    }

    return bill;
  }

  // =========================================================
  // GET CUSTOMER BILLS
  // =========================================================

  async findCustomerBills(
    customerId: string,
  ) {
    if (!Types.ObjectId.isValid(customerId)) {
      throw new BadRequestException(
        'Invalid customer ID',
      );
    }

    return this.billModel
      .find({
        customerId:
          new Types.ObjectId(customerId),
      })
      .sort({
        year: -1,
        month: -1,
      });
  }
}