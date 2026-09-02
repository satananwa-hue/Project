import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import type { AccountDto, AuthSession, SignupInput } from '@chiwitrakmaochaaowelarakkhrai/shared-types';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async login(email: string, password: string): Promise<AuthSession> {
    const account = await this.prisma.account.findUnique({
      where: { email: email.toLowerCase().trim() },
    });
    if (!account) throw new UnauthorizedException('Invalid email or password');

    const valid = await bcrypt.compare(password, account.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid email or password');

    if (!account.active) throw new UnauthorizedException('Account is deactivated');

    await this.prisma.account.update({
      where: { id: account.id },
      data: { lastLoginAt: new Date() },
    });

    const accessToken = await this.jwtService.signAsync({
      sub: account.id,
      role: account.role,
      name: account.name,
    });

    return {
      accessToken,
      account: {
        id: account.id,
        name: account.name,
        email: account.email,
        avatarUrl: account.avatarUrl,
        role: account.role,
        points: account.points,
      },
    };
  }

  async signup(input: SignupInput): Promise<AuthSession> {
    const invite = await this.prisma.invite.findUnique({ where: { code: input.inviteCode.toUpperCase().trim() } });
    if (!invite) throw new BadRequestException('Invalid invite code');
    if (invite.usedAt) throw new BadRequestException('Invite code has already been used');
    if (invite.expiresAt && invite.expiresAt < new Date()) throw new BadRequestException('Invite code has expired');

    const existing = await this.prisma.account.findUnique({ where: { email: input.email.toLowerCase().trim() } });
    if (existing) throw new BadRequestException('Email already in use');

    const passwordHash = await bcrypt.hash(input.password, 12);
    const account = await this.prisma.account.create({
      data: {
        name: input.name.trim(),
        email: input.email.toLowerCase().trim(),
        passwordHash,
        role: 'USER',
      },
    });

    await this.prisma.invite.update({
      where: { id: invite.id },
      data: { usedAt: new Date(), usedByAccountId: account.id },
    });

    // Give the new user 5 invite codes to share with friends
    const { randomBytes } = await import('crypto');
    const newCodes = Array.from({ length: 5 }, () => randomBytes(5).toString('hex').toUpperCase());
    await this.prisma.invite.createMany({
      data: newCodes.map((code) => ({ code, ownedByAccountId: account.id })),
    });

    const accessToken = await this.jwtService.signAsync({ sub: account.id, role: account.role, name: account.name });
    return {
      accessToken,
      account: {
        id: account.id,
        name: account.name,
        email: account.email,
        avatarUrl: account.avatarUrl,
        role: account.role,
        points: account.points,
      },
    };
  }

  async getProfile(accountId: string): Promise<AccountDto> {
    const account = await this.prisma.account.findUniqueOrThrow({
      where: { id: accountId },
      include: { createdBy: { select: { id: true, name: true } } },
    });

    return {
      id: account.id,
      name: account.name,
      email: account.email,
      avatarUrl: account.avatarUrl,
      role: account.role,
      active: account.active,
      points: account.points,
      createdAt: account.createdAt.toISOString(),
      lastLoginAt: account.lastLoginAt?.toISOString() ?? null,
      createdBy: account.createdBy
        ? { id: account.createdBy.id, name: account.createdBy.name }
        : null,
    };
  }
}
