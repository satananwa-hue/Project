import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SMS_PROVIDER } from './sms-provider.interface';
import { ConsoleSmsProvider } from './console-sms.provider';
import { TwilioSmsProvider } from './twilio-sms.provider';

@Module({
  providers: [
    ConsoleSmsProvider,
    TwilioSmsProvider,
    {
      provide: SMS_PROVIDER,
      useFactory: (
        config: ConfigService,
        twilio: TwilioSmsProvider,
        console_: ConsoleSmsProvider,
      ) => (config.get<string>('TWILIO_ACCOUNT_SID') ? twilio : console_),
      inject: [ConfigService, TwilioSmsProvider, ConsoleSmsProvider],
    },
  ],
  exports: [SMS_PROVIDER],
})
export class SmsModule {}
