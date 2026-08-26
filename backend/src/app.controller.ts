import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
} from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('api/health')
  getHealth() {
    return this.appService.getHealth();
  }

  @Get('api/stats')
  async getStats() {
    return this.appService.getSiteStats();
  }

  @Get('api/messages')
  async getMessages() {
    return this.appService.getMessages();
  }

  @Post('api/messages')
  async saveMessage(@Body() body: { text?: string }) {
    const text = body?.text ?? '';
    if (typeof text !== 'string' || text.trim().length === 0) {
      throw new BadRequestException('Text is required');
    }

    if (text.trim().length > 280) {
      throw new BadRequestException('Text must be 280 characters or fewer');
    }

    return this.appService.saveMessage(text);
  }

  @Get('api/deploy/check-db')
  async checkDb() {
    return this.appService.checkDbConnection();
  }

  @Get('api/deploy/check-redis')
  async checkRedis() {
    return this.appService.checkRedisConnection();
  }

  @Get('api/deploy/env')
  getEnv() {
    return this.appService.getDeployEnv();
  }
}
