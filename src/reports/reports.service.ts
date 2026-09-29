import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import {
  MilkDelivery,
  MilkDeliveryDocument,
} from '../milk-delivery/schema/milk-delivery.schema';

import {
  Animal,
  AnimalDocument,
} from '../animal/schema/animal.schema';
import { MilkProduction, MilkProductionDocument } from '../milk-production/schema/milk-production.schema';
import {
  MonthlyBill,
  MonthlyBillDocument,
} from '../bills/schema/monthly-bill.schema';
import { startOfFarmDate, startOfFarmMonth, startOfNextFarmDate } from '../common/utils/farm-date.util';
@Injectable()
export class ReportsService {
constructor(
  @InjectModel(MilkProduction.name)
  private readonly productionModel: Model<MilkProductionDocument>,
  
@InjectModel(MonthlyBill.name)
private readonly monthlyBillModel: Model<MonthlyBillDocument>,
  @InjectModel(Animal.name)
  private readonly animalModel: Model<AnimalDocument>,

  @InjectModel(MilkDelivery.name)
  private readonly milkDeliveryModel: Model<MilkDeliveryDocument>,
) {}

  async getDailyProduction(dateString: string) {
    // -----------------------------
    // 1. Create date range
    // -----------------------------
const startDate = startOfFarmDate(dateString);
const endDate = startOfNextFarmDate(dateString);

    // -----------------------------
    // 2. Get active animal count
    // -----------------------------
    const totalAnimals = await this.animalModel.countDocuments({
      status: 'ACTIVE',
    });

    // -----------------------------
    // 3. Get production records
    // -----------------------------
    const productions = await this.productionModel
      .find({
        date: {
          $gte: startDate,
          $lt: endDate,
        },
      })
      .populate(
        'animalId',
        'tagNumber name breed gender status',
      )
      .sort({ date: 1 });

    // -----------------------------
    // 4. Calculate summary
    // -----------------------------
    const morningLiters = productions.reduce(
      (sum, production) => sum + production.morning,
      0,
    );

    const eveningLiters = productions.reduce(
      (sum, production) => sum + production.evening,
      0,
    );

    const totalLiters = productions.reduce(
      (sum, production) => sum + production.totalLiters,
      0,
    );

    // -----------------------------
    // 5. Return report
    // -----------------------------
    return {
      date: dateString,

      summary: {
        totalAnimals,
        animalsProduced: productions.length,
        morningLiters,
        eveningLiters,
        totalLiters,
      },

      animals: productions.map((production) => {
        const animal = production.animalId as any;

        return {
          animalId: animal?._id,
          tagNumber: animal?.tagNumber,
          name: animal?.name,
          breed: animal?.breed,
          morning: production.morning,
          evening: production.evening,
          totalLiters: production.totalLiters,
        };
      }),
    };
  }
  async getMonthlyProduction(year: number, month: number) {
  // Month is 1-12
const start = startOfFarmMonth(year, month);
const end = startOfFarmMonth(year, month + 1); 

  // -----------------------------
  // 1. Active animals
  // -----------------------------
  const totalAnimals = await this.animalModel.countDocuments({
    status: 'ACTIVE',
  });

  // -----------------------------
  // 2. Get production records
  // -----------------------------
  const productions = await this.productionModel
    .find({
      date: {
        $gte: start,
        $lt: end,
      },
    })
    .populate(
      'animalId',
      'tagNumber name breed gender status',
    )
    .sort({ date: 1 });

  // -----------------------------
  // 3. Overall totals
  // -----------------------------
  const morningLiters = productions.reduce(
    (sum, production) => sum + production.morning,
    0,
  );

  const eveningLiters = productions.reduce(
    (sum, production) => sum + production.evening,
    0,
  );

  const totalLiters = productions.reduce(
    (sum, production) => sum + production.totalLiters,
    0,
  );

  // Number of unique dates with production
  const productionDates = new Set(
    productions.map((production) =>
      production.date.toISOString().split('T')[0],
    ),
  );

  const totalProductionDays = productionDates.size;

  const averagePerDay =
    totalProductionDays > 0
      ? totalLiters / totalProductionDays
      : 0;

  // -----------------------------
  // 4. Group production by animal
  // -----------------------------
  const animalMap = new Map<
    string,
    {
      animalId: any;
      tagNumber: string;
      name?: string;
      morningLiters: number;
      eveningLiters: number;
      totalLiters: number;
      productionDays: number;
    }
  >();

  for (const production of productions) {
    const animal = production.animalId as any;

    if (!animal?._id) {
      continue;
    }

    const animalId = animal._id.toString();

    if (!animalMap.has(animalId)) {
      animalMap.set(animalId, {
        animalId: animal._id,
        tagNumber: animal.tagNumber,
        name: animal.name,
        morningLiters: 0,
        eveningLiters: 0,
        totalLiters: 0,
        productionDays: 0,
      });
    }

    const data = animalMap.get(animalId)!;

    data.morningLiters += production.morning;
    data.eveningLiters += production.evening;
    data.totalLiters += production.totalLiters;
    data.productionDays += 1;
  }

  // -----------------------------
  // 5. Prepare animal report
  // -----------------------------
  const animals = Array.from(animalMap.values()).map(
    (animal) => ({
      animalId: animal.animalId,
      tagNumber: animal.tagNumber,
      name: animal.name,

      morningLiters: animal.morningLiters,
      eveningLiters: animal.eveningLiters,
      totalLiters: animal.totalLiters,

      productionDays: animal.productionDays,

      averagePerDay:
        animal.productionDays > 0
          ? animal.totalLiters / animal.productionDays
          : 0,
    }),
  );

  // -----------------------------
  // 6. Return report
  // -----------------------------
  return {
    year,
    month,

    summary: {
      totalAnimals,
      totalProductionDays,

      morningLiters,
      eveningLiters,
      totalLiters,

      averagePerDay,
    },

    animals,
  };
}
async getCustomerConsumption(year: number, month: number) {
  // --------------------------------
  // 1. Create month date range
  // --------------------------------
  const start =startOfFarmMonth(year, month);
  const end = startOfFarmMonth(year, month + 1); 


  // --------------------------------
  // 2. Get milk deliveries
  // --------------------------------
  const deliveries = await this.milkDeliveryModel
    .find({
      date: {
        $gte: start,
        $lt: end,
      },
    })
    .populate(
      'customerId',
      'name mobile address ratePerLiter active',
    )
    .sort({ date: 1 });

  // --------------------------------
  // 3. Overall totals
  // --------------------------------
  const morningLiters = deliveries.reduce(
    (sum, delivery) => sum + delivery.morning,
    0,
  );

  const eveningLiters = deliveries.reduce(
    (sum, delivery) => sum + delivery.evening,
    0,
  );

  const totalLiters = deliveries.reduce(
    (sum, delivery) => sum + delivery.totalLiters,
    0,
  );

  const totalAmount = deliveries.reduce(
    (sum, delivery) => sum + delivery.amount,
    0,
  );

  // --------------------------------
  // 4. Group by customer
  // --------------------------------
  const customerMap = new Map<
    string,
    {
      customerId: any;
      name: string;
      mobile: string;
      morningLiters: number;
      eveningLiters: number;
      totalLiters: number;
      totalAmount: number;
      deliveryDays: number;
    }
  >();

  for (const delivery of deliveries) {
    const customer = delivery.customerId as any;

    if (!customer?._id) {
      continue;
    }

    const customerId = customer._id.toString();

    if (!customerMap.has(customerId)) {
      customerMap.set(customerId, {
        customerId: customer._id,
        name: customer.name,
        mobile: customer.mobile,
        morningLiters: 0,
        eveningLiters: 0,
        totalLiters: 0,
        totalAmount: 0,
        deliveryDays: 0,
      });
    }

    const data = customerMap.get(customerId)!;

    data.morningLiters += delivery.morning;
    data.eveningLiters += delivery.evening;
    data.totalLiters += delivery.totalLiters;
    data.totalAmount += delivery.amount;
    data.deliveryDays += 1;
  }

  // --------------------------------
  // 5. Prepare customer report
  // --------------------------------
  const customers = Array.from(customerMap.values()).map(
    (customer) => ({
      customerId: customer.customerId,
      name: customer.name,
      mobile: customer.mobile,

      morningLiters: customer.morningLiters,
      eveningLiters: customer.eveningLiters,
      totalLiters: customer.totalLiters,
      totalAmount: customer.totalAmount,

      deliveryDays: customer.deliveryDays,

      averagePerDeliveryDay:
        customer.deliveryDays > 0
          ? customer.totalLiters / customer.deliveryDays
          : 0,
    }),
  );

  // --------------------------------
  // 6. Return report
  // --------------------------------
  return {
    year,
    month,

    summary: {
      totalCustomers: customers.length,

      totalDeliveryRecords: deliveries.length,

      morningLiters,
      eveningLiters,
      totalLiters,

      totalAmount,
    },

    customers,
  };
}
async getFinancialReport(year: number, month: number) {
  const bills = await this.monthlyBillModel
    .find({ year, month })
    .populate(
      'customerId',
      'name mobile address',
    )
    .sort({ pendingAmount: -1 });

  const totalBilling = bills.reduce(
    (sum, bill) => sum + bill.totalAmount,
    0,
  );

  const totalCollected = bills.reduce(
    (sum, bill) => sum + bill.paidAmount,
    0,
  );

  const totalPending = bills.reduce(
    (sum, bill) => sum + bill.pendingAmount,
    0,
  );

  const paidCustomers = bills.filter(
    (bill) => bill.status === 'PAID',
  ).length;

  const partialCustomers = bills.filter(
    (bill) => bill.status === 'PARTIAL',
  ).length;

  const pendingCustomers = bills.filter(
    (bill) => bill.pendingAmount > 0,
  ).length;

  return {
    year,
    month,

    summary: {
      totalCustomers: bills.length,
      totalBilling,
      totalCollected,
      totalPending,
      paidCustomers,
      partialCustomers,
      pendingCustomers,
    },

    customers: bills.map((bill) => {
      const customer = bill.customerId as any;

      return {
        customerId: customer?._id,
        name: customer?.name,
        mobile: customer?.mobile,

        totalLiters: bill.totalLiters,

        totalAmount: bill.totalAmount,
        paidAmount: bill.paidAmount,
        pendingAmount: bill.pendingAmount,

        status: bill.status,
      };
    }),
  };
}
}