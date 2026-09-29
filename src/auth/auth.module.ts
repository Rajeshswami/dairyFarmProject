import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

import {
  User,
  UserSchema,
} from './schema/user.schema';

import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { RolesGuard } from './guards/roles.guard';
import { CsrfGuard } from './guards/csrf.guard';

@Module({
  imports: [
    ConfigModule,

    MongooseModule.forFeature([
      {
        name: User.name,
        schema: UserSchema,
      },
    ]),

    PassportModule,

    JwtModule.registerAsync({
      imports: [ConfigModule],

      inject: [ConfigService],

   useFactory: (configService: ConfigService) => ({
  secret: configService.getOrThrow<string>('JWT_SECRET'),
  signOptions: {
      expiresIn: (configService.get<string>('JWT_EXPIRES_IN') || '1d') as any,
    },
})
    }),
  ],

  controllers: [AuthController],

  providers: [
    AuthService,
    JwtStrategy,
      RolesGuard,
      CsrfGuard
  ],

  exports: [
    AuthService,
    JwtModule,
  ],
})
export class AuthModule {}