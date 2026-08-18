import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppController } from './../src/app.controller';
import { AppService } from './../src/app.service';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        {
          provide: AppService,
          useValue: {
            getHealth: () => ({ status: 'ok', service: 'simple-site' }),
            getSiteStats: () =>
              Promise.resolve({
                totalVisits: 1,
                lastVisitAt: new Date().toISOString(),
                cacheTtlSeconds: 300,
              }),
            getMessages: () => Promise.resolve([]),
            saveMessage: (text: string) =>
              Promise.resolve({
                id: 1,
                text,
                createdAt: new Date().toISOString(),
              }),
          },
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/api/health (GET)', () => {
    return request(app.getHttpServer())
      .get('/api/health')
      .expect(200)
      .expect({ status: 'ok', service: 'simple-site' });
  });

  afterEach(async () => {
    await app.close();
  });
});
