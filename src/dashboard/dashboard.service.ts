import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { Customer } from '../customers/schema/customer.schema';
import { Animal } from '../animal/schema/animal.schema';
import { MilkProduction } from '../milk-production/schema/milk-production.schema';
import { MilkDelivery } from '../milk-delivery/schema/milk-delivery.schema';
import { MonthlyBill } from '../bills/schema/monthly-bill.schema';
import { startOfFarmMonth } from '../common/utils/farm-date.util';

@Injectable()
export class DashboardService {
  constructor(
    @InjectModel(Customer.name)
    private readonly customerModel: Model<Customer>,

    @InjectModel(Animal.name)
    private readonly animalModel: Model<Animal>,

    @InjectModel(MilkProduction.name)
    private readonly milkProductionModel: Model<MilkProduction>,

    @InjectModel(MilkDelivery.name)
    private readonly milkDeliveryModel: Model<MilkDelivery>,

    @InjectModel(MonthlyBill.name)
    private readonly billModel: Model<MonthlyBill>,
  ) {}

  async getDashboard(year: number, month: number) {
  const startDate = startOfFarmMonth(year, month);
const endDate = startOfFarmMonth(year,month + 1);

    /*
     * -------------------------
     * CUSTOMERS
     * -------------------------
     */
    const totalCustomers = await this.customerModel.countDocuments();

    const activeCustomers = await this.customerModel.countDocuments({
      active: true,
    });

    /*
     * -------------------------
     * ANIMALS
     * -------------------------
     */
    const totalAnimals = await this.animalModel.countDocuments();

    const activeAnimals = await this.animalModel.countDocuments({
      status: 'ACTIVE',
    });

    /*
     * -------------------------
     * MILK PRODUCTION
     * -------------------------
     */
    const production = await this.milkProductionModel.aggregate([
      {
        $match: {
          date: {
            $gte: startDate,
            $lt: endDate,
          },
        },
      },
      {
        $group: {
          _id: null,
          morningLiters: { $sum: '$morning' },
          eveningLiters: { $sum: '$evening' },
          totalLiters: { $sum: '$totalLiters' },
        },
      },
    ]);

    const productionData = production[0] || {
      morningLiters: 0,
      eveningLiters: 0,
      totalLiters: 0,
    };

    /*
     * -------------------------
     * MILK DELIVERY
     * -------------------------
     */
    const delivery = await this.milkDeliveryModel.aggregate([
      {
        $match: {
          date: {
            $gte: startDate,
            $lt: endDate,
          },
        },
      },
      {
        $group: {
          _id: null,
          morningLiters: { $sum: '$morning' },
          eveningLiters: { $sum: '$evening' },
          totalLiters: { $sum: '$totalLiters' },
          totalAmount: { $sum: '$amount' },
        },
      },
    ]);

    const deliveryData = delivery[0] || {
      morningLiters: 0,
      eveningLiters: 0,
      totalLiters: 0,
      totalAmount: 0,
    };

    /*
     * -------------------------
     * BILLING
     * -------------------------
     */
    const billing = await this.billModel.aggregate([
      {
        $match: {
          year,
          month,
        },
      },
      {
        $group: {
          _id: null,
          totalBilling: { $sum: '$totalAmount' },
          totalCollected: { $sum: '$paidAmount' },
          totalPending: { $sum: '$pendingAmount' },

          paidCustomers: {
            $sum: {
              $cond: [{ $eq: ['$status', 'PAID'] }, 1, 0],
            },
          },

          partialCustomers: {
            $sum: {
              $cond: [{ $eq: ['$status', 'PARTIAL'] }, 1, 0],
            },
          },

          pendingCustomers: {
            $sum: {
              $cond: [{ $eq: ['$status', 'PENDING'] }, 1, 0],
            },
          },
        },
      },
    ]);

    const billingData = billing[0] || {
      totalBilling: 0,
      totalCollected: 0,
      totalPending: 0,
      paidCustomers: 0,
      partialCustomers: 0,
      pendingCustomers: 0,
    };

    /*
     * -------------------------
     * RESPONSE
     * -------------------------
     */

    return {
      period: {
        year,
        month,
      },

      customers: {
        total: totalCustomers,
        active: activeCustomers,
      },

      animals: {
        total: totalAnimals,
        active: activeAnimals,
      },

      production: {
        morningLiters: productionData.morningLiters,
        eveningLiters: productionData.eveningLiters,
        totalLiters: productionData.totalLiters,
      },

      delivery: {
        morningLiters: deliveryData.morningLiters,
        eveningLiters: deliveryData.eveningLiters,
        totalLiters: deliveryData.totalLiters,
        totalAmount: deliveryData.totalAmount,
      },

      billing: {
        totalBilling: billingData.totalBilling,
        totalCollected: billingData.totalCollected,
        totalPending: billingData.totalPending,
      },

      payments: {
        paidCustomers: billingData.paidCustomers,
        partialCustomers: billingData.partialCustomers,
        pendingCustomers: billingData.pendingCustomers,
      },
    };
  }
}