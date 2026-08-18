import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('MAIL_HOST'),
      port: this.configService.get<number>('MAIL_PORT'),
      secure: false,
      auth: {
        user: this.configService.get<string>('MAIL_USER'),
        pass: this.configService.get<string>('MAIL_PASS'),
      },
    });
  }

  async sendEmail(
    to: string,
    subject: string,
    html: string,
    text?: string,
  ): Promise<void> {
    const from = this.configService.get<string>('MAIL_FROM') || 'Ninho <noreply@ninho.app>';

    try {
      await this.transporter.sendMail({
        from,
        to,
        subject,
        html,
        text: text || this.htmlToText(html),
      });

      this.logger.log({ to, subject }, 'Email sent');
    } catch (error) {
      this.logger.error({ to, subject, error }, 'Failed to send email');
      throw error;
    }
  }

  async sendTemplateEmail(
    to: string,
    template: EmailTemplate,
  ): Promise<void> {
    await this.sendEmail(to, template.subject, template.html, template.text);
  }

  async verifyConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      return true;
    } catch {
      return false;
    }
  }

  private htmlToText(html: string): string {
    return html
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }
}