import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards,
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
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import type { JwtPayload } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('otp/request')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Throttle({ default: { limit: 3, ttl: 60_000 } })
  @UsePipes(new ZodValidationPipe(requestOtpSchema))
  async request(
    @Body() body: { phone: string },
    @Req() req: Request,
  ): Promise<void> {
    await this.authService.requestOtp(body.phone, req.ip ?? 'unknown');
  }

  @Post('otp/verify')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @UsePipes(new ZodValidationPipe(verifyOtpSchema))
  async verify(
    @Body() body: { phone: string; code: string; inviteCode?: string },
  ) {
    return this.authService.verifyOtp(body.phone, body.code, body.inviteCode);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async me(@CurrentUser() user: JwtPayload) {
    return this.authService.getProfile(user.sub);
  }
}
