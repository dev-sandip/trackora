import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { Logger, ValidationPipe, VersioningType } from '@nestjs/common';
import { HttpExceptionFilter } from '@/common/filters/http-exception.filter.js';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { apiReference } from '@scalar/nestjs-api-reference';
import cookieParser from 'cookie-parser';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const logger = new Logger('Bootstrap');

  const PORT = configService.get<number>('PORT') ?? 3000;
  const API_PREFIX = configService.get<string>('API_PREFIX') ?? 'api';
  const NODE_ENV = configService.get<string>('NODE_ENV') ?? 'development';
  const SWAGGER_ENABLED =
    configService.get<string>('SWAGGER_ENABLED') === 'true';
  const FRONTEND_URL =
    configService.get<string>('FRONTEND_URL') ?? 'http://localhost:5173';

  app.setGlobalPrefix(API_PREFIX);

  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });
  app.use(cookieParser());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());

  app.enableCors({
    origin: FRONTEND_URL,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  const swaggerEnabled = NODE_ENV !== 'production' || SWAGGER_ENABLED;

  if (swaggerEnabled) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Trackio API')
      .setDescription('Trackio API documentation')
      .setVersion('1.0.0')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
        'bearerAuth',
      )
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    app.use('/openapi.json', (req: any, res: any) => {
      res.setHeader('Content-Type', 'application/json');
      res.send(document);
    });
    app.use(
      '/docs',
      apiReference({
        content: document,
        theme: 'bluePlanet',
        authentication: {
          preferredSecurityScheme: 'bearerAuth',
        },
      }),
    );
  }

  app.enableShutdownHooks();

  await app.listen(PORT);

  const baseUrl = await app.getUrl();
  const apiUrl = `${baseUrl}/${API_PREFIX}/v1`;

  logger.log('🚀 Trackio API started successfully!');
  logger.log(`🌐 Application URL: ${baseUrl}`);
  logger.log(`🔗 API Base URL: ${apiUrl}`);

  if (swaggerEnabled) {
    logger.log(`📚 Swagger UI: ${baseUrl}/docs`);
    logger.log(`📄 OpenAPI JSON: ${baseUrl}/openapi.json`);
  } else {
    logger.log('🔒 Swagger documentation is disabled in production.');
  }

  logger.log(`🌍 Environment: ${NODE_ENV}`);
}

void bootstrap();
