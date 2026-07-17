import { Module } from '@nestjs/common';
import { ReviewsController } from './reviews.controller';
import { ReviewsService } from './reviews.service';
import { JwtConfigModule } from '../common/jwt-config.module';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';

@Module({
  imports: [JwtConfigModule],
  controllers: [ReviewsController],
  providers: [ReviewsService, JwtAuthGuard, RolesGuard],
})
export class ReviewsModule {}
