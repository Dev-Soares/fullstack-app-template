import { Body, Controller, Post, HttpCode, HttpStatus, Res } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import type { Response } from 'express';
import { AuthService } from './auth.service';
import { SignInDto } from './dto/sign-in.dto';
import { cookieConfig } from 'src/common/config/cookie.config';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) { }

  @HttpCode(HttpStatus.OK)
  @Post('login')
  @ApiOperation({ summary: 'Autenticar usuário' })
  async signIn(
    @Body() signInDto: SignInDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ message: string }> {
    const result = await this.authService.signIn(signInDto.email, signInDto.password);

    res.cookie('access_token', result.access_token, cookieConfig)

    return { message: 'Sign In successful' };
  }

  @Post('logout')
  @ApiOperation({ summary: 'Encerrar sessão' })
  logout(@Res({ passthrough: true }) res: Response): { message: string } {
    res.clearCookie('access_token', cookieConfig);
    return { message: 'Logged out' };
  }

}
