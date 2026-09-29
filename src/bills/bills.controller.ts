import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import { BillsService } from './bills.service';

import { CreateMonthlyBillDto } from './dto/create-monthly-bill.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/schema/user.schema';
import { CsrfGuard } from '../auth/guards/csrf.guard';

@Controller('bills')

export class BillsController {
  constructor(
    private readonly billsService:
      BillsService,
  ) {}
@UseGuards(JwtAuthGuard, CsrfGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.MANAGER)
  @Post('generate')
  generateBill(
    @Body()
    dto: CreateMonthlyBillDto,
  ) {
    return this.billsService.generateMonthlyBill(dto);
  }
  @UseGuards(JwtAuthGuard, RolesGuard)
@Roles(
  UserRole.ADMIN,
  UserRole.MANAGER,
)
  @Get('monthly')
async getMonthlySummary(
  @Query('year') year: string,
  @Query('month') month: string,
) {
  return this.billsService.getMonthlySummary(
    Number(year),
    Number(month),
  );
}
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(
  UserRole.ADMIN,
  UserRole.MANAGER,
)
@Get('pending')
async getPendingBills(
  @Query('year') year?: string,
  @Query('month') month?: string,
) {
  return this.billsService.getPendingBills(
    Number(year) ,
    Number(month),
  );
}
}