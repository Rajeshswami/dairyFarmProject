import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

import { CustomersModule } from './customers/customers.module';
import { MilkDeliveryModule } from './milk-delivery/milk-delivery.module';
import { BillsModule } from './bills/bills.module';
import { PaymentsModule } from './payments/payments.module';
import { AnimalsController } from './animal/animals.controller';
import { AnimalsService } from './animal/animals.service';
import {  AnimalsModule } from './animal/animals.module';
import { MilkProductionModule } from './milk-production/milk-production.module';
import { ReportsModule } from './reports/reports.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { AuthModule } from './auth/auth.module';
import { CsrfMiddleware } from './auth/csrf.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    MongooseModule.forRootAsync({
      imports: [ConfigModule],

      inject: [ConfigService],

      useFactory: (configService: ConfigService) => {
        const uri = configService.get<string>('MONGODB_URI');

        console.log('MongoDB URI:', uri);

        if (!uri) {
          throw new Error(
            'MONGODB_URI is not configured in .env',
          );
        }

        return {
          uri,
        };
      },
    }),

    CustomersModule,

    MilkDeliveryModule,

    BillsModule,

    PaymentsModule,

    AnimalsModule,

    MilkProductionModule,

    ReportsModule,

    DashboardModule,

    AuthModule,
    
  ],
})
export class AppModule implements NestModule{
   configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(CsrfMiddleware)
      .forRoutes('*');
  }
}