import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  async authenticate(username: string, password: string) {
    // No fallback defaults here on purpose - a misconfigured deploy that forgot
    // to set these would otherwise be reachable with guessable admin/admin123
    // credentials and full ADMIN-role access.
    const expectedUsername = this.config.getOrThrow<string>('ADMIN_USERNAME');
    const expectedPassword = this.config.getOrThrow<string>('ADMIN_PASSWORD');

    if (username !== expectedUsername || password !== expectedPassword) {
      throw new UnauthorizedException('Invalid admin username or password.');
    }

    const [userCount, inviteCount, venueCount] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.invite.count(),
      this.prisma.venue.count(),
    ]);

    const accessToken = await this.jwtService.signAsync({
      sub: 'admin',
      role: 'ADMIN',
    });

    return {
      accessToken,
      user: {
        username,
        stats: {
          reviewers: userCount,
          invites: inviteCount,
          venues: venueCount,
        },
      },
    };
  }

  // Token verification and the ADMIN-role check both already happened in
  // JwtAuthGuard/RolesGuard before this is called - no need to redo either here.
  getProfile(userId: string) {
    return {
      id: userId,
      username: this.config.getOrThrow<string>('ADMIN_USERNAME'),
      role: 'ADMIN',
    };
  }
}
