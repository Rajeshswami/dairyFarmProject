import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';

import { MilkProductionService } from './milk-production.service';

import { CreateMilkProductionDto } from './dto/create-milk-production.dto';
import { UpdateMilkProductionDto } from './dto/update-milk-production.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/schema/user.schema';
import { RolesGuard } from '../auth/guards/roles.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CsrfGuard } from '../auth/guards/csrf.guard';

@Controller('milk-production')
export class MilkProductionController {
  constructor(
    private readonly productionService:
      MilkProductionService,
  ) {}
@UseGuards(JwtAuthGuard, CsrfGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF)
  @Post()
  async create(
    @Body() dto: CreateMilkProductionDto,
  ) {
    return this.productionService.create(dto);
  }
  @UseGuards(JwtAuthGuard, RolesGuard)
@Roles(
  UserRole.ADMIN,
  UserRole.MANAGER,
  UserRole.STAFF,
)

  @Get()
  async findAll() {
    return this.productionService.findAll();
  }
  @UseGuards(JwtAuthGuard, RolesGuard)
@Roles(
  UserRole.ADMIN,
  UserRole.MANAGER,
  UserRole.STAFF,
)

  @Get('animal/:animalId')
  async findByAnimal(
    @Param('animalId') animalId: string,
  ) {
    return this.productionService.findByAnimal(
      animalId,
    );
  }
  @UseGuards(JwtAuthGuard, RolesGuard)
@Roles(
  UserRole.ADMIN,
  UserRole.MANAGER,
  UserRole.STAFF,
)

  @Get('date/:date')
  async findByDate(
    @Param('date') date: string,
  ) {
    return this.productionService.findByDate(
      date,
    );
  }
  @UseGuards(JwtAuthGuard, RolesGuard)
@Roles(
  UserRole.ADMIN,
  UserRole.MANAGER,
  UserRole.STAFF,
)

  @Get(':id')
  async findOne(
    @Param('id') id: string,
  ) {
    return this.productionService.findOne(id);
  }
@UseGuards(JwtAuthGuard, CsrfGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF)
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateMilkProductionDto,
  ) {
    return this.productionService.update(
      id,
      dto,
    );
  }
@UseGuards(JwtAuthGuard, CsrfGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF)
  @Delete(':id')
  async remove(
    @Param('id') id: string,
  ) {
    return this.productionService.remove(id);
  }
}