import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { EmployeeModule } from './employee.module';

async function bootstrap() {
  const host = process.env.EMPLOYEE_SERVICE_HOST ?? '127.0.0.1';
  const port = Number(process.env.EMPLOYEE_SERVICE_PORT ?? 3002);

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(EmployeeModule, {
    transport: Transport.TCP,
    options: { host, port },
  });

  await app.listen();
  Logger.log(`Employee microservice listening on TCP ${host}:${port}`, 'EmployeeService');
}

bootstrap();
