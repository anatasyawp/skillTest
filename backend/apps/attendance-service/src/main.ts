import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AttendanceModule } from './attendance.module';

async function bootstrap() {
  const host = process.env.ATTENDANCE_SERVICE_HOST ?? '127.0.0.1';
  const port = Number(process.env.ATTENDANCE_SERVICE_PORT ?? 3003);

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(AttendanceModule, {
    transport: Transport.TCP,
    options: { host, port },
  });

  await app.listen();
  Logger.log(`Attendance microservice listening on TCP ${host}:${port}`, 'AttendanceService');
}

bootstrap();
