import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableQueryParams } from '@core/models/api-response.model';
import { DataTableComponent, TableColumn, TableDropdownAction } from '@shared/components/data-table/data-table.component';
import { ButtonComponent } from '@shared/components/button/button.component';
import { TripService } from '../../services/trip.service';
import { Trip, CreateTripDto, TripStatus, TRIP_STATUS_LABELS, TRIP_STATUS_BADGES } from '../../models/trip.model';
import { TripFormModalComponent } from '../../components/trip-form-modal/trip-form-modal.component';

@Component({
  selector: 'app-trips-list',
  standalone: true,
  imports: [CommonModule, DataTableComponent, ButtonComponent, TripFormModalComponent],
  templateUrl: './trips-list.component.html',
  styleUrl: './trips-list.component.scss'
})
export class TripsListComponent {
  private readonly tripService = inject(TripService);

  // Reactive State from Trip API Service
  readonly trips = this.tripService.trips;
  readonly isLoading = this.tripService.isLoading;
  readonly error = this.tripService.error;
  readonly totalCount = this.tripService.totalCount;

  // Add Trip Modal Visibility
  readonly isAddModalOpen = signal<boolean>(false);

  // 1. Table Columns Configuration
  readonly columns: TableColumn<Trip>[] = [
    {
      key: 'name',
      header: 'Trip Name',
      sortable: true
    },
    {
      key: 'year',
      header: 'Year',
      sortable: true,
      align: 'center',
      width: '100px'
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      align: 'center',
      width: '140px',
      cellType: 'badge',
      render: (trip: Trip) => TRIP_STATUS_LABELS[trip.status] || trip.status,
      badgeClass: (trip: Trip) => TRIP_STATUS_BADGES[trip.status] || 'status-badge badge-draft'
    },
    {
      key: 'note',
      header: 'Notes',
      render: (trip: Trip) => trip.note || '—'
    },
    {
      key: 'createdAt',
      header: 'Created Date',
      sortable: true,
      align: 'center',
      width: '140px'
    }
  ];

  // 2. Table Dropdown Actions (Permission-Based Status Transitions)
  readonly tableActions: TableDropdownAction<Trip>[] = [
    // Transition Draft -> Open
    {
      id: 'transition_to_open',
      label: 'Open Trip',
      permission: 'TRIP_STATUS_CHANGE',
      visible: (trip: Trip) => trip.status === 'draft',
      action: (trip: Trip) => this.handleStatusChange(trip.id, 'open')
    },
    // Transition Open -> Closed
    {
      id: 'transition_to_close',
      label: 'Close Trip',
      permission: 'TRIP_STATUS_CHANGE',
      visible: (trip: Trip) => trip.status === 'open',
      action: (trip: Trip) => this.handleStatusChange(trip.id, 'closed')
    },
    // Transition Closed -> Re-open
    {
      id: 'transition_reopen',
      label: 'Re-open Trip',
      permission: 'TRIP_STATUS_CHANGE',
      visible: (trip: Trip) => trip.status === 'closed',
      action: (trip: Trip) => this.handleStatusChange(trip.id, 'open')
    },
    // Delete action (Admin only)
    {
      id: 'delete_trip',
      label: 'Delete Trip',
      permission: 'TRIP_DELETE',
      danger: true,
      action: (trip: Trip) => this.handleDeleteTrip(trip.id)
    }
  ];

  openAddTripModal(): void {
    this.isAddModalOpen.set(true);
  }

  closeAddTripModal(): void {
    this.isAddModalOpen.set(false);
  }

  onSaveNewTrip(dto: CreateTripDto): void {
    this.tripService.addTrip(dto).subscribe({
      next: () => {
        this.closeAddTripModal();
      }
    });
  }

  onRefresh(): void {
    this.tripService.loadTrips().subscribe();
  }

  onQueryChange(params: TableQueryParams): void {
    this.tripService.loadTrips(params).subscribe();
  }

  private handleStatusChange(tripId: string, newStatus: TripStatus): void {
    this.tripService.updateTripStatus(tripId, newStatus).subscribe();
  }

  private handleDeleteTrip(tripId: string): void {
    this.tripService.deleteTrip(tripId).subscribe();
  }
}
