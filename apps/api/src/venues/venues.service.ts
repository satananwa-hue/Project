import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../../generated/prisma';
import { PrismaService } from '../prisma/prisma.service';
import type {
  VenueCategoryDto,
  VenueDetailDto,
  VenueListItemDto,
  VenueRatingSummary,
  VenueSearchInput,
} from '@chiwitrakmaochaaowelarakkhrai/shared-types';

interface GeoRow {
  id: string;
  distance_m: number;
}

@Injectable()
export class VenuesService {
  constructor(private readonly prisma: PrismaService) {}

  async search(
    params: VenueSearchInput,
  ): Promise<{ items: VenueListItemDto[]; page: number; pageSize: number }> {
    const { cityId, query, lat, lng, radiusM, categoryId, page, pageSize } =
      params;
    const offset = (page - 1) * pageSize;

    let venueIds: string[];
    let distanceById = new Map<string, number>();

    if (lat !== undefined && lng !== undefined) {
      const conditions: Prisma.Sql[] = [Prisma.sql`v.status = 'ACTIVE'`];
      if (cityId) conditions.push(Prisma.sql`v."cityId" = ${cityId}`);
      if (categoryId)
        conditions.push(Prisma.sql`v."categoryId" = ${categoryId}`);
      if (query) conditions.push(Prisma.sql`v.name ILIKE ${'%' + query + '%'}`);
      const whereClause = Prisma.join(conditions, ' AND ');

      // Haversine distance computed in SQL. `least/greatest` clamp guards against
      // acos() domain errors from floating point rounding at very small distances.
      const rows = await this.prisma.$queryRaw<GeoRow[]>(Prisma.sql`
        SELECT * FROM (
          SELECT v.id,
            (6371000 * acos(least(1, greatest(-1,
              cos(radians(${lat})) * cos(radians(v.lat)) * cos(radians(v.lng) - radians(${lng}))
              + sin(radians(${lat})) * sin(radians(v.lat))
            )))) AS distance_m
          FROM venues v
          WHERE ${whereClause}
        ) sub
        WHERE sub.distance_m <= ${radiusM}
        ORDER BY sub.distance_m ASC
        LIMIT ${pageSize} OFFSET ${offset}
      `);

      venueIds = rows.map((r) => r.id);
      distanceById = new Map(rows.map((r) => [r.id, r.distance_m]));
    } else {
      const venues = await this.prisma.venue.findMany({
        where: {
          status: 'ACTIVE',
          ...(cityId && { cityId }),
          ...(categoryId && { categoryId }),
          ...(query && { name: { contains: query, mode: 'insensitive' } }),
        },
        select: { id: true },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: pageSize,
      });
      venueIds = venues.map((v) => v.id);
    }

    const items = await this.assembleListItems(venueIds, distanceById);
    // Preserve the order search/distance produced above.
    const itemById = new Map(items.map((i) => [i.id, i]));
    const ordered = venueIds
      .map((id) => itemById.get(id))
      .filter((i): i is VenueListItemDto => !!i);

    return { items: ordered, page, pageSize };
  }

  async listCategories(): Promise<VenueCategoryDto[]> {
    return this.prisma.venueCategory.findMany({ orderBy: { name: 'asc' } });
  }

  async getBySlug(slug: string): Promise<VenueDetailDto> {
    const venue = await this.prisma.venue.findUnique({
      where: { slug },
      include: {
        category: true,
        tags: { include: { tag: true } },
        ratingAggregates: true,
      },
    });
    if (!venue || venue.status === 'CLOSED') {
      throw new NotFoundException('Venue not found');
    }

    const overall = await this.prisma.review.aggregate({
      where: { venueId: venue.id, status: 'PUBLISHED' },
      _avg: { overallRating: true },
      _count: { _all: true },
    });

    const coverPhoto = await this.prisma.reviewMedia.findFirst({
      where: {
        review: { venueId: venue.id, status: 'PUBLISHED' },
        type: 'PHOTO',
      },
      orderBy: { id: 'desc' },
    });

    const rating: VenueRatingSummary = {
      overall: overall._avg.overallRating ?? 0,
      reviewCount: overall._count._all,
      byDimension: Object.fromEntries(
        venue.ratingAggregates.map((a) => [a.dimension, a.avgScore]),
      ),
    };

    return {
      id: venue.id,
      slug: venue.slug,
      name: venue.name,
      categoryName: venue.category?.name ?? null,
      lat: venue.lat,
      lng: venue.lng,
      priceRange: venue.priceRange,
      distanceM: null,
      rating,
      coverPhotoUrl: coverPhoto?.url ?? null,
      curatedRating: venue.curatedRating,
      description: venue.description,
      address: venue.address,
      tags: venue.tags.map((t) => t.tag.labelEn),
      status: venue.status,
      curatedReview: venue.curatedReview,
    };
  }

  private async assembleListItems(
    venueIds: string[],
    distanceById: Map<string, number>,
  ): Promise<VenueListItemDto[]> {
    if (venueIds.length === 0) return [];

    const [venues, aggregates, overallStats, coverPhotos] = await Promise.all([
      this.prisma.venue.findMany({
        where: { id: { in: venueIds } },
        include: { category: true },
      }),
      this.prisma.venueRatingAggregate.findMany({
        where: { venueId: { in: venueIds } },
      }),
      this.prisma.review.groupBy({
        by: ['venueId'],
        where: { venueId: { in: venueIds }, status: 'PUBLISHED' },
        _avg: { overallRating: true },
        _count: { _all: true },
      }),
      this.prisma.reviewMedia.findMany({
        where: {
          review: { venueId: { in: venueIds }, status: 'PUBLISHED' },
          type: 'PHOTO',
        },
        include: { review: { select: { venueId: true } } },
        orderBy: { id: 'desc' },
      }),
    ]);

    const aggregatesByVenue = new Map<string, typeof aggregates>();
    for (const agg of aggregates) {
      const list = aggregatesByVenue.get(agg.venueId) ?? [];
      list.push(agg);
      aggregatesByVenue.set(agg.venueId, list);
    }
    const overallByVenue = new Map(overallStats.map((s) => [s.venueId, s]));
    const coverByVenue = new Map<string, string>();
    for (const media of coverPhotos) {
      const venueId = media.review.venueId;
      if (!coverByVenue.has(venueId)) {
        coverByVenue.set(venueId, media.url);
      }
    }

    return venues.map((venue) => {
      const overall = overallByVenue.get(venue.id);
      const dims = aggregatesByVenue.get(venue.id) ?? [];
      const rating: VenueRatingSummary = {
        overall: overall?._avg.overallRating ?? 0,
        reviewCount: overall?._count._all ?? 0,
        byDimension: Object.fromEntries(
          dims.map((d) => [d.dimension, d.avgScore]),
        ),
      };

      return {
        id: venue.id,
        slug: venue.slug,
        name: venue.name,
        categoryName: venue.category?.name ?? null,
        lat: venue.lat,
        lng: venue.lng,
        priceRange: venue.priceRange,
        distanceM: distanceById.get(venue.id) ?? null,
        rating,
        coverPhotoUrl: coverByVenue.get(venue.id) ?? null,
        curatedRating: venue.curatedRating,
      };
    });
  }
}
