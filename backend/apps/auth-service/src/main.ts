import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AuthModule } from './auth.module';

async function bootstrap() {
  const host = process.env.AUTH_SERVICE_HOST ?? '127.0.0.1';
  const port = Number(process.env.AUTH_SERVICE_PORT ?? 3001);

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(AuthModule, {
    transport: Transport.TCP,
    options: { host, port },
  });

  await app.listen();
  Logger.log(`Auth microservice listening on TCP ${host}:${port}`, 'AuthService');
}

bootstrap();
