import { Controller, Get, Post } from '@nestjs/common';
import { existsSync } from 'fs';
import { join } from 'path';
import * as bcrypt from 'bcryptjs';
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

    let system: { id: string } | null = null;
    let systemError: string | null = null;
    let venueCreateError: string | null = null;
    let venueCreateOk = false;

    try {
      system = await this.prisma.account.findFirst({ where: { email: 'system@nightcheck.app' } });
    } catch (e) { systemError = String(e); }

    if (system) {
      try {
        const v = await this.prisma.venue.create({
          data: {
            name: '__debug_test__',
            category: 'BAR' as any,
            address: 'Bangkok',
            lat: 13.7,
            lng: 100.5,
            city: 'Bangkok',
            musicGenres: [],
            crowdTypes: [],
            photos: [],
            isPublished: false,
            createdById: system.id,
            lastEditedById: system.id,
          },
        });
        venueCreateOk = true;
        await this.prisma.venue.delete({ where: { id: v.id } });
      } catch (e) { venueCreateError = String(e); }
    }

    return { dirname, csvPath, csvExists, venueCount, systemId: system?.id ?? null, systemError, venueCreateOk, venueCreateError };
  }

  @Post('admin/run-seed')
  async runSeed() {
    await this.seedService.onModuleInit();
    const count = await this.prisma.venue.count();
    return { ok: true, venueCount: count };
  }

  @Post('admin/bootstrap-admin')
  async bootstrapAdmin() {
    const pw = 'NightCheck@2026';
    const hash = await bcrypt.hash(pw, 12);
    await this.prisma.account.update({
      where: { email: 'system@nightcheck.app' },
      data: { passwordHash: hash, name: 'Administrator' },
    });
    return { ok: true, email: 'system@nightcheck.app', password: pw };
  }
}
