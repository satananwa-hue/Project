import { Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import type { JwtPayload } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { InvitesService } from './invites.service';

@Controller('invites')
export class InvitesController {
  constructor(private readonly invitesService: InvitesService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('REVIEWER', 'ADMIN')
  createInvite(@CurrentUser() user: JwtPayload) {
    return this.invitesService.createInvite(user.sub);
  }

  @Get('mine')
  @UseGuards(JwtAuthGuard)
  listMine(@CurrentUser() user: JwtPayload) {
    return this.invitesService.listInvites(user.sub);
  }

  // Public leaderboard - invite conversion is a growth/trust signal we want
  // visible to the community, similar to "top reviewers".
  @Get('top-inviters')
  topInviters(@Query('limit') limit?: string) {
    return this.invitesService.topInviters(limit ? Number(limit) : undefined);
  }
}
