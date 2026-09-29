import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import {
  Customer,
  CustomerDocument,
} from './schema/customer.schema';

import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { startOfFarmDate } from '../common/utils/farm-date.util';

@Injectable()
export class CustomersService {
  constructor(
    @InjectModel(Customer.name)
    private readonly customerModel: Model<CustomerDocument>,
  ) {}

  async create(createCustomerDto: CreateCustomerDto) {
    const customer = new this.customerModel({
      ...createCustomerDto,

      startDate:startOfFarmDate(createCustomerDto.startDate),

      ratePerLiter: Number(process.env.MILK_RATE || 75),

      active: true,
    });

    return customer.save();
  }

  async findAll() {
    return this.customerModel
      .find()
      .sort({ createdAt: -1 })
      .exec();
  }

  async findActive() {
    return this.customerModel
      .find({ active: true })
      .sort({ name: 1 })
      .exec();
  }

  async findOne(id: string) {
  const customer = await this.customerModel.findById(id);

  if (!customer) {
    throw new NotFoundException('Customer not found');
  }

  return customer;
}
async update(
  id: string,
  dto: UpdateCustomerDto,
) {
  const customer =
    await this.customerModel.findById(id);

  if (!customer) {
    throw new NotFoundException(
      'Customer not found',
    );
  }

  if (dto.name !== undefined) {
    customer.name = dto.name;
  }

  if (dto.mobile !== undefined) {
    customer.mobile = dto.mobile;
  }

  if (dto.address !== undefined) {
    customer.address = dto.address;
  }

  if (dto.morning !== undefined) {
    customer.morning = dto.morning;
  }

  if (dto.evening !== undefined) {
    customer.evening = dto.evening;
  }

  if (dto.startDate !== undefined) {
    customer.startDate = startOfFarmDate(dto.startDate)
  }

  return customer.save();
}
async deactivate(id: string) {
  const customer =
    await this.customerModel.findById(id);

  if (!customer) {
    throw new NotFoundException(
      'Customer not found',
    );
  }

  customer.active = false;

  return customer.save();
}
async activate(id: string) {
  const customer =
    await this.customerModel.findById(id);

  if (!customer) {
    throw new NotFoundException(
      'Customer not found',
    );
  }

  customer.active = true;

  return customer.save();
}
}