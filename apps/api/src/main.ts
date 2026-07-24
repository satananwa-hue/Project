import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  // Passed explicitly rather than relying on @nestjs/core's dynamic
  // require('@nestjs/platform-express') auto-detection: in this npm workspace,
  // @nestjs/core hoists to the repo root while @nestjs/platform-express stays
  // local to apps/api/node_modules, so that internal require can't find it even
  // though our own imports (resolved relative to this file) can.
  const app = await NestFactory.create(AppModule, new ExpressAdapter());
  app.use(helmet());
  app.enableCors({
    origin: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : true,
    credentials: true,
  });
  // Deliberately no ADMIN_USERNAME/ADMIN_PASSWORD fallback here - see
  // AdminService.authenticate for why a default would be a real vulnerability.
  app.setGlobalPrefix('api');
  await app.listen(process.env.PORT ?? 4000);
}
void bootstrap();
