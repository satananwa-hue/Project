import {
  Body,
  Controller,
  Param,
  Patch,
  Post,
  UseGuards,
  UsePipes,
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

@Controller('admin/venues')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminVenuesController {
  constructor(private readonly adminVenuesService: AdminVenuesService) {}

  @Post()
  @UsePipes(new ZodValidationPipe(createVenueSchema))
  create(@Body() body: ReturnType<typeof createVenueSchema.parse>) {
    return this.adminVenuesService.create(body);
  }

  @Patch(':id')
  @UsePipes(new ZodValidationPipe(updateVenueSchema))
  update(
    @Param('id') id: string,
    @Body() body: ReturnType<typeof updateVenueSchema.parse>,
  ) {
    return this.adminVenuesService.update(id, body);
  }
}
