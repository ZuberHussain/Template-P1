import { Injectable, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { delay, tap } from 'rxjs/operators';
import { User, UserRole } from '../models/user.model';
import { LoginCredentials, AuthResponse } from '../models/auth.model';
import { TokenService } from './token.service';
import { StorageService } from './storage.service';
import { NotificationService } from './notification.service';
import { STORAGE_KEYS } from '../constants/storage.constants';

// Enterprise Permissions Definition
export const ALL_PERMISSIONS = {
  TRIP_VIEW: 'TRIP_VIEW',
  TRIP_CREATE: 'TRIP_CREATE',
  TRIP_STATUS_CHANGE: 'TRIP_STATUS_CHANGE',
  TRIP_EDIT: 'TRIP_EDIT',
  TRIP_DELETE: 'TRIP_DELETE',
  USER_MANAGE: 'USER_MANAGE',
  DASHBOARD_VIEW: 'DASHBOARD_VIEW'
} as const;

const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  ADMIN: [
    ALL_PERMISSIONS.TRIP_VIEW,
    ALL_PERMISSIONS.TRIP_CREATE,
    ALL_PERMISSIONS.TRIP_STATUS_CHANGE,
    ALL_PERMISSIONS.TRIP_EDIT,
    ALL_PERMISSIONS.TRIP_DELETE,
    ALL_PERMISSIONS.USER_MANAGE,
    ALL_PERMISSIONS.DASHBOARD_VIEW
  ],
  MANAGER: [
    ALL_PERMISSIONS.TRIP_VIEW,
    ALL_PERMISSIONS.TRIP_CREATE,
    ALL_PERMISSIONS.TRIP_STATUS_CHANGE,
    ALL_PERMISSIONS.TRIP_EDIT,
    ALL_PERMISSIONS.DASHBOARD_VIEW
  ],
  DEVELOPER: [
    ALL_PERMISSIONS.TRIP_VIEW,
    ALL_PERMISSIONS.TRIP_CREATE,
    ALL_PERMISSIONS.DASHBOARD_VIEW
  ],
  VIEWER: [
    ALL_PERMISSIONS.TRIP_VIEW,
    ALL_PERMISSIONS.DASHBOARD_VIEW
  ]
};

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly tokenService = inject(TokenService);
  private readonly storageService = inject(StorageService);
  private readonly router = inject(Router);
  private readonly notificationService = inject(NotificationService);

  private readonly currentUserSignal = signal<User | null>(this.getInitialUser());
  private readonly isLoadingSignal = signal<boolean>(false);

  // Readonly public signals
  readonly currentUser = this.currentUserSignal.asReadonly();
  readonly isAuthenticated = computed(() => !!this.currentUserSignal());
  readonly isLoading = this.isLoadingSignal.asReadonly();

  /**
   * Check if the authenticated user has a specific permission
   */
  hasPermission(permission: string | undefined): boolean {
    if (!permission) return true;
    const user = this.currentUserSignal();
    if (!user) return false;
    return user.permissions?.includes(permission) ?? false;
  }

  /**
   * Switch active role dynamically (useful for live testing permission-based UI)
   */
  switchRole(role: UserRole): void {
    const user = this.currentUserSignal();
    if (!user) return;

    const updatedUser: User = {
      ...user,
      role,
      permissions: ROLE_PERMISSIONS[role] || []
    };

    this.currentUserSignal.set(updatedUser);
    this.storageService.setItem(STORAGE_KEYS.CURRENT_USER, updatedUser);

    const hasStatusPerm = updatedUser.permissions.includes(ALL_PERMISSIONS.TRIP_STATUS_CHANGE);
    this.notificationService.info(
      `Role switched to ${role}. Status change permission: ${hasStatusPerm ? 'Allowed' : 'Restricted'}.`,
      'Permissions Updated'
    );
  }

  /**
   * Enterprise Authentication:
   * Validates credentials against enterprise standards with role permissions.
   */
  login(credentials: LoginCredentials): Observable<AuthResponse> {
    this.isLoadingSignal.set(true);

    const email = credentials.email.trim().toLowerCase();
    const password = credentials.password;

    return of(null).pipe(
      delay(750),
      tap(() => this.isLoadingSignal.set(false)),
      tap({ error: () => this.isLoadingSignal.set(false) }),
      (source$) => new Observable<AuthResponse>(observer => {
        source$.subscribe({
          next: () => {
            const isAdmin = email === 'admin@enterprise.com';
            const role: UserRole = isAdmin ? 'ADMIN' : 'DEVELOPER';

            if ((isAdmin && password === 'Enterprise@123') || (!isAdmin && password.length >= 6)) {
              const mockUser: User = {
                id: isAdmin ? 'usr_adm_9918' : 'usr_dev_4421',
                email: email,
                firstName: isAdmin ? 'Sarah' : 'Alex',
                lastName: isAdmin ? 'Jenkins' : 'Morgan',
                role,
                permissions: ROLE_PERMISSIONS[role],
                department: isAdmin ? 'Operations & Logistics' : 'Cloud Architecture',
                isActive: true,
                lastLoginAt: new Date().toISOString()
              };

              const mockResponse: AuthResponse = {
                user: mockUser,
                tokens: {
                  accessToken: `mock_jwt_access_token_${Date.now()}`,
                  refreshToken: `mock_jwt_refresh_token_${Date.now()}`,
                  expiresIn: 3600,
                  tokenType: 'Bearer'
                }
              };

              this.tokenService.saveTokens(mockResponse.tokens, credentials.rememberMe ?? true);
              this.storageService.setItem(STORAGE_KEYS.CURRENT_USER, mockUser, credentials.rememberMe ? 'local' : 'session');
              this.currentUserSignal.set(mockUser);

              this.notificationService.success(`Welcome back, ${mockUser.firstName}!`, 'Signed In Successfully');
              observer.next(mockResponse);
              observer.complete();
            } else {
              const err = new Error('Invalid email or password. Please verify your credentials.');
              this.notificationService.error(err.message, 'Authentication Failed');
              observer.error(err);
            }
          },
          error: (err) => observer.error(err)
        });
      })
    );
  }

  logout(showNotification: boolean = true): void {
    this.tokenService.clearTokens();
    this.storageService.removeItem(STORAGE_KEYS.CURRENT_USER, 'local');
    this.storageService.removeItem(STORAGE_KEYS.CURRENT_USER, 'session');
    this.currentUserSignal.set(null);

    if (showNotification) {
      this.notificationService.info('You have been securely signed out.', 'Session Ended');
    }
    this.router.navigate(['/auth/login']);
  }

  private getInitialUser(): User | null {
    if (!this.tokenService.hasValidToken()) {
      return null;
    }
    const user = this.storageService.getItem<User>(STORAGE_KEYS.CURRENT_USER) ||
                 this.storageService.getItem<User>(STORAGE_KEYS.CURRENT_USER, 'session');
    if (user && !user.permissions) {
      user.permissions = ROLE_PERMISSIONS[user.role] || [];
    }
    return user;
  }
}
