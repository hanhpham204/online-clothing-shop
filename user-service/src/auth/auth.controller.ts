import { Controller, Post, Body, HttpCode, HttpStatus, Res, Get, Req, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import type { Response, Request } from 'express';

@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  private setCookies(res: Response, tokens: { accessToken: string, refreshToken: string }) {
    const isProduction = process.env.NODE_ENV === 'production';
    res.cookie('access_token', tokens.accessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: parseInt(process.env.JWT_ACCESS_TOKEN_EXPIRATION_MS || '3600000', 10),
    });
    res.cookie('refresh_token', tokens.refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: parseInt(process.env.JWT_REFRESH_TOKEN_EXPIRATION_MS || '604800000', 10),
    });
  }

  @Post('register')
  async register(@Body() body: { email: string; password: string; fullName: string }) {
    return this.authService.register(body.email, body.password, body.fullName);
  }

  @Post('verify-email-otp')
  @HttpCode(HttpStatus.OK)
  async verifyOtp(@Body() body: { email: string; otp: string }) {
    return this.authService.verifyOtp(body.email, body.otp);
  }

  @Post('resend-email-otp')
  @HttpCode(HttpStatus.OK)
  async resendOtp(@Body() body: { email: string }) {
    return this.authService.resendOtp(body.email);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() body: { email: string; password: string }, @Res({ passthrough: true }) res: Response) {
    const data = await this.authService.login(body.email, body.password);
    this.setCookies(res, data);
    return { message: 'Logged in successfully' };
  }

  @Post('google')
  @HttpCode(HttpStatus.OK)
  async googleLogin(@Body() body: { idToken: string }, @Res({ passthrough: true }) res: Response) {
    const data = await this.authService.firebaseLogin(body.idToken);
    this.setCookies(res, data);
    return { message: 'Logged in successfully' };
  }

  @Get('me')
  async getMe(@Req() req: Request) {
    // req.user contains the decoded JWT token payload: { email, sub }
    const userPayload = req.user as any;
    if (!userPayload || !userPayload.email) {
      throw new UnauthorizedException();
    }
    const user = await this.authService.getMe(userPayload.email);
    return { user };
  }

  @Post('profile/update')
  @HttpCode(HttpStatus.OK)
  async updateProfile(
    @Req() req: Request, 
    @Body() body: { fullName?: string; phone?: string; address?: string; gender?: string }
  ) {
    const userPayload = req.user as any;
    if (!userPayload || !userPayload.email) {
      throw new UnauthorizedException();
    }
    const user = await this.authService.updateProfile(userPayload.email, body);
    return { user, message: 'Profile updated successfully' };
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() body: { email: string }) {
    return this.authService.forgotPassword(body.email);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() body: { email: string; otp: string; password?: string; newPassword?: string }) {
    const pass = body.password || body.newPassword;
    if (!pass) {
      throw new UnauthorizedException('New password is required');
    }
    return this.authService.resetPassword(body.email, body.otp, pass);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('access_token');
    res.clearCookie('refresh_token');
    return { message: 'Logged out successfully' };
  }
}
