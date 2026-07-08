import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: Array<'PUBLIC' | 'REVIEWER' | 'ADMIN'>) =>
  SetMetadata(ROLES_KEY, roles);
