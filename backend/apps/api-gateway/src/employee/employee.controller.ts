import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ApiBearerAuth, ApiProperty, ApiPropertyOptional, ApiTags } from '@nestjs/swagger';
import { EmployeeStatus, Role } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { EMPLOYEE_PATTERNS, mapRpcErrorToHttp, SERVICE_TOKENS } from '@app/shared';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';

export class EmployeeQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  department?: string;

  @ApiPropertyOptional({ enum: EmployeeStatus })
  @IsOptional()
  @IsEnum(EmployeeStatus)
  status?: EmployeeStatus;

  @ApiPropertyOptional({ type: Boolean, description: 'Filter karyawan aktif yang belum absen hari ini' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  notAttendedToday?: boolean;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}

export class CreateEmployeeDto {
  @ApiProperty({ example: 'dewi.lestari@company.local' })
  @IsEmail({}, { message: 'Format email tidak valid.' })
  email: string;

  @ApiProperty({ example: 'Password123!' })
  @IsString()
  @MinLength(6, { message: 'Password minimal 6 karakter.' })
  password: string;

  @ApiPropertyOptional({ enum: Role, default: Role.EMPLOYEE })
  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @ApiProperty({ example: '3174011508950001' })
  @IsString()
  @IsNotEmpty({ message: 'NIK wajib diisi.' })
  @Matches(/^\d{16}$/, { message: 'NIK harus terdiri dari tepat 16 digit angka.' })
  employeeCode: string;

  @ApiProperty({ example: 'Dewi Lestari' })
  @IsString()
  @IsNotEmpty({ message: 'Nama lengkap wajib diisi.' })
  fullName: string;

  @ApiProperty({ example: 'Engineering' })
  @IsString()
  @IsNotEmpty({ message: 'Departemen wajib diisi.' })
  department: string;

  @ApiProperty({ example: 'QA Engineer' })
  @IsString()
  @IsNotEmpty({ message: 'Jabatan wajib diisi.' })
  position: string;

  @ApiPropertyOptional({ example: '081234567899' })
  @IsOptional()
  @IsString()
  @MaxLength(15, { message: 'Nomor telepon maksimal 15 digit.' })
  @Matches(/^$|^\d{1,15}$/, { message: 'Nomor telepon hanya boleh berisi angka (maksimal 15 digit).' })
  phone?: string;

  @ApiPropertyOptional({ enum: EmployeeStatus, default: EmployeeStatus.ACTIVE })
  @IsOptional()
  @IsEnum(EmployeeStatus)
  status?: EmployeeStatus;
}

export class UpdateEmployeeDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail({}, { message: 'Format email tidak valid.' })
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(6, { message: 'Password minimal 6 karakter.' })
  password?: string;

  @ApiPropertyOptional({ enum: Role })
  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @ApiPropertyOptional({ example: '3174011508950001' })
  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'NIK wajib diisi.' })
  @Matches(/^\d{16}$/, { message: 'NIK harus terdiri dari tepat 16 digit angka.' })
  employeeCode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  fullName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  department?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  position?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(15, { message: 'Nomor telepon maksimal 15 digit.' })
  @Matches(/^$|^\d{1,15}$/, { message: 'Nomor telepon hanya boleh berisi angka (maksimal 15 digit).' })
  phone?: string;

  @ApiPropertyOptional({ enum: EmployeeStatus })
  @IsOptional()
  @IsEnum(EmployeeStatus)
  status?: EmployeeStatus;
}

@ApiTags('Employees (HRD Admin)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.HRD_ADMIN)
@Controller('employees')
export class EmployeeController {
  constructor(
    @Inject(SERVICE_TOKENS.EMPLOYEE_SERVICE) private readonly employeeClient: ClientProxy,
  ) {}

  @Get()
  findAll(@Query() query: EmployeeQueryDto) {
    return this.employeeClient
      .send(EMPLOYEE_PATTERNS.FIND_ALL, query)
      .pipe(mapRpcErrorToHttp());
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.employeeClient
      .send(EMPLOYEE_PATTERNS.FIND_ONE, { id })
      .pipe(mapRpcErrorToHttp());
  }

  @Post()
  create(@Body() dto: CreateEmployeeDto) {
    return this.employeeClient
      .send(EMPLOYEE_PATTERNS.CREATE, dto)
      .pipe(mapRpcErrorToHttp());
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateEmployeeDto) {
    return this.employeeClient
      .send(EMPLOYEE_PATTERNS.UPDATE, { id, data: dto })
      .pipe(mapRpcErrorToHttp());
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.employeeClient
      .send(EMPLOYEE_PATTERNS.DELETE, { id })
      .pipe(mapRpcErrorToHttp());
  }
}
