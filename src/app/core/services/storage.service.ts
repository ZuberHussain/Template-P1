import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  private readonly isBrowser: boolean;
  private memoryFallback = new Map<string, string>();

  constructor() {
    const platformId = inject(PLATFORM_ID);
    this.isBrowser = isPlatformBrowser(platformId);
  }

  getItem<T>(key: string, storage: 'local' | 'session' = 'local'): T | null {
    if (!this.isBrowser) {
      const val = this.memoryFallback.get(key);
      return val ? (JSON.parse(val) as T) : null;
    }

    try {
      const store = storage === 'local' ? window.localStorage : window.sessionStorage;
      const item = store.getItem(key);
      if (!item) return null;
      return JSON.parse(item) as T;
    } catch (error) {
      console.warn(`[StorageService] Failed to read "${key}" from ${storage} storage:`, error);
      const val = this.memoryFallback.get(key);
      return val ? (JSON.parse(val) as T) : null;
    }
  }

  setItem<T>(key: string, value: T, storage: 'local' | 'session' = 'local'): void {
    const serialized = JSON.stringify(value);
    this.memoryFallback.set(key, serialized);

    if (!this.isBrowser) return;

    try {
      const store = storage === 'local' ? window.localStorage : window.sessionStorage;
      store.setItem(key, serialized);
    } catch (error) {
      console.warn(`[StorageService] Failed to write "${key}" to ${storage} storage:`, error);
    }
  }

  removeItem(key: string, storage: 'local' | 'session' = 'local'): void {
    this.memoryFallback.delete(key);
    if (!this.isBrowser) return;

    try {
      const store = storage === 'local' ? window.localStorage : window.sessionStorage;
      store.removeItem(key);
    } catch (error) {
      console.warn(`[StorageService] Failed to remove "${key}" from ${storage} storage:`, error);
    }
  }

  clear(storage: 'local' | 'session' = 'local'): void {
    this.memoryFallback.clear();
    if (!this.isBrowser) return;

    try {
      const store = storage === 'local' ? window.localStorage : window.sessionStorage;
      store.clear();
    } catch (error) {
      console.warn(`[StorageService] Failed to clear ${storage} storage:`, error);
    }
  }
}
