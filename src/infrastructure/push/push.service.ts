import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface PushNotification {
  token: string;
  title: string;
  body: string;
  data?: Record<string, string>;
  badge?: number;
  sound?: string;
}

export interface PushResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

@Injectable()
export class PushService {
  private readonly logger = new Logger(PushService.name);
  private provider: string;

  constructor(private configService: ConfigService) {
    this.provider = this.configService.get<string>('PUSH_PROVIDER') || 'firebase';
  }

  async send(notification: PushNotification): Promise<PushResult> {
    switch (this.provider) {
      case 'firebase':
        return this.sendViaFirebase(notification);
      case 'expo':
        return this.sendViaExpo(notification);
      case 'onesignal':
        return this.sendViaOneSignal(notification);
      default:
        this.logger.warn(`Unknown push provider: ${this.provider}`);
        return { success: false, error: 'Unknown provider' };
    }
  }

  async sendToMultiple(notifications: PushNotification[]): Promise<PushResult[]> {
    return Promise.all(notifications.map((n) => this.send(n)));
  }

  private async sendViaFirebase(notification: PushNotification): Promise<PushResult> {
    this.logger.debug({ token: notification.token.substring(0, 10) + '...' }, 'Sending via Firebase');
    return { success: true, messageId: 'firebase-mock-id' };
  }

  private async sendViaExpo(notification: PushNotification): Promise<PushResult> {
    this.logger.debug({ token: notification.token.substring(0, 10) + '...' }, 'Sending via Expo');
    return { success: true, messageId: 'expo-mock-id' };
  }

  private async sendViaOneSignal(notification: PushNotification): Promise<PushResult> {
    this.logger.debug({ token: notification.token.substring(0, 10) + '...' }, 'Sending via OneSignal');
    return { success: true, messageId: 'onesignal-mock-id' };
  }
}