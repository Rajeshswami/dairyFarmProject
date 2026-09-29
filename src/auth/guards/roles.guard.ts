import {
  CanActivate,
  ExecutionContext,
  Injectable,
} from '@nestjs/common';

import { Reflector } from '@nestjs/core';

import {
  ROLES_KEY,
} from '../decorators/roles.decorator';

import { UserRole } from '../schema/user.schema';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
  ) {}

  canActivate(
    context: ExecutionContext,
  ): boolean {
    const requiredRoles =
      this.reflector.getAllAndOverride<UserRole[]>(
        ROLES_KEY,
        [
          context.getHandler(),
          context.getClass(),
        ],
      );

    // No role restriction
    if (!requiredRoles) {
      return true;
    }

    const request = context
      .switchToHttp()
      .getRequest();

    const user = request.user;

    if (!user) {
      return false;
    }

    // ADMIN has full access
    if (user.role === UserRole.ADMIN) {
      return true;
    }

    return requiredRoles.includes(user.role);
  }
}