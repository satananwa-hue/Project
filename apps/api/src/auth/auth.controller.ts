import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UsePipes,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Request } from 'express';
import {
  requestOtpSchema,
  verifyOtpSchema,
} from '@chiwitrakmaochaaowelarakkhrai/shared-types';
import { AuthService } from './auth.service';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';

@Controller('auth/otp')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('request')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Throttle({ default: { limit: 3, ttl: 60_000 } })
  @UsePipes(new ZodValidationPipe(requestOtpSchema))
  async request(
    @Body() body: { phone: string },
    @Req() req: Request,
  ): Promise<void> {
    await this.authService.requestOtp(body.phone, req.ip ?? 'unknown');
  }

  @Post('verify')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @UsePipes(new ZodValidationPipe(verifyOtpSchema))
  async verify(
    @Body() body: { phone: string; code: string; inviteCode?: string },
  ) {
    return this.authService.verifyOtp(body.phone, body.code, body.inviteCode);
  }
}
