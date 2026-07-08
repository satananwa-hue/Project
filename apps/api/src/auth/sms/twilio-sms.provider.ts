import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SmsProvider } from './sms-provider.interface';

// Sends the OTP as a plain SMS via Twilio's Messages API. We generate and store
// the code ourselves (see OtpService) rather than using Twilio Verify, so the
// same code path works with any future SMS vendor without touching OtpService.
@Injectable()
export class TwilioSmsProvider implements SmsProvider {
  private readonly logger = new Logger(TwilioSmsProvider.name);

  constructor(private readonly config: ConfigService) {}

  async sendOtp(phone: string, code: string): Promise<void> {
    const accountSid = this.config.get<string>('TWILIO_ACCOUNT_SID');
    const authToken = this.config.get<string>('TWILIO_AUTH_TOKEN');
    const fromNumber = this.config.get<string>('TWILIO_FROM_NUMBER');

    const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          To: phone,
          From: fromNumber ?? '',
          Body: `Your ChiWitRakMaoChaAoWelaRakKhrai code is ${code}. It expires in 5 minutes.`,
        }),
      },
    );

    if (!response.ok) {
      const body = await response.text();
      this.logger.error(`Twilio send failed: ${response.status} ${body}`);
      throw new InternalServerErrorException(
        'Failed to send verification code',
      );
    }
  }
}
