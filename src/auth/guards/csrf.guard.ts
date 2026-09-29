import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';

@Injectable()
export class CsrfGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();

    const method = request.method.toUpperCase();

    if (
      method === 'GET' ||
      method === 'HEAD' ||
      method === 'OPTIONS'
    ) {
      return true;
    }

    const cookieToken = request.cookies?.csrf_token;
    const headerToken = request.headers['x-csrf-token'];

    if (
      !cookieToken ||
      !headerToken ||
      typeof headerToken !== 'string' ||
      cookieToken !== headerToken
    ) {
      throw new ForbiddenException('Invalid CSRF token');
    }

    return true;
  }
}