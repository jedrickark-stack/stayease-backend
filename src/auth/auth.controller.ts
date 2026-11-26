import {
  Controller,
  Post,
  Body,
} from '@nestjs/common';

import { AuthService } from './auth.service';

@Controller('api/v1/auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
  ) {}

  @Post('register')
  register(
    @Body()
    data: {
      FullName: string;
      Email: string;
      Password: string;
    },
  ) {
    return this.authService.register(data);
  }

  @Post('login')
  login(
    @Body()
    data: {
      Email: string;
      Password: string;
    },
  ) {
    return this.authService.login(data);
  }
}