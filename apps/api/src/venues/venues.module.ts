import { Module } from '@nestjs/common';
import { VenuesController } from './venues.controller';
import { VenuesService } from './venues.service';
import { JwtConfigModule } from '../common/jwt-config.module';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Module({
  imports: [JwtConfigModule],
  controllers: [VenuesController],
  providers: [VenuesService, JwtAuthGuard],
})
export class VenuesModule {}
