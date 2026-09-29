import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';

import { Model } from 'mongoose';

import {
  Customer,
  CustomerDocument,
} from '../customers/schema/customer.schema';

import {
  MilkDelivery,
  MilkDeliveryDocument,
} from './schema/milk-delivery.schema';

import { CreateMilkDeliveryDto } from './dto/create-milk-delivery.dto';
import { UpdateMilkDeliveryDto } from './dto/update-milk-delivery.dto';
import { startOfFarmDate } from '../common/utils/farm-date.util';

@Injectable()
export class MilkDeliveryService {
  constructor(
    @InjectModel(MilkDelivery.name)
    private readonly milkDeliveryModel:
      Model<MilkDeliveryDocument>,

    @InjectModel(Customer.name)
    private readonly customerModel:
      Model<CustomerDocument>,
  ) {}

  async create(
    dto: CreateMilkDeliveryDto,
  ) {
    const customer =
      await this.customerModel.findById(
        dto.customerId,
      );

    if (!customer) {
      throw new NotFoundException(
        'Customer not found',
      );
    }

    if (!customer.active) {
      throw new BadRequestException(
        'Customer is inactive',
      );
    }

    const totalLiters =
      dto.morning + dto.evening;

    const ratePerLiter =
      customer.ratePerLiter;

    const amount =
      totalLiters * ratePerLiter;

    const delivery =
      new this.milkDeliveryModel({
        customerId: customer._id,

        date: startOfFarmDate(dto.date),

        morning: dto.morning,

        evening: dto.evening,

        totalLiters,

        ratePerLiter,

        amount,
      });

    return delivery.save();
  }

  async findAll() {
    return this.milkDeliveryModel
      .find()
      .populate(
        'customerId',
        'name mobile',
      )
      .sort({
        date: -1,
      })
      .exec();
  }
  async findOne(id: string) {
  const delivery = await this.milkDeliveryModel
    .findById(id)
    .populate(
      'customerId',
      'name mobile address ratePerLiter active',
    );

  if (!delivery) {
    throw new NotFoundException(
      'Milk delivery record not found',
    );
  }

  return delivery;
}
async update(
  id: string,
  dto: UpdateMilkDeliveryDto,
) {
  const delivery = await this.milkDeliveryModel.findById(id);

  if (!delivery) {
    throw new NotFoundException(
      'Milk delivery record not found',
    );
  }

  // -----------------------------
  // Update date
  // -----------------------------
 if (dto.date !== undefined) {
  delivery.date = startOfFarmDate(dto.date);
}

  // -----------------------------
  // Update quantities
  // -----------------------------
  if (dto.morning !== undefined) {
    delivery.morning = dto.morning;
  }

  if (dto.evening !== undefined) {
    delivery.evening = dto.evening;
  }

  // -----------------------------
  // Recalculate totals
  // -----------------------------
  delivery.totalLiters =
    delivery.morning + delivery.evening;

  delivery.amount =
    delivery.totalLiters * delivery.ratePerLiter;

  return delivery.save();
}
async remove(id: string) {
  const delivery =
    await this.milkDeliveryModel.findByIdAndDelete(id);

  if (!delivery) {
    throw new NotFoundException(
      'Milk delivery record not found',
    );
  }

  return {
    message: 'Milk delivery record deleted successfully',
  };
}
}