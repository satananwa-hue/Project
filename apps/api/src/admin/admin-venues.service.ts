import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../../generated/prisma';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateVenueInput, UpdateVenueInput } from '@chiwitrakmaochaaowelarakkhrai/shared-types';

function parseJsonArray(v: unknown): string[] {
  if (Array.isArray(v)) return v as string[];
  if (typeof v === 'string') {
    try { return JSON.parse(v) as string[]; } catch { return []; }
  }
  return [];
}

@Injectable()
export class AdminVenuesService {
  constructor(private readonly prisma: PrismaService) {}

  async list() {
    const venues = await this.prisma.venue.findMany({
      include: {
        createdBy: { select: { id: true, name: true } },
        lastEditedBy: { select: { id: true, name: true } },
        _count: { select: { reviews: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return venues.map((v) => ({
      ...v,
      musicGenres: parseJsonArray(v.musicGenres),
      crowdTypes: parseJsonArray(v.crowdTypes),
      photos: parseJsonArray(v.photos),
    }));
  }

  private parseVenue<T extends { musicGenres: unknown; crowdTypes: unknown; photos: unknown }>(v: T) {
    return { ...v, musicGenres: parseJsonArray(v.musicGenres), crowdTypes: parseJsonArray(v.crowdTypes), photos: parseJsonArray(v.photos) };
  }

  async create(input: CreateVenueInput, accountId: string) {
    const venue = await this.prisma.venue.create({
      data: {
        name: input.name,
        category: input.category ?? 'OTHER',
        address: input.address,
        lat: input.lat,
        lng: input.lng,
        city: input.city ?? 'Bangkok',
        coverCharge: input.coverCharge ?? null,
        musicGenres: input.musicGenres ?? [],
        crowdTypes: input.crowdTypes ?? [],
        priceRange: input.priceRange ?? null,
        hoursJson: input.hoursJson ?? Prisma.DbNull,
        photos: input.photos ?? [],
        isPublished: input.isPublished ?? false,
        createdById: accountId,
        lastEditedById: accountId,
      },
    });
    return this.parseVenue(venue);
  }

  async update(id: string, input: UpdateVenueInput, accountId: string) {
    const existing = await this.prisma.venue.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Venue not found');

    const venue = await this.prisma.venue.update({
      where: { id },
      data: {
        ...(input.name !== undefined && { name: input.name }),
        ...(input.category !== undefined && { category: input.category }),
        ...(input.address !== undefined && { address: input.address }),
        ...(input.lat !== undefined && { lat: input.lat }),
        ...(input.lng !== undefined && { lng: input.lng }),
        ...(input.city !== undefined && { city: input.city }),
        ...(input.coverCharge !== undefined && { coverCharge: input.coverCharge }),
        ...(input.musicGenres !== undefined && { musicGenres: input.musicGenres }),
        ...(input.crowdTypes !== undefined && { crowdTypes: input.crowdTypes }),
        ...(input.priceRange !== undefined && { priceRange: input.priceRange }),
        ...(input.hoursJson !== undefined && { hoursJson: input.hoursJson ?? Prisma.DbNull }),
        ...(input.photos !== undefined && { photos: input.photos }),
        ...(input.isPublished !== undefined && { isPublished: input.isPublished }),
        lastEditedById: accountId,
      },
    });
    return this.parseVenue(venue);
  }

  async remove(id: string) {
    const existing = await this.prisma.venue.findUnique({
      where: { id },
      include: { _count: { select: { reviews: true } } },
    });
    if (!existing) throw new NotFoundException('Venue not found');
    if (existing._count.reviews > 0) {
      throw new ConflictException(
        `Cannot delete venue with ${existing._count.reviews} review(s). Remove reviews first.`,
      );
    }
    await this.prisma.venue.delete({ where: { id } });
  }

  async cleanupNonBarVenues() {
    // Mark venues that have no reviews and aren't a recognised nightlife category as closed.
    // This removes stale imported restaurants / drink shops without touching reviewed venues.
    const result = await this.prisma.venue.updateMany({
      where: {
        category: 'OTHER',
        isClosed: false,
        reviews: { none: {} },
      },
      data: { isClosed: true },
    });
    return { closed: result.count };
  }

  async cleanupUnreviewedVenues() {
    // Nuclear option: mark ALL unreviewed venues as closed so you can start fresh.
    const result = await this.prisma.venue.updateMany({
      where: {
        isClosed: false,
        reviews: { none: {} },
      },
      data: { isClosed: true },
    });
    return { closed: result.count };
  }
}
