import {
  Controller,
  Post,
  Body,
  Req,
  BadRequestException,
} from '@nestjs/common';
import type { Request } from 'express';
import * as jwt from 'jsonwebtoken';
import { ConfigService } from '@nestjs/config';
import { AppService, ChatHistoryItem, CartAction } from './app.service';

class ChatDto {
  message: string;
  history?: ChatHistoryItem[];
}

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly configService: ConfigService,
  ) {}

  // ── Helper to extract and verify JWT user email from request ──
  private extractUserEmail(req: Request): string | undefined {
    // 1. Try to extract from Cookie header
    const cookieHeader = req.headers?.cookie || '';
    const cookies = cookieHeader.split(';').reduce(
      (acc, current) => {
        const [key, val] = current.split('=').map((c) => c.trim());
        if (key) acc[key] = val;
        return acc;
      },
      {} as Record<string, string>,
    );

    let token = cookies['access_token'];

    // 2. If not in cookies, fallback to Authorization Header
    if (!token && req.headers?.authorization) {
      const authHeader = req.headers.authorization;
      if (authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }

    if (!token) return undefined;

    try {
      const jwtSecret =
        this.configService.get<string>('JWT_SECRET') ||
        'defaultSecretForDevelopment';
      const decoded = jwt.verify(token, jwtSecret) as {
        email?: string;
        sub?: string;
      };
      return decoded?.email || decoded?.sub;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.warn('JWT verification failed in Chatbot Service:', errorMessage);
      return undefined;
    }
  }

  @Post('chat')
  async chat(
    @Req() req: Request,
    @Body() body: ChatDto,
  ): Promise<{ reply: string; actions: CartAction[] }> {
    if (!body.message) {
      throw new BadRequestException('Message parameter is required.');
    }

    const userEmail = this.extractUserEmail(req);
    const history = body.history || [];

    return this.appService.chat(body.message, history, userEmail);
  }
}
