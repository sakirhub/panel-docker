import {
  Body,
  Controller,
  Get,
  HttpStatus,
  HttpCode,
  Post,
} from '@nestjs/common';
import { Public } from '../../../decorator/public.decorator';
import { LoginAuthDto } from './login-auth.dto';
import { AuthService } from './auth.service';
@Controller('v1/integration/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post()
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginAuthDto: LoginAuthDto): Promise<any> {
    return this.authService.login(loginAuthDto);
  }

  @Get('status')
  @HttpCode(HttpStatus.OK)
  async status(): Promise<any> {
    return this.authService.status();
  }

  @Get('logout')
  @HttpCode(HttpStatus.OK)
  async logout(): Promise<any> {
    return this.authService.logout();
  }
}
