import webpush from 'web-push';
import { config } from '../config/env.js';
if (config.vapid.publicKey && config.vapid.privateKey) {
    try {
        webpush.setVapidDetails(config.vapid.subject, config.vapid.publicKey, config.vapid.privateKey);
    }
    catch (err) {
        console.warn('⚠️ WebPush VAPID configuration warning:', err.message);
    }
}
export class PushService {
    static async sendToSubscription(subscription, payload) {
        if (!config.vapid.publicKey || !config.vapid.privateKey) {
            return { success: false, error: 'VAPID keys not configured' };
        }
        try {
            const response = await webpush.sendNotification(subscription, JSON.stringify(payload));
            return { success: true, statusCode: response.statusCode };
        }
        catch (err) {
            return {
                success: false,
                statusCode: err.statusCode,
                error: err.message || 'Push delivery failed',
            };
        }
    }
}
