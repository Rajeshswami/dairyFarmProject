import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';

import { MilkDeliveryService } from './milk-delivery.service';

import { CreateMilkDeliveryDto } from './dto/create-milk-delivery.dto';
import { UpdateMilkDeliveryDto } from './dto/update-milk-delivery.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/schema/user.schema';
import { CsrfGuard } from '../auth/guards/csrf.guard';

@Controller('milk-delivery')
export class MilkDeliveryController {
  constructor(
    private readonly milkDeliveryService:
      MilkDeliveryService,
  ) {}
@UseGuards(JwtAuthGuard, CsrfGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF)
  @Post()
  create(
    @Body()
    createMilkDeliveryDto: CreateMilkDeliveryDto,
  ) {
    return this.milkDeliveryService.create(
      createMilkDeliveryDto,
    );
  }
  @UseGuards(JwtAuthGuard, RolesGuard)
@Roles(
  UserRole.ADMIN,
  UserRole.MANAGER,
  UserRole.STAFF,
)
  @Get()
  findAll() {
    return this.milkDeliveryService.findAll();
  }
    @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(
    UserRole.ADMIN,
    UserRole.MANAGER,
    UserRole.STAFF,
  )
  @Get(':id')
async findOne(@Param('id') id: string) {
  return this.milkDeliveryService.findOne(id);
}

@UseGuards(JwtAuthGuard, CsrfGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF)
@Put(':id')
async update(
  @Param('id') id: string,
  @Body() dto: UpdateMilkDeliveryDto,
) {
  return this.milkDeliveryService.update(id, dto);
}
@UseGuards(JwtAuthGuard, CsrfGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF)
@Delete(':id')
async remove(@Param('id') id: string) {
  return this.milkDeliveryService.remove(id);
}
}