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
  createAccountSchema,
  createInviteSchema,
  bulkCreateInviteSchema,
  resetPasswordSchema,
  updateAccountSchema,
} from '@chiwitrakmaochaaowelarakkhrai/shared-types';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import type { JwtPayload } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMINISTRATOR')
  me(@CurrentUser() user: JwtPayload) {
    return this.adminService.getProfile(user.sub);
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMINISTRATOR')
  stats() {
    return this.adminService.getStats();
  }

  @Get('accounts')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMINISTRATOR')
  listAccounts() {
    return this.adminService.listAccounts();
  }

  @Post('accounts')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMINISTRATOR')
  createAccount(
    @Body(new ZodValidationPipe(createAccountSchema)) body: ReturnType<typeof createAccountSchema.parse>,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.adminService.createAccount(body, user.sub);
  }

  @Patch('accounts/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMINISTRATOR')
  updateAccount(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateAccountSchema)) body: ReturnType<typeof updateAccountSchema.parse>,
  ) {
    return this.adminService.updateAccount(id, body);
  }

  @Post('accounts/:id/reset-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMINISTRATOR')
  async resetPassword(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(resetPasswordSchema)) body: ReturnType<typeof resetPasswordSchema.parse>,
  ) {
    await this.adminService.resetPassword(id, body.newPassword);
  }

  @Get('invites')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMINISTRATOR')
  listInvites() {
    return this.adminService.listInvites();
  }

  @Post('invites')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMINISTRATOR')
  createInvite(
    @Body(new ZodValidationPipe(createInviteSchema)) body: ReturnType<typeof createInviteSchema.parse>,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.adminService.createInvite(body, user.sub);
  }

  @Post('invites/bulk')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMINISTRATOR')
  bulkCreateInvites(
    @Body(new ZodValidationPipe(bulkCreateInviteSchema)) body: ReturnType<typeof bulkCreateInviteSchema.parse>,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.adminService.bulkCreateInvites(body, user.sub);
  }

  @Delete('invites/:code')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMINISTRATOR')
  async revokeInvite(@Param('code') code: string) {
    await this.adminService.revokeInvite(code);
  }
}
