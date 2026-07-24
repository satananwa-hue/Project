import { Controller, Get, Post } from '@nestjs/common';
import { AppService } from './app.service';
import { SeedService } from './seed.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly seedService: SeedService,
  ) {}

  @Get('health')
  health() {
    return this.appService.getHealth();
  }

  @Post('admin/run-seed')
  async runSeed() {
    await this.seedService.onModuleInit();
    return { ok: true };
  }
}
