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

import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/schema/user.schema';
import { CsrfGuard } from '../auth/guards/csrf.guard';

@Controller('customers')
export class CustomersController {
  constructor(
    private readonly customersService: CustomersService,
  ) {}
@UseGuards(JwtAuthGuard, CsrfGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.MANAGER)
  @Post()
  create(@Body() createCustomerDto: CreateCustomerDto) {
    return this.customersService.create(createCustomerDto);
  }
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(
  UserRole.ADMIN,
  UserRole.MANAGER,
  UserRole.STAFF,
)
  @Get()
  findAll() {
    return this.customersService.findAll();
  }
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(
  UserRole.ADMIN,
  UserRole.MANAGER,
  UserRole.STAFF,
)
  @Get('active')
  findActive() {
    return this.customersService.findActive();
  }
  @UseGuards(JwtAuthGuard, RolesGuard)
@Roles(
  UserRole.ADMIN,
  UserRole.MANAGER,
  UserRole.STAFF,
)
  @Get(':id')
async findOne(@Param('id') id: string) {
  return this.customersService.findOne(id);
}
@UseGuards(JwtAuthGuard, CsrfGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.MANAGER)
@Put(':id')
async update(
  @Param('id') id: string,
  @Body() dto: UpdateCustomerDto,
) {
  return this.customersService.update(id, dto);
}
@UseGuards(JwtAuthGuard, CsrfGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.MANAGER)
@Patch(':id/deactivate')
async deactivate(
  @Param('id') id: string,
) {
  return this.customersService.deactivate(id);
}
@UseGuards(JwtAuthGuard, CsrfGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.MANAGER)
@Patch(':id/activate')
async activate(
  @Param('id') id: string,
) {
  return this.customersService.activate(id);
}
}