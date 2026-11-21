/**
 * ==============================================================================
 * 🚀 ENTERPRISE DATA TABLE API SERVICE TEMPLATE
 * ==============================================================================
 * Copy this file to create an API-connected service for any new entity
 * (e.g. `product.service.ts`, `invoice.service.ts`, `customer.service.ts`).
 *
 * 3-STEP QUICK START:
 * 1. Define your model interface below (replace `EntityItem` and `CreateEntityDto`).
 * 2. Add your REST endpoint to `src/app/core/constants/api.constants.ts`.
 * 3. In `environment.development.ts`, toggle `useMockApi: false` when your backend is live!
 * ==============================================================================
 */

import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, delay, map, tap } from 'rxjs/operators';
import { environment } from '@env/environment';
import { API_ENDPOINTS } from '@core/constants/api.constants';
import { ApiResponse, PaginatedResponse, TableQueryParams } from '@core/models/api-response.model';
import { NotificationService } from '@core/services/notification.service';

// ------------------------------------------------------------------------------
// 1. DATA MODEL DEFINITIONS (Customize for your entity)
// ------------------------------------------------------------------------------
export interface EntityItem {
  id: string | number;
  name: string;
  status: string;
  createdAt: string;
  [key: string]: any;
}

export interface CreateEntityDto {
  name: string;
  status?: string;
  [key: string]: any;
}

// ------------------------------------------------------------------------------
// 2. MOCK DATA FOR PROTOTYPING & OFFLINE TESTING
// ------------------------------------------------------------------------------
const MOCK_ITEMS: EntityItem[] = [
  { id: '1', name: 'Sample Item Alpha', status: 'active', createdAt: '2026-01-10' },
  { id: '2', name: 'Sample Item Beta', status: 'pending', createdAt: '2026-02-14' },
  { id: '3', name: 'Sample Item Gamma', status: 'completed', createdAt: '2026-03-01' }
];

@Injectable({
  providedIn: 'root'
})
export class EntityApiServiceTemplate {
  private readonly http = inject(HttpClient);
  private readonly notificationService = inject(NotificationService);

  // 🔌 Change this endpoint path to match your entity in API_ENDPOINTS
  private readonly baseUrl = `${environment.apiUrl}/my-entity`;

  // Local state signals
  private mockStore: EntityItem[] = [...MOCK_ITEMS];
  private readonly itemsSignal = signal<EntityItem[]>([]);
  private readonly isLoadingSignal = signal<boolean>(false);
  private readonly errorSignal = signal<string | null>(null);
  private readonly totalCountSignal = signal<number>(0);

  // Public Readonly Signals (Bind these in your Component template)
  readonly items = this.itemsSignal.asReadonly();
  readonly isLoading = this.isLoadingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();
  readonly totalCount = this.totalCountSignal.asReadonly();

  // ----------------------------------------------------------------------------
  // GET: Retrieve list of items (supports client-side or server-side querying)
  // ----------------------------------------------------------------------------
  loadItems(params?: TableQueryParams): Observable<EntityItem[]> {
    this.isLoadingSignal.set(true);
    this.errorSignal.set(null);

    // Mock fallback mode: runs offline without requiring a live backend
    if (environment.useMockApi) {
      return of(this.mockStore).pipe(
        delay(400),
        tap(data => {
          this.itemsSignal.set(data);
          this.totalCountSignal.set(data.length);
          this.isLoadingSignal.set(false);
        }),
        catchError(err => {
          this.handleError(err, 'Failed to fetch items');
          return throwError(() => err);
        })
      );
    }

    // Real API mode: calls GET /my-entity with query parameters
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(k => {
        if (params[k] !== undefined && params[k] !== null && params[k] !== '') {
          httpParams = httpParams.set(k, String(params[k]));
        }
      });
    }

    return this.http.get<ApiResponse<EntityItem[]> | PaginatedResponse<EntityItem> | EntityItem[]>(
      this.baseUrl,
      { params: httpParams }
    ).pipe(
      map(res => {
        if (res && 'data' in res && Array.isArray((res as ApiResponse<EntityItem[]>).data)) {
          return (res as ApiResponse<EntityItem[]>).data;
        }
        if (res && 'items' in res && Array.isArray((res as PaginatedResponse<EntityItem>).items)) {
          const paginated = res as PaginatedResponse<EntityItem>;
          this.totalCountSignal.set(paginated.total);
          return paginated.items;
        }
        if (Array.isArray(res)) {
          return res;
        }
        return [];
      }),
      tap(data => {
        this.itemsSignal.set(data);
        if (!params?.page) {
          this.totalCountSignal.set(data.length);
        }
        this.isLoadingSignal.set(false);
      }),
      catchError(err => {
        this.handleError(err, 'Failed to fetch records from backend');
        return throwError(() => err);
      })
    );
  }

  // ----------------------------------------------------------------------------
  // POST: Create a new item
  // ----------------------------------------------------------------------------
  createItem(dto: CreateEntityDto): Observable<EntityItem> {
    this.isLoadingSignal.set(true);

    if (environment.useMockApi) {
      const created: EntityItem = {
        id: String(Date.now()),
        name: dto.name,
        status: dto.status || 'active',
        createdAt: new Date().toISOString().split('T')[0]
      };

      return of(created).pipe(
        delay(300),
        tap(item => {
          this.mockStore = [item, ...this.mockStore];
          this.itemsSignal.update(list => [item, ...list]);
          this.totalCountSignal.update(c => c + 1);
          this.isLoadingSignal.set(false);
          this.notificationService.success('Record created successfully.', 'Created');
        })
      );
    }

    return this.http.post<ApiResponse<EntityItem> | EntityItem>(this.baseUrl, dto).pipe(
      map(res => ('data' in res ? (res as ApiResponse<EntityItem>).data : (res as EntityItem))),
      tap(created => {
        this.itemsSignal.update(list => [created, ...list]);
        this.totalCountSignal.update(c => c + 1);
        this.isLoadingSignal.set(false);
        this.notificationService.success('Record created successfully.', 'Created');
      }),
      catchError(err => {
        this.handleError(err, 'Failed to create record on backend');
        return throwError(() => err);
      })
    );
  }

  // ----------------------------------------------------------------------------
  // DELETE: Remove item by ID
  // ----------------------------------------------------------------------------
  deleteItem(id: string | number): Observable<void> {
    if (environment.useMockApi) {
      return of(void 0).pipe(
        delay(250),
        tap(() => {
          this.mockStore = this.mockStore.filter(i => i.id !== id);
          this.itemsSignal.update(list => list.filter(i => i.id !== id));
          this.totalCountSignal.update(c => Math.max(0, c - 1));
          this.notificationService.info('Record deleted.', 'Removed');
        })
      );
    }

    return this.http.delete<void>(`${this.baseUrl}/${id}`).pipe(
      tap(() => {
        this.itemsSignal.update(list => list.filter(i => i.id !== id));
        this.totalCountSignal.update(c => Math.max(0, c - 1));
        this.notificationService.info('Record deleted.', 'Removed');
      }),
      catchError(err => {
        this.handleError(err, 'Failed to delete record on backend');
        return throwError(() => err);
      })
    );
  }

  private handleError(err: any, fallbackMessage: string): void {
    this.isLoadingSignal.set(false);
    this.errorSignal.set(err?.message || fallbackMessage);
  }
}
