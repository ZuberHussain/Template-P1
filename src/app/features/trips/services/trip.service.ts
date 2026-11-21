import { Injectable, inject, signal } from '@angular/core';
import { Trip, CreateTripDto, TripStatus, TRIP_STATUS_LABELS } from '../models/trip.model';
import { NotificationService } from '@core/services/notification.service';

@Injectable({
  providedIn: 'root'
})
export class TripService {
  private readonly notificationService = inject(NotificationService);

  // Initial Enterprise Mock Trips Data (expanded for pagination demonstration)
  private readonly tripsSignal = signal<Trip[]>([
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
  ]);

  readonly trips = this.tripsSignal.asReadonly();

  /**
   * Add a new trip (default status is draft)
   */
  addTrip(dto: CreateTripDto): Trip {
    const newTrip: Trip = {
      id: `TRP-${Math.floor(100 + Math.random() * 900)}`,
      name: dto.name.trim(),
      year: dto.year || new Date().getFullYear(),
      status: dto.status || 'draft',
      note: dto.note?.trim() || '—',
      createdAt: new Date().toISOString().split('T')[0]
    };

    this.tripsSignal.update(trips => [newTrip, ...trips]);
    this.notificationService.success(
      `Trip "${newTrip.name}" created with default status (${TRIP_STATUS_LABELS[newTrip.status] || newTrip.status}).`,
      'Trip Created'
    );

    return newTrip;
  }

  /**
   * Update the status of a trip
   */
  updateTripStatus(tripId: string, newStatus: TripStatus): void {
    const current = this.tripsSignal().find(t => t.id === tripId);
    if (!current) return;

    this.tripsSignal.update(trips =>
      trips.map(trip =>
        trip.id === tripId ? { ...trip, status: newStatus } : trip
      )
    );

    const statusLabel = TRIP_STATUS_LABELS[newStatus] || newStatus;
    this.notificationService.success(
      `Status for "${current.name}" changed to: ${statusLabel}`,
      'Status Updated'
    );
  }

  deleteTrip(tripId: string): void {
    const current = this.tripsSignal().find(t => t.id === tripId);
    this.tripsSignal.update(trips => trips.filter(t => t.id !== tripId));

    if (current) {
      this.notificationService.info(`Trip "${current.name}" deleted.`, 'Trip Removed');
    }
  }
}
