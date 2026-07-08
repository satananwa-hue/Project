import { Injectable, Logger } from '@nestjs/common';
import { SmsProvider } from './sms-provider.interface';

// Local/dev fallback so the OTP flow is runnable without a Twilio account.
// Never used when TWILIO_* env vars are set - see sms.module.ts.
@Injectable()
export class ConsoleSmsProvider implements SmsProvider {
  private readonly logger = new Logger(ConsoleSmsProvider.name);

  sendOtp(phone: string, code: string): Promise<void> {
    this.logger.warn(`[DEV ONLY] OTP for ${phone}: ${code}`);
    return Promise.resolve();
  }
}
