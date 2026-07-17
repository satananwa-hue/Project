import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type {
  CreateReviewInput,
  ReviewDetailDto,
  UpdateReviewInput,
} from '@chiwitrakmaochaaowelarakkhrai/shared-types';

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  async listForVenue(venueId: string, publishedOnly = true): Promise<ReviewDetailDto[]> {
    const reviews = await this.prisma.review.findMany({
      where: { venueId, ...(publishedOnly && { isPublished: true }) },
      include: {
        account: { select: { id: true, name: true, avatarUrl: true } },
        venue: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return reviews.map((r) => this.toDto(r));
  }

  async getById(id: string): Promise<ReviewDetailDto> {
    const review = await this.prisma.review.findUnique({
      where: { id },
      include: {
        account: { select: { id: true, name: true, avatarUrl: true } },
        venue: { select: { name: true } },
      },
    });
    if (!review) throw new NotFoundException('Review not found');
    return this.toDto(review);
  }

  async create(input: CreateReviewInput, accountId: string): Promise<ReviewDetailDto> {
    const venue = await this.prisma.venue.findUnique({ where: { id: input.venueId } });
    if (!venue) throw new NotFoundException('Venue not found');

    const duplicate = await this.prisma.review.findFirst({
      where: { venueId: input.venueId, accountId },
    });
    if (duplicate) throw new ConflictException('You have already reviewed this venue');

    const pointsEarned =
      1 + // rating
      (input.textBody.trim().length > 0 ? 10 : 0) + // text review
      (input.textBody.trim().length >= 200 ? 5 : 0) + // long review bonus
      (input.musicGenreNotes?.trim() ? 2 : 0) + // music notes
      (input.priceLevelNotes?.trim() ? 2 : 0) + // price notes
      (input.crowdNotes?.trim() ? 2 : 0); // crowd notes

    const [review] = await this.prisma.$transaction([
      this.prisma.review.create({
        data: {
          venueId: input.venueId,
          accountId,
          rating: input.rating,
          textBody: input.textBody,
          media: input.media ?? [],
          tags: input.tags ?? [],
          musicGenreNotes: input.musicGenreNotes ?? null,
          priceLevelNotes: input.priceLevelNotes ?? null,
          crowdNotes: input.crowdNotes ?? null,
          isPublished: input.isPublished ?? false,
        },
        include: {
          account: { select: { id: true, name: true, avatarUrl: true } },
          venue: { select: { name: true } },
        },
      }),
      this.prisma.account.update({
        where: { id: accountId },
        data: { points: { increment: pointsEarned } },
      }),
    ]);

    return this.toDto(review);
  }

  async update(
    id: string,
    input: UpdateReviewInput,
    accountId: string,
    role: string,
  ): Promise<ReviewDetailDto> {
    const review = await this.prisma.review.findUnique({ where: { id } });
    if (!review) throw new NotFoundException('Review not found');
    if (review.accountId !== accountId && role !== 'ADMINISTRATOR') {
      throw new ForbiddenException('You do not own this review');
    }

    const updated = await this.prisma.review.update({
      where: { id },
      data: {
        ...(input.rating !== undefined && { rating: input.rating }),
        ...(input.textBody !== undefined && { textBody: input.textBody }),
        ...(input.media !== undefined && { media: input.media }),
        ...(input.tags !== undefined && { tags: input.tags }),
        ...(input.musicGenreNotes !== undefined && { musicGenreNotes: input.musicGenreNotes }),
        ...(input.priceLevelNotes !== undefined && { priceLevelNotes: input.priceLevelNotes }),
        ...(input.crowdNotes !== undefined && { crowdNotes: input.crowdNotes }),
        ...(input.isPublished !== undefined && { isPublished: input.isPublished }),
      },
      include: {
        account: { select: { id: true, name: true, avatarUrl: true } },
        venue: { select: { name: true } },
      },
    });

    return this.toDto(updated);
  }

  async remove(id: string, accountId: string, role: string): Promise<void> {
    const review = await this.prisma.review.findUnique({ where: { id } });
    if (!review) throw new NotFoundException('Review not found');
    if (review.accountId !== accountId && role !== 'ADMINISTRATOR') {
      throw new ForbiddenException('You do not own this review');
    }

    const pointsToDeduct =
      1 +
      (review.textBody.trim().length > 0 ? 10 : 0) +
      (review.textBody.trim().length > 200 ? 5 : 0) +
      (review.musicGenreNotes?.trim() ? 2 : 0) +
      (review.priceLevelNotes?.trim() ? 2 : 0) +
      (review.crowdNotes?.trim() ? 2 : 0);

    await this.prisma.$transaction([
      this.prisma.review.delete({ where: { id } }),
      this.prisma.account.update({
        where: { id: review.accountId },
        data: { points: { decrement: pointsToDeduct } },
      }),
    ]);
  }

  async claimSocialShare(id: string, accountId: string): Promise<{ points: number }> {
    const review = await this.prisma.review.findUnique({ where: { id } });
    if (!review) throw new NotFoundException('Review not found');
    if (review.accountId !== accountId) {
      throw new ForbiddenException('You do not own this review');
    }
    await this.prisma.account.update({
      where: { id: accountId },
      data: { points: { increment: 5 } },
    });
    return { points: 5 };
  }

  private toDto(review: {
    id: string;
    venueId: string;
    rating: number;
    textBody: string;
    media: unknown;
    tags: unknown;
    musicGenreNotes: string | null;
    priceLevelNotes: string | null;
    crowdNotes: string | null;
    isPublished: boolean;
    createdAt: Date;
    updatedAt: Date;
    account: { id: string; name: string; avatarUrl: string | null };
    venue: { name: string };
  }): ReviewDetailDto {
    return {
      id: review.id,
      venueId: review.venueId,
      venueName: review.venue.name,
      rating: review.rating,
      textBody: review.textBody,
      media: ((review.media ?? []) as { url: string; type: 'photo' | 'video' }[]),
      tags: (review.tags ?? []) as string[],
      musicGenreNotes: review.musicGenreNotes,
      priceLevelNotes: review.priceLevelNotes,
      crowdNotes: review.crowdNotes,
      isPublished: review.isPublished,
      createdAt: review.createdAt.toISOString(),
      updatedAt: review.updatedAt.toISOString(),
      author: {
        id: review.account.id,
        name: review.account.name,
        avatarUrl: review.account.avatarUrl,
      },
    };
  }
}
