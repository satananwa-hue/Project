import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AdminVenuesController } from './admin-venues.controller';
import { AdminVenuesService } from './admin-venues.service';
import { PrismaModule } from '../prisma/prisma.module';
import { JwtConfigModule } from '../common/jwt-config.module';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';

@Module({
  imports: [PrismaModule, JwtConfigModule],
  controllers: [AdminController, AdminVenuesController],
  providers: [AdminService, AdminVenuesService, JwtAuthGuard, RolesGuard],
  exports: [AdminService],
})
export class AdminModule {}
