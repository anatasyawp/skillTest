import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { PassportModule } from '@nestjs/passport';
import { SERVICE_TOKENS } from '@app/shared';
import { AttendanceController } from './attendance/attendance.controller';
import { AuthController } from './auth/auth.controller';
import { JwtStrategy } from './auth/jwt.strategy';
import { RolesGuard } from './auth/roles.guard';
import { EmployeeController } from './employee/employee.controller';
import { HealthController } from './health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    ClientsModule.registerAsync([
      {
        name: SERVICE_TOKENS.AUTH_SERVICE,
        inject: [ConfigService],
        useFactory: (config: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            host: config.get<string>('AUTH_SERVICE_HOST', '127.0.0.1'),
            port: Number(config.get<string>('AUTH_SERVICE_PORT', '3001')),
          },
        }),
      },
      {
        name: SERVICE_TOKENS.EMPLOYEE_SERVICE,
        inject: [ConfigService],
        useFactory: (config: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            host: config.get<string>('EMPLOYEE_SERVICE_HOST', '127.0.0.1'),
            port: Number(config.get<string>('EMPLOYEE_SERVICE_PORT', '3002')),
          },
        }),
      },
      {
        name: SERVICE_TOKENS.ATTENDANCE_SERVICE,
        inject: [ConfigService],
        useFactory: (config: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            host: config.get<string>('ATTENDANCE_SERVICE_HOST', '127.0.0.1'),
            port: Number(config.get<string>('ATTENDANCE_SERVICE_PORT', '3003')),
          },
        }),
      },
    ]),
  ],
  controllers: [
    HealthController,
    AuthController,
    EmployeeController,
    AttendanceController,
  ],
  providers: [JwtStrategy, RolesGuard],
})
export class AppModule {}
