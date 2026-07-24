import { PrismaClient } from '../generated/prisma';
import { parse } from 'csv-parse/sync';
import { readFileSync } from 'fs';
import { join } from 'path';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const existing = await prisma.venue.count();
  if (existing > 0) {
    console.log(`Seed skipped — ${existing} venues already exist.`);
    return;
  }

  // Create system account used as the creator for seeded venues
  let system = await prisma.account.findFirst({ where: { email: 'system@nightcheck.app' } });
  if (!system) {
    system = await prisma.account.create({
      data: {
        name: 'NightCheck System',
        email: 'system@nightcheck.app',
        passwordHash: await bcrypt.hash(Math.random().toString(36) + Date.now(), 10),
        role: 'ADMINISTRATOR',
      },
    });
    console.log('Created system account.');
  }

  const csv = readFileSync(join(__dirname, 'venues.csv'), 'utf-8');
  const rows = parse(csv, { columns: true, skip_empty_lines: true }) as Array<{
    name: string; lat: string; lng: string; address: string;
  }>;

  console.log(`Seeding ${rows.length} venues...`);
  let seeded = 0;

  for (const row of rows) {
    const lat = parseFloat(row.lat);
    const lng = parseFloat(row.lng);
    if (isNaN(lat) || isNaN(lng)) continue;

    try {
      await prisma.venue.create({
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
    } catch {
      // skip duplicates or invalid rows
    }
  }

  console.log(`Done — seeded ${seeded} venues.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
