import { Injectable, inject } from '@angular/core';
import { StorageService } from './storage.service';
import { STORAGE_KEYS } from '../constants/storage.constants';
import { AuthTokens } from '../models/auth.model';

@Injectable({
  providedIn: 'root'
})
export class TokenService {
  private readonly storage = inject(StorageService);

  getAccessToken(): string | null {
    return this.storage.getItem<string>(STORAGE_KEYS.ACCESS_TOKEN) ||
           this.storage.getItem<string>(STORAGE_KEYS.ACCESS_TOKEN, 'session');
  }

  getRefreshToken(): string | null {
    return this.storage.getItem<string>(STORAGE_KEYS.REFRESH_TOKEN) ||
           this.storage.getItem<string>(STORAGE_KEYS.REFRESH_TOKEN, 'session');
  }

  saveTokens(tokens: AuthTokens, persistent: boolean = true): void {
    const targetStorage = persistent ? 'local' : 'session';
    // Clear both first to avoid duplicates
    this.clearTokens();
    this.storage.setItem(STORAGE_KEYS.ACCESS_TOKEN, tokens.accessToken, targetStorage);
    this.storage.setItem(STORAGE_KEYS.REFRESH_TOKEN, tokens.refreshToken, targetStorage);
  }

  clearTokens(): void {
    this.storage.removeItem(STORAGE_KEYS.ACCESS_TOKEN, 'local');
    this.storage.removeItem(STORAGE_KEYS.ACCESS_TOKEN, 'session');
    this.storage.removeItem(STORAGE_KEYS.REFRESH_TOKEN, 'local');
    this.storage.removeItem(STORAGE_KEYS.REFRESH_TOKEN, 'session');
  }

  hasValidToken(): boolean {
    const token = this.getAccessToken();
    return !!token && token.length > 0;
  }
}
