import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

// Shared by every module that needs JwtAuthGuard, so feature modules (invites,
// venues, reviews) don't have to import AuthModule and risk a circular dependency.
@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_SECRET'),
        // `expiresIn` is typed as a template-literal union by the underlying `ms`
        // package, which a plain env-var string can't satisfy statically even
        // though it's validated correctly at runtime.
        signOptions: {
          expiresIn: (config.get<string>('JWT_EXPIRES_IN') ??
            '7d') as `${number}d`,
        },
      }),
    }),
  ],
  exports: [JwtModule],
})
export class JwtConfigModule {}
