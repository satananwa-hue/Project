import {
  Injectable,
  Inject,
  BadRequestException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { randomInt } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { hashPhone } from '../common/crypto/phone-hash.util';
import { SMS_PROVIDER } from './sms/sms-provider.interface';
import type { SmsProvider } from './sms/sms-provider.interface';

@Injectable()
export class OtpService {
  private readonly phoneHashSecret: string;
  private readonly ttlSeconds: number;
  private readonly maxAttemptsPerPhone: number;
  private readonly maxAttemptsPerIp: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    @Inject(SMS_PROVIDER) private readonly smsProvider: SmsProvider,
  ) {
    this.phoneHashSecret = this.config.getOrThrow<string>('PHONE_HASH_SECRET');
    this.ttlSeconds = Number(this.config.get('OTP_TTL_SECONDS') ?? 300);
    this.maxAttemptsPerPhone = Number(
      this.config.get('OTP_MAX_ATTEMPTS_PER_PHONE') ?? 5,
    );
    this.maxAttemptsPerIp = Number(
      this.config.get('OTP_MAX_ATTEMPTS_PER_IP') ?? 20,
    );
  }

  // Returns the code only when no real SMS provider is configured (dev/local),
  // so the frontend can show it directly instead of requiring someone to dig
  // through server logs. Never happens once TWILIO_* is set, i.e. never in an
  // environment actually sending real SMS.
  async requestOtp(phone: string, ip: string): Promise<{ devCode?: string }> {
    const phoneHash = hashPhone(phone, this.phoneHashSecret);
    const ipHash = hashPhone(ip, this.phoneHashSecret);
    const windowStart = new Date(Date.now() - 60 * 60 * 1000); // 1 hour window

    const [phoneRequestCount, ipRequestCount] = await Promise.all([
      this.prisma.phoneOtp.count({
        where: { phoneHash, createdAt: { gte: windowStart } },
      }),
      this.prisma.phoneOtp.count({
        where: { ipHash, createdAt: { gte: windowStart } },
      }),
    ]);

    if (phoneRequestCount >= this.maxAttemptsPerPhone) {
      throw new HttpException(
        'Too many verification requests for this phone number. Try again later.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    if (ipRequestCount >= this.maxAttemptsPerIp) {
      throw new HttpException(
        'Too many verification requests from this network. Try again later.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const code = randomInt(0, 1_000_000).toString().padStart(6, '0');
    const codeHash = await bcrypt.hash(code, 10);
    const expiresAt = new Date(Date.now() + this.ttlSeconds * 1000);

    await this.prisma.phoneOtp.create({
      data: { phoneHash, ipHash, codeHash, expiresAt },
    });

    await this.smsProvider.sendOtp(phone, code);

    const hasRealSmsProvider = !!this.config.get<string>('TWILIO_ACCOUNT_SID');
    return hasRealSmsProvider ? {} : { devCode: code };
  }

  async verifyOtp(phone: string, code: string): Promise<{ phoneHash: string }> {
    const phoneHash = hashPhone(phone, this.phoneHashSecret);

    const otp = await this.prisma.phoneOtp.findFirst({
      where: { phoneHash, consumedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
    });

    if (!otp) {
      throw new BadRequestException(
        'No pending verification for this phone number',
      );
    }
    if (otp.attemptCount >= this.maxAttemptsPerPhone) {
      throw new HttpException(
        'Too many incorrect attempts',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const isValid = await bcrypt.compare(code, otp.codeHash);

    await this.prisma.phoneOtp.update({
      where: { id: otp.id },
      data: isValid
        ? { consumedAt: new Date() }
        : { attemptCount: { increment: 1 } },
    });

    if (!isValid) {
      throw new BadRequestException('Incorrect verification code');
    }

    return { phoneHash };
  }
}
