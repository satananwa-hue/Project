import { Controller, Get, UseGuards } from '@nestjs/common';
import { InvitesService } from './invites.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import type { JwtPayload } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('invites')
export class InvitesController {
  constructor(private readonly invitesService: InvitesService) {}

  @Get('mine')
  @UseGuards(JwtAuthGuard)
  getMyInvites(@CurrentUser() user: JwtPayload) {
    return this.invitesService.getMyInvites(user.sub);
  }
}
