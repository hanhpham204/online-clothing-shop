import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { RenderedEmail } from './templates';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter: nodemailer.Transporter;
  private readonly fromAddress: string;
  private readonly fromName: string;
  private readonly enabled: boolean;

  constructor(private readonly configService: ConfigService) {
    this.enabled = (this.configService.get<string>('MAIL_ENABLED') ?? 'true') === 'true';
    this.fromAddress = this.configService.get<string>('MAIL_FROM') ?? 'noreply@fashion-store.local';
    this.fromName = this.configService.get<string>('MAIL_FROM_NAME') ?? 'LUA LA Store';

    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('MAIL_HOST') ?? 'smtp-relay.brevo.com',
      port: Number(this.configService.get<string>('MAIL_PORT') ?? '587'),
      secure: false,
      auth: {
        user: this.configService.get<string>('MAIL_USERNAME'),
        pass: this.configService.get<string>('MAIL_PASSWORD'),
      },
    });
  }

  async send(to: string, email: RenderedEmail): Promise<void> {
    if (!to) {
      this.logger.warn('Skipping email send because recipient is empty');
      return;
    }

    if (!this.enabled) {
      this.logger.log(`[Mock] Email to ${to} — subject: ${email.subject}`);
      return;
    }

    try {
      const info = await this.transporter.sendMail({
        from: `"${this.fromName}" <${this.fromAddress}>`,
        to,
        subject: email.subject,
        text: email.text,
        html: email.html,
      });
      this.logger.log(`Sent email to ${to} (subject="${email.subject}", messageId=${info.messageId})`);
    } catch (err) {
      this.logger.error(`Failed to send email to ${to}: ${(err as Error).message}`);
      throw err;
    }
  }
}
