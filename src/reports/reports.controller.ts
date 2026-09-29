import {
  Controller,
  Get,
  Query,
  BadRequestException,
  UseGuards,
} from '@nestjs/common';

import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/schema/user.schema';

@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(
  UserRole.ADMIN,
  UserRole.MANAGER,
)
export class ReportsController {
  constructor(
    private readonly reportsService: ReportsService,
  ) {}

  @Get('daily-production')
  async getDailyProduction(
    @Query('date') date?: string,
  ) {
    if (!date) {
      throw new BadRequestException(
        'date query parameter is required',
      );
    }

    return this.reportsService.getDailyProduction(date);
  }
  @Get('monthly-production')
async getMonthlyProduction(
  @Query('year') year?: string,
  @Query('month') month?: string,
) {
  if (!year || !month) {
    throw new BadRequestException(
      'year and month query parameters are required',
    );
  }

  const yearNumber = Number(year);
  const monthNumber = Number(month);

  if (
    !Number.isInteger(yearNumber) ||
    !Number.isInteger(monthNumber) ||
    monthNumber < 1 ||
    monthNumber > 12
  ) {
    throw new BadRequestException(
      'Invalid year or month',
    );
  }

  return this.reportsService.getMonthlyProduction(
    yearNumber,
    monthNumber,
  );
}
@Get('customer-consumption')
async getCustomerConsumption(
  @Query('year') year?: string,
  @Query('month') month?: string,
) {
  if (!year || !month) {
    throw new BadRequestException(
      'year and month query parameters are required',
    );
  }

  const yearNumber = Number(year);
  const monthNumber = Number(month);

  if (
    !Number.isInteger(yearNumber) ||
    !Number.isInteger(monthNumber) ||
    monthNumber < 1 ||
    monthNumber > 12
  ) {
    throw new BadRequestException(
      'Invalid year or month',
    );
  }

  return this.reportsService.getCustomerConsumption(
    yearNumber,
    monthNumber,
  );
}
@Get('financial')
async getFinancialReport(
  @Query('year') year?: string,
  @Query('month') month?: string,
) {
  if (!year || !month) {
    throw new BadRequestException(
      'year and month query parameters are required',
    );
  }

  const yearNumber = Number(year);
  const monthNumber = Number(month);

  if (
    !Number.isInteger(yearNumber) ||
    !Number.isInteger(monthNumber) ||
    monthNumber < 1 ||
    monthNumber > 12
  ) {
    throw new BadRequestException(
      'Invalid year or month',
    );
  }

  return this.reportsService.getFinancialReport(
    yearNumber,
    monthNumber,
  );
}
}