import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../../generated/prisma';
import { PrismaService } from '../prisma/prisma.service';
import type {
  CreateVenueInput,
  VenueDetailDto,
  VenueListItemDto,
  VenueSearchInput,
} from '@chiwitrakmaochaaowelarakkhrai/shared-types';

function parseJsonArray(v: unknown): string[] {
  if (Array.isArray(v)) return v as string[];
  if (typeof v === 'string') {
    try { return JSON.parse(v) as string[]; } catch { return []; }
  }
  return [];
}

function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

@Injectable()
export class VenuesService {
  constructor(private readonly prisma: PrismaService) {}

  async search(
    params: VenueSearchInput,
  ): Promise<{ items: VenueListItemDto[]; page: number; pageSize: number }> {
    const {
      query,
      category,
      priceRange,
      musicGenre,
      crowdType,
      lat,
      lng,
      radiusM,
      publishedOnly,
      page,
      pageSize,
    } = params;

    // SQL Server doesn't support mode: 'insensitive' — case sensitivity depends on collation
    // (default SQL Server collation is case-insensitive, so contains works correctly)
    const allVenues = await this.prisma.venue.findMany({
      where: {
        isClosed: false,
        ...(publishedOnly && { isPublished: true }),
        ...(category && { category }),
        ...(priceRange && { priceRange }),
        // JSON arrays stored as strings: search for "value" (with quotes) to match exact elements
        ...(musicGenre && { musicGenres: { string_contains: `"${musicGenre}"` } }),
        ...(crowdType && { crowdTypes: { string_contains: `"${crowdType}"` } }),
        ...(query && { name: { contains: query } }),
      },
      orderBy: { createdAt: 'desc' },
    });

    // Apply geo filtering in application code
    let filtered: (typeof allVenues[number] & { distanceM: number | null })[];
    if (lat !== undefined && lng !== undefined && radiusM !== undefined) {
      filtered = allVenues
        .map((v) => ({ ...v, distanceM: haversineMeters(lat, lng, v.lat, v.lng) }))
        .filter((v) => v.distanceM <= radiusM)
        .sort((a, b) => a.distanceM - b.distanceM);
    } else {
      filtered = allVenues.map((v) => ({ ...v, distanceM: null }));
    }

    const offset = (page - 1) * pageSize;
    const paged = filtered.slice(offset, offset + pageSize);

    const items = await this.assembleListItems(paged);
    return { items, page, pageSize };
  }

  async getById(id: string): Promise<VenueDetailDto> {
    const venue = await this.prisma.venue.findUnique({
      where: { id },
      include: {
        createdBy: { select: { id: true, name: true } },
        lastEditedBy: { select: { id: true, name: true } },
        reviews: {
          where: { isPublished: true },
          include: { account: { select: { id: true, name: true, avatarUrl: true } } },
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    });

    if (!venue || !venue.isPublished || venue.isClosed) throw new NotFoundException('Venue not found');

    const stats = await this.prisma.review.aggregate({
      where: { venueId: id, isPublished: true },
      _avg: { rating: true },
      _count: { _all: true },
    });

    return {
      id: venue.id,
      slug: venue.id,
      name: venue.name,
      category: venue.category,
      address: venue.address,
      lat: venue.lat,
      lng: venue.lng,
      city: venue.city,
      coverCharge: venue.coverCharge,
      musicGenres: parseJsonArray(venue.musicGenres),
      crowdTypes: parseJsonArray(venue.crowdTypes),
      priceRange: venue.priceRange,
      hoursJson: venue.hoursJson as Record<string, string> | null,
      photos: parseJsonArray(venue.photos),
      isPublished: venue.isPublished,
      topRating: stats._avg.rating ?? null,
      reviewCount: stats._count._all,
      distanceM: null,
      createdById: venue.createdById,
      createdByName: venue.createdBy?.name ?? '',
      lastEditedById: venue.lastEditedById,
      lastEditedByName: venue.lastEditedBy?.name ?? '',
      createdAt: venue.createdAt.toISOString(),
      updatedAt: venue.updatedAt.toISOString(),
      reviews: venue.reviews.map((r) => ({
        id: r.id,
        rating: r.rating,
        textBody: r.textBody,
        tags: parseJsonArray(r.tags ?? []),
        isPublished: r.isPublished,
        createdAt: r.createdAt.toISOString(),
        author: {
          id: r.account.id,
          name: r.account.name,
          avatarUrl: r.account.avatarUrl,
        },
      })),
    };
  }

  async suggestVenue(input: CreateVenueInput, accountId: string) {
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
        isPublished: true,
        createdById: accountId,
        lastEditedById: accountId,
      },
    });
    return { id: venue.id, name: venue.name, category: venue.category, isPublished: venue.isPublished };
  }

  private async assembleListItems(
    venues: ({ id: string; name: string; category: string; address: string; lat: number; lng: number; city: string; coverCharge: number | null; musicGenres: unknown; crowdTypes: unknown; priceRange: string | null; photos: unknown; isPublished: boolean; distanceM: number | null } & Record<string, unknown>)[],
  ): Promise<VenueListItemDto[]> {
    if (venues.length === 0) return [];

    const reviewStats = await this.prisma.review.groupBy({
      by: ['venueId'],
      where: { isPublished: true },
      _avg: { rating: true },
      _count: { _all: true },
    });

    const statsByVenue = new Map(reviewStats.map((s) => [s.venueId, s]));

    return venues.map((venue) => ({
      id: venue.id,
      slug: venue.id,
      name: venue.name,
      category: venue.category as VenueListItemDto['category'],
      address: venue.address,
      lat: venue.lat,
      lng: venue.lng,
      city: venue.city,
      coverCharge: venue.coverCharge,
      musicGenres: parseJsonArray(venue.musicGenres),
      crowdTypes: parseJsonArray(venue.crowdTypes),
      priceRange: venue.priceRange as VenueListItemDto['priceRange'],
      photos: parseJsonArray(venue.photos),
      isPublished: venue.isPublished,
      topRating: statsByVenue.get(venue.id)?._avg?.rating ?? null,
      reviewCount: statsByVenue.get(venue.id)?._count?._all ?? 0,
      distanceM: venue.distanceM,
    }));
  }
}
