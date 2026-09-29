import {
    Body,
    Controller,
    Get,
    Post,
    Req,
    Res,
    UseGuards,
} from '@nestjs/common';

import { Response } from 'express';

import { AuthService } from './auth.service';

import { LoginDto } from './dto/login.dto';
import { BootstrapAdminDto } from './dto/bootstrap-admin.dto';
import { CreateUserDto } from './dto/create-user.dto';

import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';

import { Roles } from './decorators/roles.decorator';

import { UserRole } from './schema/user.schema';
import { CsrfGuard } from './guards/csrf.guard';

@Controller('auth')
export class AuthController {
    constructor(
        private readonly authService: AuthService,
    ) { }

    @Post('bootstrap')
    bootstrapAdmin(
        @Body() dto: BootstrapAdminDto,
    ) {
        return this.authService.bootstrapAdmin(dto);
    }

    @Post('login')
    async login(
        @Body() dto: LoginDto,
        @Res({ passthrough: true }) res: Response,
    ) {
        const result =
            await this.authService.login(dto);

        const isProduction =
            process.env.NODE_ENV === 'production';

        res.cookie(
            'access_token',
            result.accessToken,
            {
                httpOnly: true,

                secure: isProduction,

                sameSite: 'lax',

                maxAge:
                    24 * 60 * 60 * 1000,

                path: '/',
            },
        );

        return {
            user: result.user,
        };
    }

    @UseGuards(JwtAuthGuard)
    @Get('me')
    me(@Req() req: any) {
        return req.user;
    }
    @UseGuards(JwtAuthGuard, CsrfGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    @Post('users')
    createUser(@Body() dto: CreateUserDto) {
        return this.authService.createUser(dto);
    }
    @UseGuards(JwtAuthGuard, CsrfGuard)
    @Post('logout')
    logout(
        @Res({ passthrough: true }) res: Response,
    ) {
        res.clearCookie('access_token', {
            httpOnly: true,
            secure:
                process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
        });

        return {
            message: 'Logged out successfully',
        };
    }
}