import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { DateTime } from 'luxon';
import { Customer, CustomerDocument } from '../customers/schema/customer.schema';
import { MilkDelivery, MilkDeliveryDocument } from './schema/milk-delivery.schema';
import { MonthlyBill, MonthlyBillDocument } from '../bills/schema/monthly-bill.schema';
import { Payment, PaymentDocument } from '../payments/schema/payment.schema';
import { CreateMilkDeliveryDto } from './dto/create-milk-delivery.dto';
import { UpdateMilkDeliveryDto } from './dto/update-milk-delivery.dto';
import { getFarmTimezone, startOfFarmDate, startOfFarmMonth, startOfNextFarmMonth, startOfNextFarmDate, toFarmDateString } from '../common/utils/farm-date.util';

@Injectable()
export class MilkDeliveryService {
  constructor(
    @InjectModel(MilkDelivery.name) private readonly milkDeliveryModel: Model<MilkDeliveryDocument>,
    @InjectModel(Customer.name) private readonly customerModel: Model<CustomerDocument>,
    @InjectModel(MonthlyBill.name) private readonly billModel: Model<MonthlyBillDocument>,
    @InjectModel(Payment.name) private readonly paymentModel: Model<PaymentDocument>,
  ) {}

  async create(dto: CreateMilkDeliveryDto) {
    const customer = await this.customerModel.findById(dto.customerId);
    if (!customer) throw new NotFoundException('Customer not found');
    if (!customer.active) throw new BadRequestException('Customer is inactive');
    this.validateQuarterLiters(dto.morning, 'morning');
    this.validateQuarterLiters(dto.evening, 'evening');
    const totalLiters = Number((dto.morning + dto.evening).toFixed(2));
    const ratePerLiter = Number(customer.ratePerLiter || process.env.MILK_RATE || 75);
    const delivery = await new this.milkDeliveryModel({
      customerId: customer._id,
      date: startOfFarmDate(dto.date),
      morning: dto.morning,
      evening: dto.evening,
      totalLiters,
      ratePerLiter,
      amount: this.roundMoney(totalLiters * ratePerLiter),
    }).save();
    await this.recalculateExistingBill(customer._id.toString(), dto.date);
    return delivery;
  }

  async findAll(filters: { date?: string; customerId?: string } = {}) {
    const query: Record<string, any> = {};
    if (filters.date) {
      const parsedDate = DateTime.fromISO(filters.date, { zone: getFarmTimezone() });
      if (!/^\d{4}-\d{2}-\d{2}$/.test(filters.date) || !parsedDate.isValid || parsedDate.toFormat('yyyy-MM-dd') !== filters.date) {
        throw new BadRequestException('date must be a valid date in YYYY-MM-DD format');
      }
      query.date = { $gte: startOfFarmDate(filters.date), $lt: startOfNextFarmDate(filters.date) };
    }
    if (filters.customerId) {
      if (!Types.ObjectId.isValid(filters.customerId)) throw new BadRequestException('Invalid customerId');
      query.customerId = new Types.ObjectId(filters.customerId);
    }
    return this.milkDeliveryModel.find(query)
      .populate('customerId', 'name mobile ratePerLiter active')
      .sort({ date: -1, createdAt: -1 }).exec();
  }

  async findOne(id: string) {
    const delivery = await this.milkDeliveryModel.findById(id)
      .populate('customerId', 'name mobile address ratePerLiter active');
    if (!delivery) throw new NotFoundException('Milk delivery record not found');
    return delivery;
  }

  async update(id: string, dto: UpdateMilkDeliveryDto) {
    const delivery = await this.milkDeliveryModel.findById(id);
    if (!delivery) throw new NotFoundException('Milk delivery record not found');
    const oldDate = toFarmDateString(delivery.date);
    const oldCustomerId = delivery.customerId.toString();
    if (dto.morning !== undefined) {
      this.validateQuarterLiters(dto.morning, 'morning');
      delivery.morning = dto.morning;
    }
    if (dto.evening !== undefined) {
      this.validateQuarterLiters(dto.evening, 'evening');
      delivery.evening = dto.evening;
    }
    if (dto.date !== undefined) delivery.date = startOfFarmDate(dto.date);
    if (dto.ratePerLiter !== undefined) {
      if (!Number.isFinite(dto.ratePerLiter) || dto.ratePerLiter <= 0 || dto.ratePerLiter > 100000) {
        throw new BadRequestException('ratePerLiter must be greater than 0 and no more than 100000');
      }
      delivery.ratePerLiter = Number(dto.ratePerLiter);
    }
    delivery.totalLiters = Number((delivery.morning + delivery.evening).toFixed(2));
    delivery.amount = this.roundMoney(delivery.totalLiters * delivery.ratePerLiter);
    const saved = await delivery.save();
    await this.recalculateExistingBill(oldCustomerId, oldDate);
    const newDate = toFarmDateString(saved.date);
    await this.recalculateExistingBill(saved.customerId.toString(), newDate);
    return saved;
  }

  async remove(id: string) {
    const delivery = await this.milkDeliveryModel.findById(id);
    if (!delivery) throw new NotFoundException('Milk delivery record not found');
    const customerId = delivery.customerId.toString();
    const date = toFarmDateString(delivery.date);
    await this.milkDeliveryModel.deleteOne({ _id: delivery._id });
    await this.recalculateExistingBill(customerId, date);
    return { message: 'Milk delivery record deleted successfully' };
  }

  private validateQuarterLiters(value: number, field: string) {
    if (!Number.isFinite(value) || value < 0 || value > 10 || Math.abs(value * 4 - Math.round(value * 4)) > 1e-8) {
      throw new BadRequestException(`${field} must be between 0 and 10 litres in 0.25 L increments`);
    }
  }

  private roundMoney(value: number) { return Math.round((value + Number.EPSILON) * 100) / 100; }

  // Only an existing bill is recalculated here. A first bill remains an explicit
  // user action from Monthly Billing; edits never create a bill unexpectedly.
  private async recalculateExistingBill(customerId: string, farmDate: string) {
    const date = DateTime.fromISO(farmDate, { zone: getFarmTimezone() });
    if (!date.isValid) return;
    const year = date.year;
    const month = date.month;
    const bill = await this.billModel.findOne({ customerId: new Types.ObjectId(customerId), year, month });
    if (!bill) return;
    const start = startOfFarmMonth(year, month);
    const end = startOfNextFarmMonth(year, month);
    const deliveries = await this.milkDeliveryModel.find({ customerId: new Types.ObjectId(customerId), date: { $gte: start, $lt: end } });
    const customer = await this.customerModel.findById(customerId);
    const fallbackRate = Number(customer?.ratePerLiter || process.env.MILK_RATE || 75);
    const totalLiters = Number(deliveries.reduce((sum, item) => sum + Number(item.totalLiters || 0), 0).toFixed(2));
    const totalAmount = this.roundMoney(deliveries.reduce((sum, item) => sum + Number(item.totalLiters || 0) * Number(item.ratePerLiter || fallbackRate), 0));
    const payments = await this.paymentModel.find({ billId: bill._id });
    const paidAmount = this.roundMoney(payments.reduce((sum, item) => sum + Number(item.amount || 0), 0));
    const pendingAmount = this.roundMoney(Math.max(0, totalAmount - paidAmount));
    const creditAmount = this.roundMoney(Math.max(0, paidAmount - totalAmount));
    const weightedRate = totalLiters > 0 ? totalAmount / totalLiters : 0;
    bill.totalLiters = totalLiters;
    bill.ratePerLiter = Number(weightedRate.toFixed(4));
    bill.totalAmount = totalAmount;
    bill.paidAmount = paidAmount;
    bill.pendingAmount = pendingAmount;
    bill.creditAmount = creditAmount;
    bill.status = pendingAmount === 0 ? 'PAID' : paidAmount > 0 ? 'PARTIAL' : 'PENDING';
    await bill.save();
  }
}
