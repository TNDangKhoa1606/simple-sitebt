import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;
  const appServiceMock = {
    getHealth: jest.fn(() => ({ status: 'ok', service: 'simple-site' })),
    getSiteStats: jest.fn(() =>
      Promise.resolve({
        totalVisits: 1,
        lastVisitAt: new Date().toISOString(),
        cacheTtlSeconds: 300,
      }),
    ),
    getMessages: jest.fn(() => Promise.resolve([])),
    saveMessage: jest.fn((text: string) =>
      Promise.resolve({
        id: 1,
        text,
        createdAt: new Date().toISOString(),
      }),
    ),
  };

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        {
          provide: AppService,
          useValue: appServiceMock,
        },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('api/health', () => {
    it('should return app health', () => {
      expect(appController.getHealth()).toEqual({
        status: 'ok',
        service: 'simple-site',
      });
    });
  });

  describe('api/stats', () => {
    it('should return site stats', async () => {
      const stats = await appController.getStats();
      expect(stats.totalVisits).toBe(1);
      expect(stats.cacheTtlSeconds).toBe(300);
    });
  });

  describe('api/messages', () => {
    it('should return list of messages', async () => {
      await expect(appController.getMessages()).resolves.toEqual([]);
    });

    it('should save a message', async () => {
      await expect(
        appController.saveMessage({ text: 'hello db' }),
      ).resolves.toMatchObject({
        text: 'hello db',
      });
    });
  });
});
