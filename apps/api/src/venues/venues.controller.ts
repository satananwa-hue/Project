import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Query, UseGuards } from '@nestjs/common';
import { createVenueSchema, venueSearchSchema } from '@chiwitrakmaochaaowelarakkhrai/shared-types';
import { VenuesService } from './venues.service';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { JwtPayload } from '../common/guards/jwt-auth.guard';

@Controller('venues')
export class VenuesController {
  constructor(private readonly venuesService: VenuesService) {}

  @Get()
  search(@Query(new ZodValidationPipe(venueSearchSchema)) query: ReturnType<typeof venueSearchSchema.parse>) {
    return this.venuesService.search(query);
  }

  @Get(':id')
  getById(@Param('id') id: string) {
    return this.venuesService.getById(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard)
  suggestVenue(
    @Body(new ZodValidationPipe(createVenueSchema)) body: ReturnType<typeof createVenueSchema.parse>,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.venuesService.suggestVenue(body, user.sub);
  }
}
