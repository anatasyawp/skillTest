import { HttpStatus, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService, throwRpcError } from '@app/shared';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
      include: { employee: true },
    });

    if (!user) {
      throwRpcError(HttpStatus.UNAUTHORIZED, 'Email atau password salah.');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throwRpcError(HttpStatus.UNAUTHORIZED, 'Email atau password salah.');
    }

    if (!user.isActive || user.employee?.status === 'INACTIVE') {
      throwRpcError(HttpStatus.FORBIDDEN, 'Akun Anda tidak aktif. Hubungi admin HRD.');
    }

    const jwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      employeeId: user.employee?.id ?? null,
    };

    return {
      accessToken: this.jwtService.sign(jwtPayload),
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        employee: user.employee,
      },
    };
  }

  async getProfile(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { employee: true },
    });

    if (!user) {
      throwRpcError(HttpStatus.NOT_FOUND, 'User tidak ditemukan.');
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      employee: user.employee,
    };
  }
}
