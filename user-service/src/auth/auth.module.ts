import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { FirebaseService } from './firebase.service';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtStrategy } from './jwt.strategy';

@Module({
  imports: [
    UsersModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const expiresInMs = configService.get<number>('JWT_ACCESS_TOKEN_EXPIRATION_MS');
        return {
          secret: configService.get<string>('JWT_SECRET') || 'defaultSecretForDevelopment',
          signOptions: { 
              expiresIn: expiresInMs ? `${expiresInMs}ms` as any : '1h' 
          },
        };
      },
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, FirebaseService, JwtStrategy],
})
export class AuthModule {}
