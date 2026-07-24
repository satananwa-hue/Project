import { Controller, Get, Post } from '@nestjs/common';
import { existsSync } from 'fs';
import { join } from 'path';
import { AppService } from './app.service';
import { SeedService } from './seed.service';
import { PrismaService } from './prisma/prisma.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly seedService: SeedService,
    private readonly prisma: PrismaService,
  ) {}

  @Get('health')
  health() {
    return this.appService.getHealth();
  }

  @Get('admin/seed-debug')
  async seedDebug() {
    const dirname = __dirname;
    const csvPath = join(__dirname, '../prisma/venues.csv');
    const csvExists = existsSync(csvPath);
    const venueCount = await this.prisma.venue.count().catch((e: Error) => `DB error: ${e.message}`);
    return { dirname, csvPath, csvExists, venueCount };
  }

  @Post('admin/run-seed')
  async runSeed() {
    await this.seedService.onModuleInit();
    const count = await this.prisma.venue.count();
    return { ok: true, venueCount: count };
  }
}
