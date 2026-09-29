import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';

import { AnimalsService } from './animals.service';
import { CreateAnimalDto } from './dto/create-animal.dto';
import { UpdateAnimalDto } from './dto/update-animal.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/schema/user.schema';
import { CsrfGuard } from '../auth/guards/csrf.guard';

@Controller('animals')

export class AnimalsController {
  constructor(
    private readonly animalsService: AnimalsService,
  ) {}
@UseGuards(JwtAuthGuard, CsrfGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.MANAGER)
  @Post()
  async create(
    @Body() dto: CreateAnimalDto,
  ) {
    return this.animalsService.create(dto);
  }
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(
  UserRole.ADMIN,
  UserRole.MANAGER,
)
  @Get()
  async findAll() {
    return this.animalsService.findAll();
  }
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(
  UserRole.ADMIN,
  UserRole.MANAGER,
)
  @Get('active')
  async findActive() {
    return this.animalsService.findActive();
  }
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(
  UserRole.ADMIN,
  UserRole.MANAGER,
)
  @Get(':id')
  async findOne(
    @Param('id') id: string,
  ) {
    return this.animalsService.findOne(id);
  }
@UseGuards(JwtAuthGuard, CsrfGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.MANAGER)
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateAnimalDto,
  ) {
    return this.animalsService.update(
      id,
      dto,
    );
  }
@UseGuards(JwtAuthGuard, CsrfGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.MANAGER)
  @Patch(':id/status/:status')
  async updateStatus(
    @Param('id') id: string,
    @Param('status')
    status: 'ACTIVE' | 'SOLD' | 'DEAD',
  ) {
    return this.animalsService.updateStatus(
      id,
      status,
    );
  }
}