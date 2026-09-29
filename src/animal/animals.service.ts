import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import {
  Animal,
  AnimalDocument,
} from './schema/animal.schema';

import { CreateAnimalDto } from './dto/create-animal.dto';
import { UpdateAnimalDto } from './dto/update-animal.dto';
import { startOfFarmDate } from '../common/utils/farm-date.util';

@Injectable()
export class AnimalsService {
  constructor(
    @InjectModel(Animal.name)
    private readonly animalModel: Model<AnimalDocument>,
  ) {}

  async create(dto: CreateAnimalDto) {
    const existingAnimal =
      await this.animalModel.findOne({
        tagNumber: dto.tagNumber,
      });

    if (existingAnimal) {
      throw new BadRequestException(
        'Animal with this tag number already exists',
      );
    }

    const animal = new this.animalModel({
      ...dto,

      dateOfBirth: dto.dateOfBirth
        ?startOfFarmDate(dto.dateOfBirth)
        : undefined,

      purchaseDate: dto.purchaseDate
        ? startOfFarmDate(dto.purchaseDate)
        : undefined,

      status: dto.status || 'ACTIVE',
    });

    return animal.save();
  }

  async findAll() {
    return this.animalModel
      .find()
      .sort({ createdAt: -1 });
  }

  async findActive() {
    return this.animalModel
      .find({ status: 'ACTIVE' })
      .sort({ createdAt: -1 });
  }

  async findOne(id: string) {
    const animal =
      await this.animalModel.findById(id);

    if (!animal) {
      throw new NotFoundException(
        'Animal not found',
      );
    }

    return animal;
  }

  async update(
  id: string,
  dto: UpdateAnimalDto,
) {
  const animal =
    await this.animalModel.findById(id);

  if (!animal) {
    throw new NotFoundException(
      'Animal not found',
    );
  }

  // Check duplicate tag number
  if (
    dto.tagNumber !== undefined &&
    dto.tagNumber !== animal.tagNumber
  ) {
    const existingAnimal =
      await this.animalModel.findOne({
        tagNumber: dto.tagNumber,
        _id: { $ne: id },
      });

    if (existingAnimal) {
      throw new BadRequestException(
        'Animal with this tag number already exists',
      );
    }

    animal.tagNumber = dto.tagNumber;
  }

  if (dto.name !== undefined) {
    animal.name = dto.name;
  }

  if (dto.breed !== undefined) {
    animal.breed = dto.breed;
  }

  if (dto.gender !== undefined) {
    animal.gender = dto.gender;
  }

  if (dto.dateOfBirth !== undefined) {
    animal.dateOfBirth =startOfFarmDate(dto.dateOfBirth)
  }

  if (dto.purchaseDate !== undefined) {
    animal.purchaseDate = startOfFarmDate(dto.purchaseDate)
  }

  if (dto.purchasePrice !== undefined) {
    animal.purchasePrice = dto.purchasePrice;
  }

  if (dto.status !== undefined) {
    animal.status = dto.status;
  }

  if (dto.notes !== undefined) {
    animal.notes = dto.notes;
  }

  return animal.save();
}
  async updateStatus(
    id: string,
    status: 'ACTIVE' | 'SOLD' | 'DEAD',
  ) {
    const animal =
      await this.animalModel.findById(id);

    if (!animal) {
      throw new NotFoundException(
        'Animal not found',
      );
    }

    animal.status = status;

    return animal.save();
  }
}