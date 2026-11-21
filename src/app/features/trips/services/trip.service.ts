import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, delay, map, tap } from 'rxjs/operators';
import { environment } from '@env/environment';
import { API_ENDPOINTS } from '@core/constants/api.constants';
import { ApiResponse, PaginatedResponse, TableQueryParams } from '@core/models/api-response.model';
import { NotificationService } from '@core/services/notification.service';
import { Trip, CreateTripDto, TripStatus, TRIP_STATUS_LABELS } from '../models/trip.model';

/**
 * 📦 Default mock dataset for offline testing and prototype preview.
 * This runs automatically when `environment.useMockApi === true`.
 */
const INITIAL_MOCK_TRIPS: Trip[] = [
  {
    id: 'TRP-101',
    name: 'Annual Global Tech Conference',
    year: 2026,
    status: 'draft',
    note: 'Cloud architecture and engineering delegation summit',
    createdAt: '2026-01-15'
  },
  {
    id: 'TRP-102',
    name: 'Dubai Regional Logistics Summit',
    year: 2026,
    status: 'open',
    note: 'Vendor partnerships and regional supply chain negotiations',
    createdAt: '2026-02-01'
  },
  {
    id: 'TRP-103',
    name: 'Cybersecurity Infrastructure Audit',
    year: 2025,
    status: 'closed',
    note: 'Completed annual compliance report and ISO security certification',
    createdAt: '2025-11-20'
  },
  {
    id: 'TRP-104',
    name: 'Green Energy & NEOM Site Expedition',
    year: 2026,
    status: 'draft',
    note: 'Field assessment for clean solar and green hydrogen facilities',
    createdAt: '2026-03-10'
  },
  {
    id: 'TRP-105',
    name: 'Executive Agile Leadership Workshop',
    year: 2026,
    status: 'open',
    note: 'Offsite intensive strategy sprint for regional directors',
    createdAt: '2026-04-05'
  },
  {
    id: 'TRP-106',
    name: 'Supply Chain Operations Inspection',
    year: 2026,
    status: 'draft',
    note: 'Inspection of central warehousing and logistics automated hubs',
    createdAt: '2026-04-18'
  },
  {
    id: 'TRP-107',
    name: 'Riyadh FinTech Expo & Hackathon',
    year: 2026,
    status: 'open',
    note: 'Corporate digital payment innovations and banking partnerships',
    createdAt: '2026-05-02'
  },
  {
    id: 'TRP-108',
    name: 'Cloud Data Center Migration Visit',
    year: 2025,
    status: 'closed',
    note: 'Migration of core banking services to hybrid cloud complete',
    createdAt: '2025-09-14'
  },
  {
    id: 'TRP-109',
    name: 'AI & Machine Learning World Forum',
    year: 2026,
    status: 'draft',
    note: 'Exploring generative AI integrations for enterprise customer workflows',
    createdAt: '2026-05-22'
  },
  {
    id: 'TRP-110',
    name: 'Quality Assurance & ISO 9001 Review',
    year: 2026,
    status: 'open',
    note: 'Annual operational quality audit across regional subsidiaries',
    createdAt: '2026-06-11'
  },
  {
    id: 'TRP-111',
    name: 'Autonomous Fleet Testing Convoy',
    year: 2026,
    status: 'draft',
    note: 'Trial runs of electric delivery trucks along highway corridors',
    createdAt: '2026-07-01'
  },
  {
    id: 'TRP-112',
    name: 'Enterprise Security Red-Team Exercise',
    year: 2025,
    status: 'closed',
    note: 'Comprehensive penetration testing and incident response simulation',
    createdAt: '2025-12-05'
  }
];

@Injectable({
  providedIn: 'root'
})
export class TripService {
  private readonly http = inject(HttpClient);
  private readonly notificationService = inject(NotificationService);

  // ==========================================================================
  // 🔌 BACKEND API ENDPOINT CONFIGURATION
  // --------------------------------------------------------------------------
  // Base URL from environment: e.g. "http://localhost:3000/api/v1/trips"
  // ==========================================================================
  private readonly baseUrl = `${environment.apiUrl}${API_ENDPOINTS.TRIPS.BASE}`;

  // In-memory mock storage (used when environment.useMockApi is true)
  private mockTripsStore: Trip[] = [...INITIAL_MOCK_TRIPS];

  // Reactive State Signals
  private readonly tripsSignal = signal<Trip[]>([]);
  private readonly isLoadingSignal = signal<boolean>(false);
  private readonly errorSignal = signal<string | null>(null);
  private readonly totalCountSignal = signal<number>(0);

  // Public Readonly Signals
  readonly trips = this.tripsSignal.asReadonly();
  readonly isLoading = this.isLoadingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();
  readonly totalCount = this.totalCountSignal.asReadonly();

  constructor() {
    // Automatically load initial trips on startup
    this.loadTrips().subscribe();
  }

  // ==========================================================================
  // 1. GET /trips - Retrieve list of trips (with optional query parameters)
  // ==========================================================================
  /**
   * Load trips from the server or mock adapter.
   *
   * @param params Query parameters: page, pageSize, search, sortBy, sortDirection
   *
   * 💡 HOW TO INTEGRATE REAL BACKEND:
   * 1. Set `useMockApi: false` in `src/environments/environment.development.ts`
   * 2. The code will dispatch a real `GET ${this.baseUrl}` call.
   * 3. Adjust the response mapping in the `map(...)` operator below if your
   *    backend response envelope differs (e.g. `response.data` or `response.items`).
   */
  loadTrips(params?: TableQueryParams): Observable<Trip[]> {
    this.isLoadingSignal.set(true);
    this.errorSignal.set(null);

    // ─── A. MOCK MODE (When environment.useMockApi === true) ───
    if (environment.useMockApi) {
      return of(this.mockTripsStore).pipe(
        // Simulate real network latency (400ms)
        delay(400),
        map(items => {
          let filtered = [...items];

          // Simulate server search if search param is provided
          if (params?.search) {
            const term = params.search.toLowerCase();
            filtered = filtered.filter(t =>
              t.name.toLowerCase().includes(term) ||
              String(t.year).includes(term) ||
              t.status.toLowerCase().includes(term) ||
              t.note.toLowerCase().includes(term)
            );
          }

          // Simulate server sorting
          if (params?.sortBy) {
            const sortKey = params.sortBy as keyof Trip;
            const isAsc = params.sortDirection !== 'desc';
            filtered.sort((a, b) => {
              const valA = a[sortKey];
              const valB = b[sortKey];
              if (valA === valB) return 0;
              if (valA === null || valA === undefined) return 1;
              if (valB === null || valB === undefined) return -1;
              return isAsc ? (valA > valB ? 1 : -1) : (valA > valB ? -1 : 1);
            });
          }

          return filtered;
        }),
        tap(data => {
          this.tripsSignal.set(data);
          this.totalCountSignal.set(data.length);
          this.isLoadingSignal.set(false);
        }),
        catchError(err => {
          this.handleError(err, 'Failed to retrieve trips');
          return throwError(() => err);
        })
      );
    }

    // ─── B. REAL API MODE (When environment.useMockApi === false) ───
    // Build query parameters (e.g. ?page=1&pageSize=10&search=cloud&sortBy=name)
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(key => {
        const val = params[key];
        if (val !== undefined && val !== null && val !== '') {
          httpParams = httpParams.set(key, String(val));
        }
      });
    }

    return this.http.get<ApiResponse<Trip[]> | PaginatedResponse<Trip> | Trip[]>(this.baseUrl, {
      params: httpParams
    }).pipe(
      map(res => {
        // Adapt to common REST response formats:
        // Case 1: Standard enterprise envelope `{ data: Trip[], ... }`
        if (res && 'data' in res && Array.isArray((res as ApiResponse<Trip[]>).data)) {
          return (res as ApiResponse<Trip[]>).data;
        }
        // Case 2: Paginated envelope `{ items: Trip[], total: number }`
        if (res && 'items' in res && Array.isArray((res as PaginatedResponse<Trip>).items)) {
          const paginated = res as PaginatedResponse<Trip>;
          this.totalCountSignal.set(paginated.total);
          return paginated.items;
        }
        // Case 3: Direct array `Trip[]`
        if (Array.isArray(res)) {
          return res;
        }
        return [];
      }),
      tap(data => {
        this.tripsSignal.set(data);
        if (!params || !params.page) {
          this.totalCountSignal.set(data.length);
        }
        this.isLoadingSignal.set(false);
      }),
      catchError(err => {
        this.handleError(err, 'Failed to fetch trips from server');
        return throwError(() => err);
      })
    );
  }

  // ==========================================================================
  // 2. POST /trips - Create a new trip
  // ==========================================================================
  /**
   * Add a new trip.
   *
   * 💡 HOW TO INTEGRATE REAL BACKEND:
   * Real API URL: `POST ${environment.apiUrl}/trips`
   * Body payload: `dto` (name, year, status, note)
   */
  addTrip(dto: CreateTripDto): Observable<Trip> {
    this.isLoadingSignal.set(true);

    // ─── A. MOCK MODE ───
    if (environment.useMockApi) {
      const newTrip: Trip = {
        id: `TRP-${Math.floor(100 + Math.random() * 900)}`,
        name: dto.name.trim(),
        year: dto.year || new Date().getFullYear(),
        status: dto.status || 'draft',
        note: dto.note?.trim() || '—',
        createdAt: new Date().toISOString().split('T')[0]
      };

      return of(newTrip).pipe(
        delay(350),
        tap(created => {
          this.mockTripsStore = [created, ...this.mockTripsStore];
          this.tripsSignal.update(trips => [created, ...trips]);
          this.totalCountSignal.update(count => count + 1);
          this.isLoadingSignal.set(false);

          this.notificationService.success(
            `Trip "${created.name}" created with default status (${TRIP_STATUS_LABELS[created.status] || created.status}).`,
            'Trip Created'
          );
        }),
        catchError(err => {
          this.handleError(err, 'Failed to create trip');
          return throwError(() => err);
        })
      );
    }

    // ─── B. REAL API MODE ───
    return this.http.post<ApiResponse<Trip> | Trip>(this.baseUrl, dto).pipe(
      map(res => ('data' in res ? (res as ApiResponse<Trip>).data : (res as Trip))),
      tap(created => {
        this.tripsSignal.update(trips => [created, ...trips]);
        this.totalCountSignal.update(c => c + 1);
        this.isLoadingSignal.set(false);
        this.notificationService.success(`Trip "${created.name}" created successfully.`, 'Trip Created');
      }),
      catchError(err => {
        this.handleError(err, 'Failed to create trip on server');
        return throwError(() => err);
      })
    );
  }

  // ==========================================================================
  // 3. PATCH /trips/:id/status - Update trip status
  // ==========================================================================
  /**
   * Update the status of an existing trip.
   *
   * 💡 HOW TO INTEGRATE REAL BACKEND:
   * Real API URL: `PATCH ${environment.apiUrl}/trips/${tripId}/status`
   * Body payload: `{ status: newStatus }`
   */
  updateTripStatus(tripId: string, newStatus: TripStatus): Observable<Trip> {
    const current = this.tripsSignal().find(t => t.id === tripId);
    const tripName = current ? current.name : tripId;

    // ─── A. MOCK MODE ───
    if (environment.useMockApi) {
      return of({ ...current!, status: newStatus }).pipe(
        delay(250),
        tap(updated => {
          this.mockTripsStore = this.mockTripsStore.map(t => (t.id === tripId ? updated : t));
          this.tripsSignal.update(trips => trips.map(t => (t.id === tripId ? updated : t)));

          const statusLabel = TRIP_STATUS_LABELS[newStatus] || newStatus;
          this.notificationService.success(
            `Status for "${tripName}" changed to: ${statusLabel}`,
            'Status Updated'
          );
        }),
        catchError(err => {
          this.handleError(err, 'Failed to update trip status');
          return throwError(() => err);
        })
      );
    }

    // ─── B. REAL API MODE ───
    const url = `${this.baseUrl}/${tripId}/status`;
    return this.http.patch<ApiResponse<Trip> | Trip>(url, { status: newStatus }).pipe(
      map(res => ('data' in res ? (res as ApiResponse<Trip>).data : (res as Trip))),
      tap(updated => {
        this.tripsSignal.update(trips => trips.map(t => (t.id === tripId ? updated : t)));
        const statusLabel = TRIP_STATUS_LABELS[newStatus] || newStatus;
        this.notificationService.success(`Status for "${tripName}" changed to: ${statusLabel}`, 'Status Updated');
      }),
      catchError(err => {
        this.handleError(err, 'Failed to update status on server');
        return throwError(() => err);
      })
    );
  }

  // ==========================================================================
  // 4. DELETE /trips/:id - Delete a trip
  // ==========================================================================
  /**
   * Delete a trip by ID.
   *
   * 💡 HOW TO INTEGRATE REAL BACKEND:
   * Real API URL: `DELETE ${environment.apiUrl}/trips/${tripId}`
   */
  deleteTrip(tripId: string): Observable<void> {
    const current = this.tripsSignal().find(t => t.id === tripId);
    const tripName = current?.name || tripId;

    // ─── A. MOCK MODE ───
    if (environment.useMockApi) {
      return of(void 0).pipe(
        delay(250),
        tap(() => {
          this.mockTripsStore = this.mockTripsStore.filter(t => t.id !== tripId);
          this.tripsSignal.update(trips => trips.filter(t => t.id !== tripId));
          this.totalCountSignal.update(c => Math.max(0, c - 1));
          this.notificationService.info(`Trip "${tripName}" deleted.`, 'Trip Removed');
        }),
        catchError(err => {
          this.handleError(err, 'Failed to delete trip');
          return throwError(() => err);
        })
      );
    }

    // ─── B. REAL API MODE ───
    const url = `${this.baseUrl}/${tripId}`;
    return this.http.delete<void>(url).pipe(
      tap(() => {
        this.tripsSignal.update(trips => trips.filter(t => t.id !== tripId));
        this.totalCountSignal.update(c => Math.max(0, c - 1));
        this.notificationService.info(`Trip "${tripName}" deleted.`, 'Trip Removed');
      }),
      catchError(err => {
        this.handleError(err, 'Failed to delete trip on server');
        return throwError(() => err);
      })
    );
  }

  // ==========================================================================
  // 5. GET /trips/:id - Retrieve single trip detail
  // ==========================================================================
  getTripById(tripId: string): Observable<Trip> {
    if (environment.useMockApi) {
      const found = this.mockTripsStore.find(t => t.id === tripId);
      if (!found) {
        return throwError(() => new Error(`Trip ${tripId} not found`));
      }
      return of(found).pipe(delay(200));
    }

    return this.http.get<ApiResponse<Trip> | Trip>(`${this.baseUrl}/${tripId}`).pipe(
      map(res => ('data' in res ? (res as ApiResponse<Trip>).data : (res as Trip)))
    );
  }

  private handleError(err: any, fallbackMessage: string): void {
    this.isLoadingSignal.set(false);
    const msg = err?.message || fallbackMessage;
    this.errorSignal.set(msg);
  }
}
