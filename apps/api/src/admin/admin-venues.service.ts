import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type {
  CreateVenueInput,
  UpdateVenueInput,
} from '@chiwitrakmaochaaowelarakkhrai/shared-types';

function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '') // strip combining diacritics after NFKD
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

@Injectable()
export class AdminVenuesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: CreateVenueInput) {
    const baseSlug = input.slug ?? slugify(input.name);
    const slug = await this.uniqueSlug(baseSlug);

    return this.prisma.venue.create({
      data: {
        name: input.name,
        slug,
        cityId: input.cityId,
        categoryId: input.categoryId,
        address: input.address,
        lat: input.lat,
        lng: input.lng,
        priceRange: input.priceRange,
        description: input.description,
        curatedRating: input.curatedRating,
        curatedReview: input.curatedReview,
        source: 'SEED', // admin-curated content, same provenance bucket as the seed script
      },
    });
  }

  async update(id: string, input: UpdateVenueInput) {
    const existing = await this.prisma.venue.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Venue not found');
    }

    const slug = input.slug ? await this.uniqueSlug(input.slug, id) : undefined;

    return this.prisma.venue.update({
      where: { id },
      data: {
        name: input.name,
        slug,
        cityId: input.cityId,
        categoryId: input.categoryId,
        address: input.address,
        lat: input.lat,
        lng: input.lng,
        priceRange: input.priceRange,
        description: input.description,
        curatedRating: input.curatedRating,
        curatedReview: input.curatedReview,
        status: input.status,
      },
    });
  }

  // Appends -2, -3, ... on collision. Excludes the venue being updated from
  // the collision check so re-saving a venue's own slug unchanged doesn't
  // needlessly get renamed.
  private async uniqueSlug(
    baseSlug: string,
    excludeId?: string,
  ): Promise<string> {
    let slug = baseSlug;
    let suffix = 2;
    while (
      await this.prisma.venue.findFirst({
        where: { slug, ...(excludeId && { id: { not: excludeId } }) },
        select: { id: true },
      })
    ) {
      slug = `${baseSlug}-${suffix}`;
      suffix += 1;
    }
    return slug;
  }
}
