import { Body, Controller, Get, Inject, Post, UseGuards } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ApiBearerAuth, ApiProperty, ApiTags } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { AUTH_PATTERNS, mapRpcErrorToHttp, SERVICE_TOKENS } from '@app/shared';
import { CurrentUser } from './current-user.decorator';
import { JwtAuthGuard } from './jwt-auth.guard';
import { AuthenticatedUser } from './jwt.strategy';

export class LoginDto {
  @ApiProperty({ example: 'budi.santoso@company.local' })
  @IsEmail({}, { message: 'Format email tidak valid.' })
  email: string;

  @ApiProperty({ example: 'Password123!' })
  @IsString()
  @IsNotEmpty({ message: 'Password wajib diisi.' })
  @MinLength(6, { message: 'Password minimal 6 karakter.' })
  password: string;
}

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    @Inject(SERVICE_TOKENS.AUTH_SERVICE) private readonly authClient: ClientProxy,
  ) {}

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authClient
      .send(AUTH_PATTERNS.LOGIN, { email: dto.email, password: dto.password })
      .pipe(mapRpcErrorToHttp());
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@CurrentUser() user: AuthenticatedUser) {
    return this.authClient
      .send(AUTH_PATTERNS.PROFILE, { userId: user.userId })
      .pipe(mapRpcErrorToHttp());
  }
}
