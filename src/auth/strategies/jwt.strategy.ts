import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { PassportStrategy } from '@nestjs/passport';

import {
  ExtractJwt,
  Strategy,
} from 'passport-jwt';

import { ConfigService } from '@nestjs/config';

import { AuthService } from '../auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: any) => {
          return request?.cookies?.access_token;
        },
      ]),

      ignoreExpiration: false,

      secretOrKey:
        configService.getOrThrow<string>('JWT_SECRET'),
    });
  }

  async validate(payload: any) {
    const user = await this.authService.findById(
      payload.sub,
    );

    if (!user) {
      throw new UnauthorizedException(
        'User not found',
      );
    }

    if (!user.active) {
      throw new UnauthorizedException(
        'User is inactive',
      );
    }

    return {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    };
  }
}