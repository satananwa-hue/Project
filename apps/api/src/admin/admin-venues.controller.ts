import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  createVenueSchema,
  updateVenueSchema,
} from '@chiwitrakmaochaaowelarakkhrai/shared-types';
import { AdminVenuesService } from './admin-venues.service';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { JwtPayload } from '../common/guards/jwt-auth.guard';

@Controller('admin/venues')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMINISTRATOR')
export class AdminVenuesController {
  constructor(private readonly adminVenuesService: AdminVenuesService) {}

  @Get()
  list() {
    return this.adminVenuesService.list();
  }

  @Post()
  create(
    @Body(new ZodValidationPipe(createVenueSchema)) body: ReturnType<typeof createVenueSchema.parse>,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.adminVenuesService.create(body, user.sub);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateVenueSchema)) body: ReturnType<typeof updateVenueSchema.parse>,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.adminVenuesService.update(id, body, user.sub);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    await this.adminVenuesService.remove(id);
  }

  /** Mark all OTHER-category venues with no reviews as isClosed. */
  @Post('cleanup/non-bar')
  cleanupNonBar() {
    return this.adminVenuesService.cleanupNonBarVenues();
  }

  /** Mark ALL unreviewed venues as isClosed. Use before a fresh import. */
  @Post('cleanup/unreviewed')
  cleanupUnreviewed() {
    return this.adminVenuesService.cleanupUnreviewedVenues();
  }
}
