import { Injectable } from '@nestjs/common';
import { DatabaseService } from './database/database.service';
import { RedisService } from './redis.service';

@Injectable()
export class AppService {
  private static readonly VISIT_COUNT_CACHE_KEY = 'simple-site:visits:count';
  private static readonly LAST_VISIT_CACHE_KEY = 'simple-site:last-visit';
  private static readonly CACHE_TTL_SECONDS = 300;

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly redisService: RedisService,
  ) {}

  getHealth() {
    return {
      status: 'ok',
      service: 'simple-siteB',
    };
  }

  async getSiteStats() {
    const visit = await this.databaseService.recordVisit();

    const cachedCount = await this.redisService
      .getClient()
      .get(AppService.VISIT_COUNT_CACHE_KEY);

    let totalVisits = await this.databaseService.countVisits();
    if (cachedCount !== null && Number.isFinite(Number(cachedCount))) {
      totalVisits = Number(cachedCount) + 1;
    }

    await this.redisService
      .getClient()
      .multi()
      .set(
        AppService.VISIT_COUNT_CACHE_KEY,
        String(totalVisits),
        'EX',
        AppService.CACHE_TTL_SECONDS,
      )
      .set(
        AppService.LAST_VISIT_CACHE_KEY,
        visit.createdAt.toISOString(),
        'EX',
        AppService.CACHE_TTL_SECONDS,
      )
      .exec();

    return {
      totalVisits,
      lastVisitAt: visit.createdAt.toISOString(),
      cacheTtlSeconds: AppService.CACHE_TTL_SECONDS,
    };
  }

  async getMessages() {
    const messages = await this.databaseService.listMessages(20);

    return messages.map((message) => ({
      id: message.id,
      text: message.text,
      createdAt: message.createdAt.toISOString(),
    }));
  }

  async saveMessage(rawText: string) {
    const text = rawText.trim();
    const saved = await this.databaseService.saveMessage(text);

    return {
      id: saved.id,
      text: saved.text,
      createdAt: saved.createdAt.toISOString(),
    };
  }

  async checkDbConnection() {
    try {
      await this.databaseService.ping();
      const count = await this.databaseService.countVisits();
      return {
        dbConnected: true,
        type: this.databaseService.type,
        host: this.databaseService.host,
        port: this.databaseService.port,
        database: this.databaseService.database,
        visitCount: count,
      };
    } catch (error) {
      return {
        dbConnected: false,
        type: this.databaseService.type,
        host: this.databaseService.host,
        port: this.databaseService.port,
        database: this.databaseService.database,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  async checkRedisConnection() {
    try {
      const client = this.redisService.getClient();
      const pong = await client.ping();
      return {
        redisConnected: pong === 'PONG',
        cacheTtlSeconds: AppService.CACHE_TTL_SECONDS,
      };
    } catch (error) {
      return {
        redisConnected: false,
        cacheTtlSeconds: AppService.CACHE_TTL_SECONDS,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  getDeployEnv() {
    return {
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      nodeEnv: process.env.NODE_ENV ?? 'not set',
      npmVersion: process.env.npm_package_version ?? 'not set',
    };
  }
}
