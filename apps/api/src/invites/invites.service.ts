import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { InviteDto } from '@chiwitrakmaochaaowelarakkhrai/shared-types';

@Injectable()
export class InvitesService {
  constructor(private readonly prisma: PrismaService) {}

  async getMyInvites(accountId: string): Promise<InviteDto[]> {
    const invites = await this.prisma.invite.findMany({
      where: { ownedByAccountId: accountId },
      orderBy: { createdAt: 'desc' },
    });
    return invites.map((i) => ({
      id: i.id,
      code: i.code,
      note: i.note,
      expiresAt: i.expiresAt?.toISOString() ?? null,
      usedAt: i.usedAt?.toISOString() ?? null,
      usedByAccountId: i.usedByAccountId,
      ownedByAccountId: i.ownedByAccountId,
      createdAt: i.createdAt.toISOString(),
    }));
  }
}
