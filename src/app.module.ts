import { Module, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { createObserveModule } from '@nestjs/observe';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { ServeStaticModule } from '@nestjs/serve-static';
import { ConfigModule } from '@nestjs/config';
import configuration from './config/configuration.js';
import { existsSync } from 'node:fs';
import { ApiKeyMiddleware } from './libs/middlewares/api-key.middleware.js';
import { join } from 'node:path';
import { PrismaModule } from './prisma/prisma.module.js';
export const { ObserveModule, ObserveInstrument } = createObserveModule();

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.env',
      isGlobal: true,
      load: [configuration],
    }),
    PrismaModule,
    // Distributed tracing, auto-correlated logs, request/job metrics, error
    // telemetry, alarms, and more — out of the box. Sign up at https://observe.nestjs.com,
    // then run `npx @nestjs/observe link` to write your key pair into .env.
    ObserveModule.forRoot({
      appKey: process.env.OBSERVE_APP_KEY,
      appSecret: process.env.OBSERVE_APP_SECRET,
      serviceId: 'test-chat-app',
      forwardLogs: true,
      redaction: {
        enabled: true,
        keys: ['authorization', 'cookie', 'password', 'token', 'accessToken', 'refreshToken'],
      },
    }),
    ServeStaticModule.forRoot({
      rootPath: existsSync(join(import.meta.dirname, 'public'))
        ? join(import.meta.dirname, 'public')
        : join(import.meta.dirname, '..', 'src', 'public'),
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(ApiKeyMiddleware)
      .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}
