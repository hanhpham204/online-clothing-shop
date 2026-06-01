import { Injectable, UnauthorizedException, BadRequestException, HttpException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { FirebaseService } from './firebase.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UserDocument } from '../users/schemas/user.schema';
import { StreamPublisherService } from '../events/stream-publisher.service';
import { AuthOtpRequestedPayload, STREAM_NAMES } from '../events/event-types';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly otpExpirationMinutes: number;

  constructor(
    private usersService: UsersService,
    private firebaseService: FirebaseService,
    private jwtService: JwtService,
    private streamPublisher: StreamPublisherService,
    private configService: ConfigService,
  ) {
    this.otpExpirationMinutes = Number(
      this.configService.get<string>('EMAIL_VERIFICATION_OTP_EXPIRATION_MINUTES') ?? '10',
    );
  }

  async register(email: string, pass: string, fullName: string) {
    const existingUser = await this.usersService.findUserByEmail(email);
    if (existingUser && existingUser.isVerified) {
      throw new BadRequestException('User already exists');
    }

    let user = existingUser;
    const hashedPassword = await bcrypt.hash(pass, 10);

    if (user) {
        await this.usersService.updateUser(email, { password: hashedPassword, fullName });
    } else {
        user = await this.usersService.createUser({
            email,
            fullName,
            password: hashedPassword,
            isVerified: false,
            authProvider: 'email'
        });
    }

    await this.generateAndSendOtp(email, 'EMAIL_VERIFICATION', fullName);
    return { requiresEmailVerification: true, email };
  }

  private async generateAndSendOtp(
    email: string,
    purpose: AuthOtpRequestedPayload['purpose'],
    fullName?: string,
  ) {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + this.otpExpirationMinutes);
    await this.usersService.createOtp(email, otp, expiresAt);

    const resolvedFullName = fullName ?? (await this.lookupFullName(email));

    try {
      await this.streamPublisher.publish<AuthOtpRequestedPayload>(
        STREAM_NAMES.authOtpRequested,
        {
          email,
          otp,
          purpose,
          expiresAt: expiresAt.toISOString(),
          fullName: resolvedFullName,
        },
      );
    } catch (err) {
      // Stream is durable — if Redis is briefly unreachable the publisher will
      // retry on the next call. The OTP is also persisted in MongoDB so the
      // user can resend.
      this.logger.warn(
        `Could not publish auth.otp.requested for ${email}: ${(err as Error).message}`,
      );
    }

    this.logger.log(`OTP for ${email} (${purpose}) issued — code stored in DB, event published.`);
  }

  private async lookupFullName(email: string): Promise<string | undefined> {
    try {
      const user = await this.usersService.findUserByEmail(email);
      return user?.fullName ?? undefined;
    } catch {
      return undefined;
    }
  }

  async resendOtp(email: string) {
    const user = await this.usersService.findUserByEmail(email);
    if (!user || user.isVerified) {
      throw new BadRequestException('Cannot resend OTP for this user');
    }
    await this.generateAndSendOtp(email, 'EMAIL_VERIFICATION', user.fullName ?? undefined);
    return { message: 'OTP resent' };
  }

  async verifyOtp(email: string, otpCode: string) {
    const otp = await this.usersService.getOtp(email, otpCode);
    if (!otp) {
      throw new BadRequestException('Invalid OTP');
    }
    if (otp.expiresAt < new Date()) {
      throw new BadRequestException('OTP has expired');
    }

    await this.usersService.updateUser(email, { isVerified: true });
    await this.usersService.deleteOtp(email);

    return { message: 'Email verified successfully' };
  }

  async login(email: string, pass: string) {
    const user = await this.usersService.findUserByEmail(email);
    if (!user) throw new UnauthorizedException('Invalid credentials');

    if (!user.isVerified) {
      throw new UnauthorizedException({ message: 'Email not verified', code: 'EMAIL_NOT_VERIFIED' });
    }
    if (user.authProvider !== 'email' || !user.password) {
      throw new UnauthorizedException('This account was registered using a different method. Please sign in with Google.');
    }

    const isMatch = await bcrypt.compare(pass, user.password);
    if (!isMatch) throw new UnauthorizedException('Invalid credentials');

    return this.generateToken(user);
  }

  async firebaseLogin(idToken: string) {
    try {
      const decodedToken = await this.firebaseService.verifyIdToken(idToken);
      const email = decodedToken.email;
      if (!email) throw new BadRequestException('No email found in Firebase token');

      let user = await this.usersService.findUserByEmail(email);
      if (!user) {
        user = await this.usersService.createUser({
          email,
          fullName: decodedToken.name || '',
          isVerified: true,
          authProvider: 'google',
        });
      } else {
        if (user.authProvider !== 'google') {
          throw new UnauthorizedException('This account was registered using a different method. Please sign in using your email and password.');
        }
        if (decodedToken.name && user.fullName !== decodedToken.name) {
          const updated = await this.usersService.updateUser(email, { fullName: decodedToken.name });
          if (updated) {
            user = updated;
          }
        }
      }
      return this.generateToken(user);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new UnauthorizedException('Invalid Firebase Token');
    }
  }

  async getMe(email: string) {
    const user = await this.usersService.findUserByEmail(email);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return {
      userId: user._id.toString(),
      email: user.email,
      name: user.fullName || user.email.split('@')[0],
      role: (user as any).role || 'USER',
      phone: (user as any).phone || null,
      address: (user as any).address || null,
      gender: (user as any).gender || null,
    };
  }

  async updateProfile(email: string, updateData: { fullName?: string; phone?: string; address?: string; gender?: string }) {
    const user = await this.usersService.updateUser(email, updateData);
    if (!user) {
      throw new BadRequestException('User not found');
    }
    return {
      userId: user._id.toString(),
      email: user.email,
      name: user.fullName || user.email.split('@')[0],
      role: (user as any).role || 'USER',
      phone: (user as any).phone || null,
      address: (user as any).address || null,
      gender: (user as any).gender || null,
    };
  }

  async forgotPassword(email: string) {
    const user = await this.usersService.findUserByEmail(email);
    if (!user) {
      throw new BadRequestException('User with this email does not exist');
    }
    if (user.authProvider !== 'email') {
      throw new BadRequestException('This account was registered using a different method. Please sign in with Google.');
    }
    await this.generateAndSendOtp(email, 'PASSWORD_RESET', user.fullName ?? undefined);
    return { message: 'OTP sent to your email' };
  }

  async resetPassword(email: string, otpCode: string, pass: string) {
    const user = await this.usersService.findUserByEmail(email);
    if (!user) {
      throw new BadRequestException('User with this email does not exist');
    }
    if (user.authProvider !== 'email') {
      throw new BadRequestException('This account was registered using a different method. Please sign in with Google.');
    }

    const otp = await this.usersService.getOtp(email, otpCode);
    if (!otp) {
      throw new BadRequestException('Invalid OTP');
    }
    if (otp.expiresAt < new Date()) {
      throw new BadRequestException('OTP has expired');
    }

    const hashedPassword = await bcrypt.hash(pass, 10);
    await this.usersService.updateUser(email, { password: hashedPassword });
    await this.usersService.deleteOtp(email);

    return { message: 'Password reset successfully' };
  }

  private generateToken(user: UserDocument) {
    const payload = { email: user.email, sub: user._id };
    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });
    return {
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      accessTokenExpiresIn: 3600,
      refreshTokenExpiresIn: 604800,
      userId: user._id.toString(),
      email: user.email,
      name: user.fullName || user.email.split('@')[0],
      role: (user as any).role || 'USER',
      phone: (user as any).phone || null,
      address: (user as any).address || null,
      gender: (user as any).gender || null,
    };
  }
}
