import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { NotificationService } from '../services/notification.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const notificationService = inject(NotificationService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let errorMessage = 'An unexpected server error occurred.';

      if (error.error instanceof ErrorEvent) {
        // Client-side or network error
        errorMessage = error.error.message;
      } else {
        // Backend HTTP error response
        switch (error.status) {
          case 401:
            errorMessage = 'Your session has expired. Please sign in again.';
            authService.logout(false);
            break;
          case 403:
            errorMessage = 'Access denied. You do not have permission for this resource.';
            break;
          case 404:
            errorMessage = 'The requested resource was not found.';
            break;
          case 500:
          case 502:
          case 503:
            errorMessage = 'Enterprise server error. Please try again shortly.';
            break;
          default:
            errorMessage = error.error?.message || `Error code ${error.status}: ${error.statusText}`;
        }
      }

      notificationService.error(errorMessage, 'Request Failed');
      return throwError(() => error);
    })
  );
};
