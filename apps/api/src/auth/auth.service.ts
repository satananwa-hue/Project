import { BadRequestException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { OtpService } from './otp.service';
import { PrismaService } from '../prisma/prisma.service';
import { InvitesService } from '../invites/invites.service';
import type {
  AuthSession,
  UserProfile,
} from '@chiwitrakmaochaaowelarakkhrai/shared-types';

@Injectable()
export class AuthService {
  constructor(
    private readonly otpService: OtpService,
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly invitesService: InvitesService,
  ) {}

  async requestOtp(phone: string, ip: string): Promise<{ devCode?: string }> {
    return this.otpService.requestOtp(phone, ip);
  }

  async verifyOtp(
    phone: string,
    code: string,
    inviteCode?: string,
  ): Promise<AuthSession> {
    const { phoneHash } = await this.otpService.verifyOtp(phone, code);

    let user = await this.prisma.user.findUnique({ where: { phoneHash } });

    if (!user) {
      if (inviteCode) {
        user = await this.invitesService.redeemInviteForNewUser(
          inviteCode,
          phoneHash,
        );
      } else {
        user = await this.prisma.user.create({
          data: { phoneHash, displayName: `Explorer${phoneHash.slice(0, 6)}` },
        });
      }
    } else if (inviteCode) {
      throw new BadRequestException('This phone number is already registered');
    }

    const accessToken = await this.jwtService.signAsync({
      sub: user.id,
      role: user.role,
    });

    return {
      accessToken,
      user: { id: user.id, displayName: user.displayName, role: user.role },
    };
  }

  async getProfile(userId: string): Promise<UserProfile> {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
    });
    return {
      id: user.id,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      role: user.role,
      reputationLevel: user.reputationLevel,
      reputationScore: user.reputationScore,
      remainingInvites: user.remainingInvites,
    };
  }
}
