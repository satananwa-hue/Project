import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!requiredRoles || requiredRoles.length === 0) return true;

    const request = context.switchToHttp().getRequest<Request>();
    const accountId = request.user?.sub;
    if (!accountId) throw new ForbiddenException('Insufficient role for this action');

    const account = await this.prisma.account.findUnique({
      where: { id: accountId },
      select: { role: true, active: true },
    });

    if (!account?.active || !requiredRoles.includes(account.role)) {
      throw new ForbiddenException('Insufficient role for this action');
    }
    return true;
  }
}
