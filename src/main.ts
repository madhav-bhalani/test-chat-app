import { ConsoleLogger, ValidationError, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { NestNodeApplication, NodeAdapter } from '@nestjs/platform-node';
import { AppModule } from './app.module.js';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { AllExceptionsFilter } from './libs/filters/all-exceptions.filter.js';
import { ResponseHandler } from './libs/dtos/response.dto.js';

async function bootstrap() {
  const logger = new ConsoleLogger({
    logLevels: ['log', 'warn', 'error', 'fatal'],
    redact: ['authorization', 'cookie', 'password', 'token', 'accessToken', 'refreshToken'],
  });

  const app = await NestFactory.create<NestNodeApplication>(
    AppModule,
    new NodeAdapter(),
    { logger },
  );

  const configService = app.get(ConfigService);
  const port = configService.getOrThrow<number>('port');
  const allowedOrigins = configService.getOrThrow<string[]>('cors.allowedOrigins');

  app.useBodyParser('json', { limit: '50mb' });
  app.useBodyParser('urlencoded', { limit: '50mb', extended: true });
  app.use(cookieParser());

  app.enableCors({
    origin: allowedOrigins,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          imgSrc: ["'self'", '*', 'data:', 'blob:'],
          scriptSrc: ["'self'", "'unsafe-inline'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
        },
      },
      crossOriginResourcePolicy: false,
    }),
  );

  app.useGlobalFilters(new AllExceptionsFilter());

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      exceptionFactory: (errors: ValidationError[]) => {
        const extractError = (error: ValidationError): string => {
          const constraint = error.constraints
            ? Object.values(error.constraints)[0]
            : undefined;
          if (constraint) {
            return constraint;
          }

          const child = error.children?.[0];
          if (child) {
            return extractError(child);
          }

          return 'Validation failed';
        };

        const firstError = extractError(errors[0]);
        return ResponseHandler.sendBadRequest(firstError);
      },
      stopAtFirstError: true,
    }),
  );

  app.enableShutdownHooks();

  await app.listen(port);
  logger.log(`Server ready at ${port}`);
}

await bootstrap();
