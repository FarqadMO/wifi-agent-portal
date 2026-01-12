import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const logger = new Logger('Bootstrap');

  // Get configuration
  const port = configService.get<number>('app.port')!;
  const apiPrefix = configService.get<string>('app.apiPrefix')!;
  const swaggerEnabled = configService.get<boolean>('swagger.enabled');

  // Global prefix
  app.setGlobalPrefix(apiPrefix);

  // Security - Helmet
  app.use(helmet());

  // CORS configuration
  app.enableCors({
    origin: configService.get<string>('CORS_ORIGIN')?.split(',') || '*',
    methods: configService.get<string>('CORS_METHODS')?.split(',') || 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: configService.get<string>('CORS_CREDENTIALS') === 'true',
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Correlation-Id'],
    exposedHeaders: ['X-Correlation-Id'],
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Swagger documentation
  if (swaggerEnabled) {
    const config = new DocumentBuilder()
      .setTitle(configService.get<string>('swagger.title')!)
      .setDescription(configService.get<string>('swagger.description')!)
      .setVersion(configService.get<string>('swagger.version')!)
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          name: 'Authorization',
          description: 'Enter JWT token',
          in: 'header',
        },
        'bearer',
      )
      .addTag('Authentication', 'Authentication endpoints for system users and agents')
      .addTag('SAS Systems', 'SAS Radius system management endpoints')
      .addTag('Managers', 'Manager tree hierarchy endpoints (agent-only)')
      .addTag('Users', 'System user management endpoints')
      .addTag('Agents', 'Agent management endpoints')
      .addTag('Wallet', 'Wallet and balance endpoints')
      .addTag('Transactions', 'Transaction history endpoints')
      .addTag('Audit', 'Audit log endpoints')
      .addTag('Roles', 'Role management endpoints')
      .addTag('Permissions', 'Permission management endpoints')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup(configService.get<string>('swagger.path')!, app, document, {
      swaggerOptions: {
        persistAuthorization: true,
        tagsSorter: 'alpha',
        operationsSorter: 'alpha',
      },
    });

    logger.log(
      `Swagger documentation available at: http://localhost:${port}/${configService.get<string>('swagger.path')}`,
    );
  }

  await app.listen(port);
  logger.log(`🚀 Application is running on: http://localhost:${port}/${apiPrefix}`);
}

bootstrap();
