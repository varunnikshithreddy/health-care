import webpush from 'web-push';
import { config } from '../config/env.js';

if (config.vapid.publicKey && config.vapid.privateKey) {
  try {
    webpush.setVapidDetails(
      config.vapid.subject,
      config.vapid.publicKey,
      config.vapid.privateKey
    );
  } catch (err: any) {
    console.warn('⚠️ WebPush VAPID configuration warning:', err.message);
  }
}

export interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  url?: string;
  taskId?: string;
  category?: string;
}

export class PushService {
  public static async sendToSubscription(
    subscription: webpush.PushSubscription,
    payload: PushNotificationPayload
  ): Promise<{ success: boolean; statusCode?: number; error?: string }> {
    if (!config.vapid.publicKey || !config.vapid.privateKey) {
      return { success: false, error: 'VAPID keys not configured' };
    }

    try {
      const response = await webpush.sendNotification(
        subscription,
        JSON.stringify(payload)
      );
      return { success: true, statusCode: response.statusCode };
    } catch (err: any) {
      return {
        success: false,
        statusCode: err.statusCode,
        error: err.message || 'Push delivery failed',
      };
    }
  }
}
