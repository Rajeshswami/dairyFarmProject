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

import { PaymentsService } from './payments.service';

import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/schema/user.schema';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CsrfGuard } from '../auth/guards/csrf.guard';

@Controller('payments')

export class PaymentsController {
  constructor(
    private readonly paymentsService:
      PaymentsService,
  ) {}
@UseGuards(JwtAuthGuard, CsrfGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.MANAGER)
  @Post()
  create(
    @Body()
    dto: CreatePaymentDto,
  ) {
    return this.paymentsService.createPayment(
      dto,
    );
  }
  @UseGuards(JwtAuthGuard, RolesGuard)
@Roles(
  UserRole.ADMIN,
  UserRole.MANAGER,
)
  @Get('customer/:customerId')
async getCustomerPayments(
  @Param('customerId') customerId: string,
) {
  return this.paymentsService.getCustomerPayments(
    customerId,
  );
}
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(
  UserRole.ADMIN,
  UserRole.MANAGER,
)
@Get(':id')
async findOne(@Param('id') id: string) {
  return this.paymentsService.findOne(id);
}
@UseGuards(JwtAuthGuard, CsrfGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.MANAGER)
@Put(':id')
async update(
  @Param('id') id: string,
  @Body() dto: UpdatePaymentDto,
) {
  return this.paymentsService.update(id, dto);
}
@UseGuards(JwtAuthGuard, CsrfGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.MANAGER)
@Delete(':id')
async remove(@Param('id') id: string) {
  return this.paymentsService.remove(id);
}
}