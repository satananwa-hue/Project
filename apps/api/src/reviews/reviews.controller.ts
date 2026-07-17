import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  createReviewSchema,
  updateReviewSchema,
} from '@chiwitrakmaochaaowelarakkhrai/shared-types';
import { ReviewsService } from './reviews.service';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { JwtPayload } from '../common/guards/jwt-auth.guard';

@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get()
  listForVenue(@Query('venueId') venueId: string) {
    if (!venueId) throw new BadRequestException('venueId query param is required');
    return this.reviewsService.listForVenue(venueId);
  }

  @Get(':id')
  getById(@Param('id') id: string) {
    return this.reviewsService.getById(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(
    @Body(new ZodValidationPipe(createReviewSchema)) body: ReturnType<typeof createReviewSchema.parse>,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.reviewsService.create(body, user.sub);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateReviewSchema)) body: ReturnType<typeof updateReviewSchema.parse>,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.reviewsService.update(id, body, user.sub, user.role);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard)
  async remove(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    await this.reviewsService.remove(id, user.sub, user.role);
  }

  @Post(':id/social-share')
  @UseGuards(JwtAuthGuard)
  claimSocialShare(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.reviewsService.claimSocialShare(id, user.sub);
  }
}
