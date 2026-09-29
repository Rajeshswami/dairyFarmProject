import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { startOfFarmDate } from '../common/utils/farm-date.util';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/schema/user.schema';

@Controller('dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(
  UserRole.ADMIN,
  UserRole.MANAGER,
)
export class DashboardController {
  constructor(
    private readonly dashboardService: DashboardService,
  ) {}

  @Get()
  async getDashboard(
    @Query('year') year?: string,
    @Query('month') month?: string,
  ) {

    const currentDate = startOfFarmDate(new Date())

    const selectedYear =
      year !== undefined
        ? Number(year)
        : currentDate.getFullYear();

    const selectedMonth =
      month !== undefined
        ? Number(month)
        : currentDate.getMonth() + 1;

    if (
      !Number.isInteger(selectedYear) ||
      selectedYear < 2000
    ) {
      return {
        message: 'Invalid year',
      };
    }

    if (
      !Number.isInteger(selectedMonth) ||
      selectedMonth < 1 ||
      selectedMonth > 12
    ) {
      return {
        message: 'Invalid month',
      };
    }

    return this.dashboardService.getDashboard(
      selectedYear,
      selectedMonth,
    );
  }
}