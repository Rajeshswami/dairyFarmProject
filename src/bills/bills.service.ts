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
import { Customer, CustomerDocument } from '../customers/schema/customer.schema';
import { Payment, PaymentDocument } from '../payments/schema/payment.schema';

import { CreateMonthlyBillDto } from './dto/create-monthly-bill.dto';

@Injectable()
export class BillsService {
  constructor(
    @InjectModel(MonthlyBill.name)
    private readonly billModel: Model<MonthlyBillDocument>,

    @InjectModel(MilkDelivery.name)
    private readonly milkDeliveryModel: Model<MilkDeliveryDocument>,

    @InjectModel(Customer.name)
    private readonly customerModel: Model<CustomerDocument>,

    @InjectModel(Payment.name)
    private readonly paymentModel: Model<PaymentDocument>,
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

    const customer = await this.customerModel.findById(customerId);
    if (!customer) throw new NotFoundException('Customer not found');
    const fallbackRate = Number(customer.ratePerLiter || process.env.MILK_RATE || 75);

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

    const totalAmount = Math.round((deliveries.reduce(
      (sum, delivery) =>
        sum +
        Number(delivery.totalLiters || 0) *
          Number(delivery.ratePerLiter || fallbackRate),
      0,
    ) + Number.EPSILON) * 100) / 100;

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

    const existingPayments = existingBill
      ? await this.paymentModel.find({ billId: existingBill._id })
      : [];
    const paidAmount = existingBill
      ? (existingPayments.length > 0
          ? existingPayments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0)
          : Number(existingBill.paidAmount || 0))
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

    // A delivery correction may lower the bill below payments already
    // received. Keep the payment ledger unchanged and show the excess as credit.
    const creditAmount = Math.max(0, paidAmount - totalAmount);
    const pendingAmount = Math.max(0, totalAmount - paidAmount);

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

    const averageRate = totalLiters > 0 ? totalAmount / totalLiters : fallbackRate;

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
      existingBill.creditAmount = creditAmount;

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
        creditAmount: 0,

        status: 'PENDING',
      });

    return bill.save();
  }

  // =========================================================
  // GET MONTHLY BILL SUMMARY
  // =========================================================

  async getMonthlySummary(year: number, month: number) {
    if (!Number.isInteger(year) || year < 2000 || year > 2100) throw new BadRequestException('Invalid year');
    if (!Number.isInteger(month) || month < 1 || month > 12) throw new BadRequestException('Invalid month');
    const startDate = startOfFarmMonth(year, month);
    const endDate = startOfNextFarmMonth(year, month);
    // Reconcile existing bills from source delivery/payment records before reporting.
    const existingBills = await this.billModel.find({ year, month });
    for (const existingBill of existingBills) await this.refreshBillFromSourceRecords(existingBill);
    const [bills, deliveries, allCustomers] = await Promise.all([
      this.billModel.find({ year, month }).populate('customerId', 'name mobile address active ratePerLiter startDate').exec(),
      this.milkDeliveryModel.find({ date: { $gte: startDate, $lt: endDate } }).exec(),
      this.customerModel.find().sort({ name: 1 }).exec(),
    ]);
    const billByCustomer = new Map<string, any>();
    for (const bill of bills) billByCustomer.set(bill.customerId?._id?.toString?.() || bill.customerId.toString(), bill);
    const deliveriesByCustomer = new Map<string, any[]>();
    for (const delivery of deliveries) {
      const id = delivery.customerId.toString();
      const list = deliveriesByCustomer.get(id) || [];
      list.push(delivery);
      deliveriesByCustomer.set(id, list);
    }
    const visibleCustomers = allCustomers.filter((customer) =>
      customer.active || billByCustomer.has(customer._id.toString()) || deliveriesByCustomer.has(customer._id.toString()),
    );
    const rows = visibleCustomers.map((customer) => {
      const id = customer._id.toString();
      const customerDeliveries = deliveriesByCustomer.get(id) || [];
      const bill = billByCustomer.get(id);
      const totalLiters = Number(customerDeliveries.reduce((sum, item) => sum + Number(item.totalLiters || 0), 0).toFixed(2));
      const estimatedAmount = Math.round((customerDeliveries.reduce((sum, item) => sum + Number(item.totalLiters || 0) * Number(item.ratePerLiter || customer.ratePerLiter || process.env.MILK_RATE || 75), 0) + Number.EPSILON) * 100) / 100;
      const rateAmount = estimatedAmount;
      const weightedRate = totalLiters > 0 ? Number((rateAmount / totalLiters).toFixed(4)) : Number(customer.ratePerLiter || 0);
      const generated = Boolean(bill);
      const paidAmount = generated ? Number(bill.paidAmount || 0) : 0;
      const billTotal = generated ? Number(bill.totalAmount || 0) : estimatedAmount;
      const pendingAmount = generated ? Number(bill.pendingAmount || 0) : 0;
      return {
        billId: bill?._id || null,
        generated,
        customer: { _id: customer._id, name: customer.name, mobile: customer.mobile, active: customer.active },
        totalLiters: generated ? Number(bill.totalLiters || 0) : totalLiters,
        ratePerLiter: generated ? Number(bill.ratePerLiter || 0) : weightedRate,
        totalAmount: billTotal,
        estimatedAmount,
        paidAmount,
        pendingAmount,
        creditAmount: generated ? Number(bill.creditAmount || 0) : 0,
        status: generated ? bill.status : (totalLiters > 0 ? 'NOT_GENERATED' : 'NO_DELIVERY'),
        hasDeliveries: customerDeliveries.length > 0,
      };
    });
    const generatedRows = rows.filter((row) => row.generated);
    const unbilledRows = rows.filter((row) => !row.generated && row.hasDeliveries);
    const summary = {
      totalCustomers: rows.length,
      generatedBills: generatedRows.length,
      ungeneratedCustomers: unbilledRows.length,
      totalMilkLiters: Number(rows.reduce((sum, row) => sum + Number(row.totalLiters || 0), 0).toFixed(2)),
      totalBilling: Math.round((generatedRows.reduce((sum, row) => sum + row.totalAmount, 0) + Number.EPSILON) * 100) / 100,
      totalEstimatedUnbilled: Math.round((unbilledRows.reduce((sum, row) => sum + row.estimatedAmount, 0) + Number.EPSILON) * 100) / 100,
      totalCollected: Math.round((generatedRows.reduce((sum, row) => sum + row.paidAmount, 0) + Number.EPSILON) * 100) / 100,
      totalPending: Math.round((generatedRows.reduce((sum, row) => sum + row.pendingAmount, 0) + Number.EPSILON) * 100) / 100,
      totalCredit: Math.round((generatedRows.reduce((sum, row) => sum + row.creditAmount, 0) + Number.EPSILON) * 100) / 100,
    };
    return { year, month, summary, customers: rows };
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

    // Refresh balances before returning pending collections.
    const existingBills = await this.billModel.find({ year, month });
    for (const existingBill of existingBills) await this.refreshBillFromSourceRecords(existingBill);

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
  private async refreshBillFromSourceRecords(bill: MonthlyBillDocument) {
    const customerId = bill.customerId.toString();
    const customer = await this.customerModel.findById(customerId);
    const fallbackRate = Number(customer?.ratePerLiter || process.env.MILK_RATE || 75);
    const start = startOfFarmMonth(bill.year, bill.month);
    const end = startOfNextFarmMonth(bill.year, bill.month);
    const [deliveries, payments] = await Promise.all([
      this.milkDeliveryModel.find({ customerId: new Types.ObjectId(customerId), date: { $gte: start, $lt: end } }),
      this.paymentModel.find({ billId: bill._id }),
    ]);
    const totalLiters = Number(deliveries.reduce((sum, item) => sum + Number(item.totalLiters || 0), 0).toFixed(2));
    const totalAmount = Math.round((deliveries.reduce((sum, item) => sum + Number(item.totalLiters || 0) * Number(item.ratePerLiter || fallbackRate), 0) + Number.EPSILON) * 100) / 100;
    const paidAmount = Math.round((payments.reduce((sum, item) => sum + Number(item.amount || 0), 0) + Number.EPSILON) * 100) / 100;
    const pendingAmount = Math.round(Math.max(0, totalAmount - paidAmount) * 100) / 100;
    const creditAmount = Math.round(Math.max(0, paidAmount - totalAmount) * 100) / 100;
    bill.totalLiters = totalLiters;
    bill.totalAmount = totalAmount;
    bill.ratePerLiter = totalLiters > 0 ? Number((totalAmount / totalLiters).toFixed(4)) : fallbackRate;
    bill.paidAmount = paidAmount;
    bill.pendingAmount = pendingAmount;
    bill.creditAmount = creditAmount;
    bill.status = pendingAmount === 0 ? 'PAID' : paidAmount > 0 ? 'PARTIAL' : 'PENDING';
    await bill.save();
  }

}