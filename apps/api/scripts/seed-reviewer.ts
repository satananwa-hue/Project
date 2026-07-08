// One-off admin bootstrap script - deliberately not exposed over HTTP.
// Usage: npm run seed:reviewer --workspace=api -- "Alice" "+66800000001"
import 'dotenv/config';
import { createHmac } from 'crypto';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma';

function hashPhone(phone: string, secret: string): string {
  return createHmac('sha256', secret).update(phone).digest('hex');
}

async function main() {
  const [displayName, phone] = process.argv.slice(2);
  if (!displayName || !phone) {
    console.error('Usage: npm run seed:reviewer --workspace=api -- "<displayName>" "<phone>"');
    process.exit(1);
  }

  const phoneHashSecret = process.env.PHONE_HASH_SECRET;
  if (!phoneHashSecret) {
    throw new Error('PHONE_HASH_SECRET is not set in the environment');
  }

  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });

  const phoneHash = hashPhone(phone, phoneHashSecret);
  const existing = await prisma.user.findUnique({ where: { phoneHash } });
  if (existing) {
    console.log(`User already exists: ${existing.id} (${existing.displayName})`);
    await prisma.$disconnect();
    return;
  }

  const created = await prisma.user.create({
    data: {
      phoneHash,
      displayName,
      role: 'REVIEWER',
      remainingInvites: 5,
      inviteDepth: 0,
    },
  });
  await prisma.user.update({
    where: { id: created.id },
    data: { invitePath: `/${created.id}/` },
  });

  console.log(`Created reviewer ${created.id} (${created.displayName}) with 5 invites.`);
  console.log(`Phone: ${phone}`);
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
