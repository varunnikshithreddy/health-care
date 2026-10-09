import React, { createContext, useContext, useEffect, useState } from 'react';
import { NotificationManager } from '../lib/notificationManager';
import { api } from '../lib/api';

export interface ToastItem {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'encouragement';
  taskTitle?: string;
  duration?: number;
}

interface NotificationContextType {
  permission: NotificationPermission;
  isPushSupported: boolean;
  isPushSubscribed: boolean;
  toasts: ToastItem[];
  encouragementData: { isOpen: boolean; message: string; taskTitle: string } | null;
  requestPermission: () => Promise<boolean>;
  showToast: (message: string, type?: 'success' | 'error' | 'info' | 'encouragement', duration?: number) => void;
  showEncouragement: (message: string, taskTitle: string, mode?: 'toast' | 'modal' | 'subtle') => void;
  dismissToast: (id: string) => void;
  closeEncouragement: () => void;
  sendTestPushNotification: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isPushSupported, setIsPushSupported] = useState(false);
  const [isPushSubscribed, setIsPushSubscribed] = useState(false);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [encouragementData, setEncouragementData] = useState<{
    isOpen: boolean;
    message: string;
    taskTitle: string;
  } | null>(null);

  useEffect(() => {
    setPermission(NotificationManager.getPermission());
    setIsPushSupported(NotificationManager.isSupported());

    // Check if service worker has existing push subscription
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      navigator.serviceWorker.ready.then((reg) => {
        reg.pushManager.getSubscription().then((sub) => {
          setIsPushSubscribed(Boolean(sub));
        });
      });
    }
  }, []);

  const showToast = (
    message: string,
    type: 'success' | 'error' | 'info' | 'encouragement' = 'info',
    duration: number = 4000
  ) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type, duration }]);

    setTimeout(() => {
      dismissToast(id);
    }, duration);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const showEncouragement = (
    message: string,
    taskTitle: string,
    mode: 'toast' | 'modal' | 'subtle' = 'toast'
  ) => {
    if (mode === 'modal') {
      setEncouragementData({ isOpen: true, message, taskTitle });
    } else {
      showToast(message, 'encouragement', 6000);
    }
  };

  const closeEncouragement = () => {
    setEncouragementData(null);
  };

  const requestPermission = async (): Promise<boolean> => {
    const success = await NotificationManager.subscribeToPush();
    setPermission(NotificationManager.getPermission());
    setIsPushSubscribed(success);
    if (success) {
      showToast('Notifications enabled! You will receive gentle reminders.', 'success');
    }
    return success;
  };

  const sendTestPushNotification = async () => {
    try {
      const res = await api.sendTestPush();
      if (res.success) {
        showToast(res.message, 'success');
      } else {
        // Fallback to local notification
        NotificationManager.showLocalNotification('LifeCare AI — Water & Routine Reminder', {
          body: 'This is a test notification. Your routine is active and healthy!',
        });
        showToast('Local notification displayed.', 'info');
      }
    } catch (err: any) {
      showToast(err.message || 'Push test failed', 'error');
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        permission,
        isPushSupported,
        isPushSubscribed,
        toasts,
        encouragementData,
        requestPermission,
        showToast,
        showEncouragement,
        dismissToast,
        closeEncouragement,
        sendTestPushNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};
