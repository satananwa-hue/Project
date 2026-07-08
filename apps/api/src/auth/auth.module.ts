import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { OtpService } from './otp.service';
import { SmsModule } from './sms/sms.module';
import { InvitesModule } from '../invites/invites.module';
import { JwtConfigModule } from '../common/jwt-config.module';

@Module({
  imports: [SmsModule, InvitesModule, JwtConfigModule],
  controllers: [AuthController],
  providers: [AuthService, OtpService],
})
export class AuthModule {}
