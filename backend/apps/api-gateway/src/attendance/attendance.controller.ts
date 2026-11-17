import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Inject,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiPropertyOptional, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { ATTENDANCE_PATTERNS, mapRpcErrorToHttp, SERVICE_TOKENS } from '@app/shared';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuthenticatedUser } from '../auth/jwt.strategy';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';

export class CheckInDto {
  @ApiPropertyOptional({ example: 'WFH dari rumah, fokus sprint modul absensi.' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class MyAttendanceQueryDto {
  @ApiPropertyOptional({ example: '2026-11-01' })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional({ example: '2026-11-30' })
  @IsOptional()
  @IsString()
  endDate?: string;

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

export class AttendanceQueryDto extends MyAttendanceQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  department?: string;

  @ApiPropertyOptional({ example: '2026-11-17' })
  @IsOptional()
  @IsString()
  date?: string;
}

const ALLOWED_IMAGE_MIMES = new Set(['image/jpeg', 'image/png', 'image/webp']);

@ApiTags('Attendances')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('attendances')
export class AttendanceController {
  constructor(
    @Inject(SERVICE_TOKENS.ATTENDANCE_SERVICE) private readonly attendanceClient: ClientProxy,
  ) {}

  @Post('check-in')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['photo'],
      properties: {
        photo: { type: 'string', format: 'binary' },
        notes: { type: 'string' },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('photo', {
      storage: diskStorage({
        destination: (_req, _file, cb) => {
          const uploadDir = process.env.UPLOAD_DIR ?? './uploads';
          cb(null, join(process.cwd(), uploadDir, 'attendances'));
        },
        filename: (_req, file, cb) => {
          const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
          const extension = extname(file.originalname).toLowerCase() || '.jpg';
          cb(null, `wfh-${uniqueSuffix}${extension}`);
        },
      }),
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        if (!ALLOWED_IMAGE_MIMES.has(file.mimetype)) {
          return cb(new BadRequestException('Format foto harus JPG, PNG, atau WEBP.'), false);
        }
        cb(null, true);
      },
    }),
  )
  checkIn(
    @CurrentUser() user: AuthenticatedUser,
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body() dto: CheckInDto,
  ) {
    if (!user.employeeId) {
      throw new BadRequestException('Akun ini tidak terhubung dengan profil karyawan.');
    }
    if (!file) {
      throw new BadRequestException('Foto bukti WFH wajib diunggah.');
    }

    const photoUrl = `/uploads/attendances/${file.filename}`;
    return this.attendanceClient
      .send(ATTENDANCE_PATTERNS.CREATE, {
        employeeId: user.employeeId,
        photoUrl,
        notes: dto.notes,
      })
      .pipe(mapRpcErrorToHttp());
  }

  @Get('today')
  getTodayStatus(@CurrentUser() user: AuthenticatedUser) {
    if (!user.employeeId) {
      throw new BadRequestException('Akun ini tidak terhubung dengan profil karyawan.');
    }
    return this.attendanceClient
      .send(ATTENDANCE_PATTERNS.TODAY_STATUS, { employeeId: user.employeeId })
      .pipe(mapRpcErrorToHttp());
  }

  @Get('my')
  findMy(@CurrentUser() user: AuthenticatedUser, @Query() query: MyAttendanceQueryDto) {
    if (!user.employeeId) {
      throw new BadRequestException('Akun ini tidak terhubung dengan profil karyawan.');
    }
    return this.attendanceClient
      .send(ATTENDANCE_PATTERNS.FIND_MY, {
        ...query,
        employeeId: user.employeeId,
      })
      .pipe(mapRpcErrorToHttp());
  }

  @Roles(Role.HRD_ADMIN)
  @Get()
  findAll(@Query() query: AttendanceQueryDto) {
    return this.attendanceClient
      .send(ATTENDANCE_PATTERNS.FIND_ALL, query)
      .pipe(mapRpcErrorToHttp());
  }
}
