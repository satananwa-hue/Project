import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { parse } from 'csv-parse/sync';
import { readFileSync } from 'fs';
import { join } from 'path';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from './prisma/prisma.service';

@Injectable()
export class SeedService implements OnModuleInit {
  private readonly logger = new Logger(SeedService.name);

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    try {
      const count = await this.prisma.venue.count();
      if (count > 0) {
        this.logger.log(`Seed skipped — ${count} venues already exist.`);
        return;
      }

      let system = await this.prisma.account.findFirst({
        where: { email: 'system@nightcheck.app' },
      });
      if (!system) {
        system = await this.prisma.account.create({
          data: {
            name: 'NightCheck System',
            email: 'system@nightcheck.app',
            passwordHash: await bcrypt.hash(Math.random().toString(36) + Date.now(), 10),
            role: 'ADMINISTRATOR',
          },
        });
      }

      const csvPath = join(__dirname, '../prisma/venues.csv');
      const csv = readFileSync(csvPath, 'utf-8');
      const rows = parse(csv, { columns: true, skip_empty_lines: true }) as Array<{
        name: string; lat: string; lng: string; address: string;
      }>;

      this.logger.log(`Seeding ${rows.length} venues...`);
      let seeded = 0;

      for (const row of rows) {
        const lat = parseFloat(row.lat);
        const lng = parseFloat(row.lng);
        if (isNaN(lat) || isNaN(lng)) continue;
        try {
          await this.prisma.venue.create({
            data: {
              name: row.name,
              category: 'BAR',
              address: row.address || 'Bangkok, Thailand',
              lat,
              lng,
              city: 'Bangkok',
              musicGenres: [],
              crowdTypes: [],
              photos: [],
              isPublished: true,
              createdById: system.id,
              lastEditedById: system.id,
            },
          });
          seeded++;
        } catch { /* skip duplicates */ }
      }

      this.logger.log(`Done — seeded ${seeded} venues.`);
    } catch (err) {
      this.logger.error('Seed failed', err);
    }
  }
}
