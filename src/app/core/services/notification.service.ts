import { Injectable, signal } from '@angular/core';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface NotificationItem {
  id: string;
  type: NotificationType;
  title?: string;
  message: string;
  duration?: number;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private readonly notificationsSignal = signal<NotificationItem[]>([]);
  readonly notifications = this.notificationsSignal.asReadonly();

  show(notification: Omit<NotificationItem, 'id'>): void {
    const id = `notif_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const newItem: NotificationItem = {
      id,
      duration: notification.duration ?? 4000,
      ...notification
    };

    this.notificationsSignal.update(items => [...items, newItem]);

    if (newItem.duration && newItem.duration > 0) {
      setTimeout(() => {
        this.dismiss(id);
      }, newItem.duration);
    }
  }

  success(message: string, title: string = 'Success', duration: number = 4000): void {
    this.show({ type: 'success', title, message, duration });
  }

  error(message: string, title: string = 'Error', duration: number = 6000): void {
    this.show({ type: 'error', title, message, duration });
  }

  warning(message: string, title: string = 'Warning', duration: number = 5000): void {
    this.show({ type: 'warning', title, message, duration });
  }

  info(message: string, title: string = 'Information', duration: number = 4000): void {
    this.show({ type: 'info', title, message, duration });
  }

  dismiss(id: string): void {
    this.notificationsSignal.update(items => items.filter(item => item.id !== id));
  }

  clearAll(): void {
    this.notificationsSignal.set([]);
  }
}
