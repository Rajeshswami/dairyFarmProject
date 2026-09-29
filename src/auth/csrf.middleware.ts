import {
  Injectable,
  NestMiddleware,
} from '@nestjs/common';

import { Request, Response, NextFunction } from 'express';

import { randomBytes } from 'crypto';

@Injectable()
export class CsrfMiddleware
  implements NestMiddleware
{
  use(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    let csrfToken =
      req.cookies?.csrf_token;

    if (!csrfToken) {
      csrfToken =
        randomBytes(32).toString('hex');

      res.cookie(
        'csrf_token',
        csrfToken,
        {
          httpOnly: false,

          secure:
            process.env.NODE_ENV ===
            'production',

          sameSite: 'lax',

          maxAge:
            24 * 60 * 60 * 1000,

          path: '/',
        },
      );
    }

    next();
  }
}