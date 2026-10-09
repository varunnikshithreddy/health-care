import { api } from './api';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export class NotificationManager {
  public static isSupported(): boolean {
    return 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window;
  }

  public static getPermission(): NotificationPermission {
    if (!('Notification' in window)) return 'denied';
    return Notification.permission;
  }

  public static async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) return 'denied';
    return await Notification.requestPermission();
  }

  public static async registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
    if (!('serviceWorker' in navigator)) return null;
    try {
      const reg = await navigator.serviceWorker.register('/sw.js');
      return reg;
    } catch (err) {
      console.warn('Service worker registration failed:', err);
      return null;
    }
  }

  public static async subscribeToPush(): Promise<boolean> {
    if (!this.isSupported()) return false;

    try {
      const permission = await this.requestPermission();
      if (permission !== 'granted') return false;

      const reg = await this.registerServiceWorker();
      if (!reg) return false;

      // Get VAPID public key from backend
      const settings = await api.getNotificationSettings();
      if (!settings.vapid_public_key) {
        console.warn('VAPID public key not configured on server');
        return false;
      }

      const convertedKey = urlBase64ToUint8Array(settings.vapid_public_key);
      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedKey,
      });

      // Send subscription to backend
      await api.subscribePush({
        subscription: subscription.toJSON(),
        user_agent: navigator.userAgent,
      });

      return true;
    } catch (err) {
      console.error('Failed to subscribe to Web Push:', err);
      return false;
    }
  }

  public static showLocalNotification(title: string, options: NotificationOptions = {}) {
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, {
          icon: '/favicon.svg',
          badge: '/favicon.svg',
          ...options,
        });
      } catch (e) {
        // Fallback for mobile browsers requiring service worker showNotification
        navigator.serviceWorker?.ready.then((reg) => {
          reg.showNotification(title, options);
        });
      }
    }
  }
}
