import { Module } from '@nestjs/common';
import { InvitesController } from './invites.controller';
import { InvitesService } from './invites.service';
import { JwtConfigModule } from '../common/jwt-config.module';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Module({
  imports: [JwtConfigModule],
  controllers: [InvitesController],
  providers: [InvitesService, JwtAuthGuard],
})
export class InvitesModule {}
