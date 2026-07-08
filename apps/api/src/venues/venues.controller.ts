import { Controller, Get, Param, Query, UsePipes } from '@nestjs/common';
import { venueSearchSchema } from '@nightcheck/shared-types';
import { VenuesService } from './venues.service';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';

@Controller('venues')
export class VenuesController {
  constructor(private readonly venuesService: VenuesService) {}

  @Get()
  @UsePipes(new ZodValidationPipe(venueSearchSchema))
  search(@Query() query: ReturnType<typeof venueSearchSchema.parse>) {
    return this.venuesService.search(query);
  }

  @Get(':slug')
  getBySlug(@Param('slug') slug: string) {
    return this.venuesService.getBySlug(slug);
  }
}
