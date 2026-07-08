import { Controller, Get, Param, Query, UsePipes } from '@nestjs/common';
import { venueSearchSchema } from '@chiwitrakmaochaaowelarakkhrai/shared-types';
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

  // Must be registered before ':slug' - otherwise NestJS would match
  // "categories" as a slug value and this route would never be reached.
  @Get('categories')
  listCategories() {
    return this.venuesService.listCategories();
  }

  @Get(':slug')
  getBySlug(@Param('slug') slug: string) {
    return this.venuesService.getBySlug(slug);
  }
}
