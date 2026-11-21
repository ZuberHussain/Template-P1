import { HttpInterceptorFn } from '@angular/common/http';
import { tap } from 'rxjs';
import { environment } from '@env/environment';

export const loggingInterceptor: HttpInterceptorFn = (req, next) => {
  if (environment.production) {
    return next(req);
  }

  const started = Date.now();
  return next(req).pipe(
    tap({
      next: () => {
        const elapsed = Date.now() - started;
        console.debug(`[HTTP] ${req.method} "${req.urlWithParams}" took ${elapsed} ms.`);
      },
      error: (err) => {
        const elapsed = Date.now() - started;
        console.error(`[HTTP] ${req.method} "${req.urlWithParams}" failed in ${elapsed} ms:`, err);
      }
    })
  );
};
