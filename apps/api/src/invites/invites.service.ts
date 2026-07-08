import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { generateInviteCode } from './invite-code.util';
import type { User } from '../../generated/prisma';

const REVIEWER_INVITE_ALLOWANCE = 5;
const INVITE_EXPIRY_DAYS = 30;
const INVITE_CONVERTED_REPUTATION_DELTA = 5;

@Injectable()
export class InvitesService {
  constructor(private readonly prisma: PrismaService) {}

  async createInvite(inviterId: string) {
    const inviter = await this.prisma.user.findUniqueOrThrow({
      where: { id: inviterId },
    });

    if (inviter.role === 'PUBLIC') {
      throw new ForbiddenException('Only reviewers can send invites');
    }
    if (inviter.remainingInvites <= 0) {
      throw new ForbiddenException('No invites remaining');
    }

    const code = generateInviteCode();
    const expiresAt = new Date(
      Date.now() + INVITE_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
    );

    const [invite] = await this.prisma.$transaction([
      this.prisma.invite.create({ data: { code, inviterId, expiresAt } }),
      this.prisma.user.update({
        where: { id: inviterId },
        data: { remainingInvites: { decrement: 1 } },
      }),
    ]);

    return invite;
  }

  async listInvites(inviterId: string) {
    const [invites, inviter] = await Promise.all([
      this.prisma.invite.findMany({
        where: { inviterId },
        include: { invitee: { select: { id: true, displayName: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.findUniqueOrThrow({ where: { id: inviterId } }),
    ]);

    return {
      remainingInvites: inviter.remainingInvites,
      totalSent: invites.length,
      totalRedeemed: invites.filter((i) => i.status === 'USED').length,
      invites,
    };
  }

  // "Top inviters" leaderboard: ranked by redeemed direct invites, since raw invite
  // creation is cheap and easily gamed - only conversions should count.
  async topInviters(limit = 20) {
    const results = await this.prisma.invite.groupBy({
      by: ['inviterId'],
      where: { status: 'USED' },
      _count: { inviterId: true },
      orderBy: { _count: { inviterId: 'desc' } },
      take: limit,
    });

    const users = await this.prisma.user.findMany({
      where: { id: { in: results.map((r) => r.inviterId) } },
      select: { id: true, displayName: true, invitePath: true },
    });
    const userById = new Map(users.map((u) => [u.id, u]));

    return Promise.all(
      results.map(async (r) => {
        const user = userById.get(r.inviterId);
        const subtreeSize = user
          ? await this.prisma.user.count({
              where: {
                invitePath: { startsWith: user.invitePath },
                id: { not: user.id },
              },
            })
          : 0;
        return {
          userId: r.inviterId,
          displayName: user?.displayName ?? 'Unknown',
          directInvites: r._count.inviterId,
          subtreeSize,
        };
      }),
    );
  }

  // Called from AuthService when a brand-new phone number verifies with an invite code.
  async redeemInviteForNewUser(code: string, phoneHash: string): Promise<User> {
    const invite = await this.prisma.invite.findUnique({
      where: { code },
      include: { inviter: true },
    });

    if (!invite || invite.status !== 'PENDING') {
      throw new BadRequestException('Invite code is invalid or already used');
    }
    if (invite.expiresAt < new Date()) {
      throw new BadRequestException('Invite code has expired');
    }

    const inviter = invite.inviter;

    const user = await this.prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          phoneHash,
          displayName: `Reviewer${phoneHash.slice(0, 6)}`,
          role: 'REVIEWER',
          remainingInvites: REVIEWER_INVITE_ALLOWANCE,
          invitedById: inviter.id,
          cityId: inviter.cityId,
          inviteDepth: inviter.inviteDepth + 1,
        },
      });

      const invitePath = `${inviter.invitePath}${created.id}/`;
      const updated = await tx.user.update({
        where: { id: created.id },
        data: { invitePath },
      });

      await tx.invite.update({
        where: { id: invite.id },
        data: { status: 'USED', inviteeId: created.id, redeemedAt: new Date() },
      });

      await tx.reputationEvent.create({
        data: {
          userId: inviter.id,
          type: 'INVITE_CONVERTED',
          delta: INVITE_CONVERTED_REPUTATION_DELTA,
        },
      });
      await tx.user.update({
        where: { id: inviter.id },
        data: {
          reputationScore: { increment: INVITE_CONVERTED_REPUTATION_DELTA },
        },
      });

      return updated;
    });

    return user;
  }

  async createSeedReviewer(
    displayName: string,
    phoneHash: string,
    cityId?: string,
  ) {
    const existing = await this.prisma.user.findUnique({
      where: { phoneHash },
    });
    if (existing) {
      throw new BadRequestException(
        'A user with this phone number already exists',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          phoneHash,
          displayName,
          role: 'REVIEWER',
          remainingInvites: REVIEWER_INVITE_ALLOWANCE,
          cityId,
          inviteDepth: 0,
        },
      });
      return tx.user.update({
        where: { id: created.id },
        data: { invitePath: `/${created.id}/` },
      });
    });
  }
}
