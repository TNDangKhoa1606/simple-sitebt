import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly client: Redis;

  constructor(private readonly configService: ConfigService) {
    this.client = new Redis({
      host: this.configService.get<string>('REDIS_HOST', 'localhost'),
      port: parseInt(this.configService.get<string>('REDIS_PORT', '6379'), 10),
      password: this.configService.get<string>('REDIS_PASSWORD', ''),
      db: parseInt(this.configService.get<string>('REDIS_DB', '0'), 10),
      lazyConnect: true,
      maxRetriesPerRequest: 2,
    });

    this.client.connect().catch(() => {
      // Connection errors surface on usage and keep startup behavior simple.
    });
  }

  getClient(): Redis {
    return this.client;
  }

  async onModuleDestroy() {
    await this.client.quit();
  }
}
