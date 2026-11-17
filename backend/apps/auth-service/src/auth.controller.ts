import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { AUTH_PATTERNS } from '@app/shared';
import { AuthService } from './auth.service';

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @MessagePattern(AUTH_PATTERNS.LOGIN)
  login(@Payload() payload: { email: string; password: string }) {
    return this.authService.login(payload.email, payload.password);
  }

  @MessagePattern(AUTH_PATTERNS.PROFILE)
  getProfile(@Payload() payload: { userId: number }) {
    return this.authService.getProfile(payload.userId);
  }
}
