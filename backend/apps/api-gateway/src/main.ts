import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as fs from 'fs';
import { join } from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  const corsOrigins = (process.env.CORS_ORIGINS ?? 'http://localhost:5173,http://localhost:5174')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.enableCors({
    origin: corsOrigins,
    credentials: true,
  });

  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  const uploadDir = process.env.UPLOAD_DIR ?? './uploads';
  const absoluteUploadPath = join(process.cwd(), uploadDir);
  fs.mkdirSync(join(absoluteUploadPath, 'attendances'), { recursive: true });
  app.useStaticAssets(absoluteUploadPath, {
    prefix: '/uploads/',
  });

  const swaggerConfig = new DocumentBuilder()
    .setTitle('WFH Attendance & HRD Monitoring API')
    .setDescription('API Gateway for Auth, Employee Management, and WFH Attendance Microservices')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  const port = Number(process.env.GATEWAY_PORT ?? 3000);
  await app.listen(port);
  Logger.log(`API Gateway running on http://localhost:${port}/api`, 'ApiGateway');
  Logger.log(`Swagger docs available at http://localhost:${port}/api/docs`, 'ApiGateway');
}

bootstrap();
