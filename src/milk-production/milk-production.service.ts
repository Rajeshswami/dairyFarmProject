import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import {
  MilkProduction,
  MilkProductionDocument,
} from './schema/milk-production.schema';

import {
  Animal,
  AnimalDocument,
} from '../animal/schema/animal.schema';

import { CreateMilkProductionDto } from './dto/create-milk-production.dto';
import { UpdateMilkProductionDto } from './dto/update-milk-production.dto';
import { getFarmTimezone, startOfFarmDate } from '../common/utils/farm-date.util';
import { DateTime } from 'luxon';

@Injectable()
export class MilkProductionService {
  constructor(
    @InjectModel(MilkProduction.name)
    private readonly productionModel:
      Model<MilkProductionDocument>,

    @InjectModel(Animal.name)
    private readonly animalModel:
      Model<AnimalDocument>,
  ) {}

  async create(
    dto: CreateMilkProductionDto,
  ) {
    // Check animal
    const animal =
      await this.animalModel.findById(
        dto.animalId,
      );

    if (!animal) {
      throw new NotFoundException(
        'Animal not found',
      );
    }

    // Only active animals can have production
    if (animal.status !== 'ACTIVE') {
      throw new BadRequestException(
        'Milk production can only be recorded for an active animal',
      );
    }

    // Normalize date to day
    const date =startOfFarmDate(dto.date)

    // Check duplicate
    const existing =
      await this.productionModel.findOne({
        animalId: dto.animalId,
        date,
      });

    if (existing) {
      throw new BadRequestException(
        'Milk production already exists for this animal on this date',
      );
    }

    const totalLiters =
      dto.morning + dto.evening;

    const production =
      new this.productionModel({
        animalId: dto.animalId,
        date,
        morning: dto.morning,
        evening: dto.evening,
        totalLiters,
        note: dto.note,
      });

    return production.save();
  }

  async findAll() {
    return this.productionModel
      .find()
      .populate(
        'animalId',
        'tagNumber name breed gender status',
      )
      .sort({ date: -1 });
  }

  async findOne(id: string) {
    const production =
      await this.productionModel
        .findById(id)
        .populate(
          'animalId',
          'tagNumber name breed gender status',
        );

    if (!production) {
      throw new NotFoundException(
        'Milk production record not found',
      );
    }

    return production;
  }

  async findByAnimal(
    animalId: string,
  ) {
    const animal =
      await this.animalModel.findById(
        animalId,
      );

    if (!animal) {
      throw new NotFoundException(
        'Animal not found',
      );
    }

    return this.productionModel
      .find({ animalId })
      .sort({ date: -1 });
  }

  async findByDate(dateString: string) {
    const start =startOfFarmDate(dateString)

    const end = DateTime.fromJSDate(start, { zone: getFarmTimezone() })
  .plus({ days: 1 })
  .toJSDate();

    return this.productionModel
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
      .sort({ 'animalId.tagNumber': 1 });
  }

  async update(
    id: string,
    dto: UpdateMilkProductionDto,
  ) {
    const production =
      await this.productionModel.findById(id);

    if (!production) {
      throw new NotFoundException(
        'Milk production record not found',
      );
    }

    if (dto.date !== undefined) {
      const newDate =startOfFarmDate(dto.date)

      const duplicate =
        await this.productionModel.findOne({
          animalId: production.animalId,
          date: newDate,
          _id: { $ne: id },
        });

      if (duplicate) {
        throw new BadRequestException(
          'Milk production already exists for this animal on this date',
        );
      }

      production.date = newDate;
    }

    if (dto.morning !== undefined) {
      production.morning = dto.morning;
    }

    if (dto.evening !== undefined) {
      production.evening = dto.evening;
    }

    if (dto.note !== undefined) {
      production.note = dto.note;
    }

    production.totalLiters =
      production.morning +
      production.evening;

    return production.save();
  }

  async remove(id: string) {
    const production =
      await this.productionModel.findByIdAndDelete(
        id,
      );

    if (!production) {
      throw new NotFoundException(
        'Milk production record not found',
      );
    }

    return {
      message:
        'Milk production record deleted successfully',
    };
  }
}