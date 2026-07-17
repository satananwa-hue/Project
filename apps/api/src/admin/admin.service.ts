import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import type {
  AccountDto,
  CreateAccountInput,
  UpdateAccountInput,
  InviteDto,
  CreateInviteInput,
  BulkCreateInviteInput,
} from '@chiwitrakmaochaaowelarakkhrai/shared-types';

function toAccountDto(
  account: {
    id: string;
    name: string;
    email: string;
    avatarUrl: string | null;
    role: string;
    active: boolean;
    points: number;
    createdAt: Date;
    lastLoginAt: Date | null;
  },
  createdBy?: { id: string; name: string } | null,
): AccountDto {
  return {
    id: account.id,
    name: account.name,
    email: account.email,
    avatarUrl: account.avatarUrl,
    role: account.role as AccountDto['role'],
    active: account.active,
    points: account.points,
    createdAt: account.createdAt.toISOString(),
    lastLoginAt: account.lastLoginAt?.toISOString() ?? null,
    createdBy: createdBy ?? null,
  };
}

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats() {
    const [accounts, totalVenues, reviews, publishedVenues] = await Promise.all([
      this.prisma.account.count(),
      this.prisma.venue.count(),
      this.prisma.review.count(),
      this.prisma.venue.count({ where: { isPublished: true } }),
    ]);
    return {
      accounts,
      venues: totalVenues,
      reviews,
      publishedVenues,
      pendingVenues: totalVenues - publishedVenues,
    };
  }

  async getProfile(accountId: string): Promise<AccountDto> {
    const account = await this.prisma.account.findUniqueOrThrow({
      where: { id: accountId },
      include: { createdBy: { select: { id: true, name: true } } },
    });
    return toAccountDto(account, account.createdBy);
  }

  async listAccounts(): Promise<AccountDto[]> {
    const accounts = await this.prisma.account.findMany({
      include: { createdBy: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return accounts.map((a) => toAccountDto(a, a.createdBy));
  }

  async createAccount(
    input: CreateAccountInput,
    createdByAdminId: string,
  ): Promise<AccountDto> {
    const existing = await this.prisma.account.findUnique({
      where: { email: input.email.toLowerCase().trim() },
    });
    if (existing) throw new ConflictException('Email already in use');

    const passwordHash = await bcrypt.hash(input.password, 12);
    const account = await this.prisma.account.create({
      data: {
        name: input.name,
        email: input.email.toLowerCase().trim(),
        passwordHash,
        avatarUrl: input.avatarUrl,
        role: input.role ?? 'CREATOR',
        createdByAdminId,
      },
      include: { createdBy: { select: { id: true, name: true } } },
    });
    return toAccountDto(account, account.createdBy);
  }

  async updateAccount(id: string, input: UpdateAccountInput): Promise<AccountDto> {
    const existing = await this.prisma.account.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Account not found');

    const account = await this.prisma.account.update({
      where: { id },
      data: {
        ...(input.name !== undefined && { name: input.name }),
        ...(input.email !== undefined && { email: input.email.toLowerCase().trim() }),
        ...(input.avatarUrl !== undefined && { avatarUrl: input.avatarUrl }),
        ...(input.role !== undefined && { role: input.role }),
        ...(input.active !== undefined && { active: input.active }),
      },
      include: { createdBy: { select: { id: true, name: true } } },
    });
    return toAccountDto(account, account.createdBy);
  }

  async resetPassword(id: string, newPassword: string): Promise<void> {
    const existing = await this.prisma.account.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Account not found');
    const passwordHash = await bcrypt.hash(newPassword, 12);
    await this.prisma.account.update({ where: { id }, data: { passwordHash } });
  }

  async listInvites(): Promise<InviteDto[]> {
    const invites = await this.prisma.invite.findMany({ orderBy: { createdAt: 'desc' } });
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

  async createInvite(input: CreateInviteInput, adminId: string): Promise<InviteDto> {
    const { randomBytes } = await import('crypto');
    const code = randomBytes(5).toString('hex').toUpperCase();
    const invite = await this.prisma.invite.create({
      data: {
        code,
        note: input.note ?? null,
        expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
        createdByAdminId: adminId,
        ownedByAccountId: adminId,
      },
    });
    return {
      id: invite.id,
      code: invite.code,
      note: invite.note,
      expiresAt: invite.expiresAt?.toISOString() ?? null,
      usedAt: invite.usedAt?.toISOString() ?? null,
      usedByAccountId: invite.usedByAccountId,
      ownedByAccountId: invite.ownedByAccountId,
      createdAt: invite.createdAt.toISOString(),
    };
  }

  async bulkCreateInvites(input: BulkCreateInviteInput, adminId: string): Promise<{ created: number }> {
    const { randomBytes } = await import('crypto');
    const codes = Array.from({ length: input.count }, () => randomBytes(5).toString('hex').toUpperCase());
    const result = await this.prisma.invite.createMany({
      data: codes.map((code) => ({
        code,
        createdByAdminId: adminId,
        ownedByAccountId: adminId,
      })),
    });
    return { created: result.count };
  }

  async revokeInvite(code: string): Promise<void> {
    const invite = await this.prisma.invite.findUnique({ where: { code } });
    if (!invite) throw new NotFoundException('Invite not found');
    await this.prisma.invite.delete({ where: { code } });
  }

}
