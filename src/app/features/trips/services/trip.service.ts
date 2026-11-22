import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { delay, tap } from 'rxjs/operators';
import { environment } from '@env/environment';
import { API_ENDPOINTS } from '@core/constants/api.constants';
import { ApiResponse, PaginatedResponse, TableQueryParams } from '@core/models/api-response.model';
import { NotificationService } from '@core/services/notification.service';
import { TripYearRow, CreateTripDto, TripStatus, TRIP_STATUS_LABELS } from '../models/trip.model';

/**
 * 📦 Default mock dataset for offline development & prototype preview.
 */
const MOCK_TRIP_YEAR_DATA: TripYearRow[] = [
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
    status: 'closed',
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
  }
];

@Injectable({
  providedIn: 'root'
})
export class TripService {
  private readonly http = inject(HttpClient);
  private readonly notificationService = inject(NotificationService);

  // In-memory mock store
  private mockStore: TripYearRow[] = [...MOCK_TRIP_YEAR_DATA];

  // State signals
  private readonly tripsSignal = signal<TripYearRow[]>([...this.mockStore]);
  private readonly isLoadingSignal = signal<boolean>(false);
  private readonly errorSignal = signal<string | null>(null);

  readonly trips = this.tripsSignal.asReadonly();
  readonly isLoading = this.isLoadingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();

  // ==========================================================================
  // 1. GET /trips - Retrieve list of trips
  // ==========================================================================
  loadTrips(params?: TableQueryParams): Observable<TripYearRow[]> {
    this.isLoadingSignal.set(true);

    /* -----------------------------------------------------------------------
     * 🔌 REAL BACKEND API CALL (Commented out for now - using mock data)
     * -----------------------------------------------------------------------
     * const baseUrl = `${environment.apiUrl}${API_ENDPOINTS.TRIPS.BASE}`;
     * let httpParams = new HttpParams();
     * if (params) {
     *   Object.keys(params).forEach(k => {
     *     if (params[k]) httpParams = httpParams.set(k, String(params[k]));
     *   });
     * }
     * return this.http.get<ApiResponse<TripYearRow[]>>(baseUrl, { params: httpParams }).pipe(
     *   map(res => res.data),
     *   tap(data => {
     *     this.tripsSignal.set(data);
     *     this.isLoadingSignal.set(false);
     *   })
     * );
     * ----------------------------------------------------------------------- */

    // Using Mock Data:
    return of(this.mockStore).pipe(
      delay(200),
      tap(data => {
        this.tripsSignal.set(data);
        this.isLoadingSignal.set(false);
      })
    );
  }

  // ==========================================================================
  // 2. POST /trips - Create new trip
  // ==========================================================================
  addTrip(dto: CreateTripDto): Observable<TripYearRow> {
    this.isLoadingSignal.set(true);

    /* -----------------------------------------------------------------------
     * 🔌 REAL BACKEND API CALL (Commented out for now):
     * const baseUrl = `${environment.apiUrl}${API_ENDPOINTS.TRIPS.CREATE}`;
     * return this.http.post<ApiResponse<TripYearRow>>(baseUrl, dto).pipe(...);
     * ----------------------------------------------------------------------- */

    const created: TripYearRow = {
      id: `TRP-${Math.floor(100 + Math.random() * 900)}`,
      name: dto.name.trim(),
      year: dto.year || new Date().getFullYear(),
      status: dto.status || 'draft',
      note: dto.note?.trim() || '—',
      createdAt: new Date().toISOString().split('T')[0]
    };

    return of(created).pipe(
      delay(150),
      tap(item => {
        this.mockStore = [item, ...this.mockStore];
        this.tripsSignal.set([...this.mockStore]);
        this.isLoadingSignal.set(false);
        this.notificationService.success(
          `Trip "${item.name}" created (${TRIP_STATUS_LABELS[item.status] || item.status}).`,
          'Trip Created'
        );
      })
    );
  }

  // ==========================================================================
  // 3. PATCH /trips/:id/status - Update trip status
  // ==========================================================================
  updateTripStatus(tripId: string, newStatus: TripStatus): Observable<TripYearRow> {
    /* -----------------------------------------------------------------------
     * 🔌 REAL BACKEND API CALL (Commented out for now):
     * const url = `${environment.apiUrl}${API_ENDPOINTS.TRIPS.UPDATE_STATUS(tripId)}`;
     * return this.http.patch<ApiResponse<TripYearRow>>(url, { status: newStatus }).pipe(...);
     * ----------------------------------------------------------------------- */

    const current = this.mockStore.find(t => t.id === tripId);
    const updated: TripYearRow = { ...(current || { id: tripId, name: 'Trip', year: 2026, createdAt: '' }), status: newStatus };

    return of(updated).pipe(
      delay(150),
      tap(() => {
        this.mockStore = this.mockStore.map(t => (t.id === tripId ? { ...t, status: newStatus } : t));
        this.tripsSignal.set([...this.mockStore]);

        const label = TRIP_STATUS_LABELS[newStatus] || newStatus;
        this.notificationService.success(`Status updated to: ${label}`, 'Status Updated');
      })
    );
  }

  // ==========================================================================
  // 4. DELETE /trips/:id - Delete trip
  // ==========================================================================
  deleteTrip(tripId: string): Observable<void> {
    /* -----------------------------------------------------------------------
     * 🔌 REAL BACKEND API CALL (Commented out for now):
     * const url = `${environment.apiUrl}${API_ENDPOINTS.TRIPS.DELETE(tripId)}`;
     * return this.http.delete<void>(url).pipe(...);
     * ----------------------------------------------------------------------- */

    return of(void 0).pipe(
      delay(150),
      tap(() => {
        this.mockStore = this.mockStore.filter(t => t.id !== tripId);
        this.tripsSignal.set([...this.mockStore]);
        this.notificationService.info('Trip removed.', 'Deleted');
      })
    );
  }
}
