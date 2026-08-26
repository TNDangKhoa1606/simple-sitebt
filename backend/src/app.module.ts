import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BackendController } from './backend.controller';
import { DatabaseService } from './database/database.service';
import { RedisService } from './redis.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
  ],
  controllers: [AppController, BackendController],
  providers: [AppService, DatabaseService, RedisService],
})
export class AppModule {}
