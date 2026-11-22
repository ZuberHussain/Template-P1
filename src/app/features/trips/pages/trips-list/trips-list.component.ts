import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '@core/services/auth.service';
import { NotificationService } from '@core/services/notification.service';
import { DataTableComponent, TableColumn, TableDropdownAction } from '@shared/components/data-table/data-table.component';
import { ButtonComponent } from '@shared/components/button/button.component';
import { TripFormModalComponent } from '../../components/trip-form-modal/trip-form-modal.component';
import {
  TripYearDto,
  TripYearRow,
  CreateTripDto,
  TripStatus,
  TRIP_STATUS_LABELS,
  TRIP_STATUS_BADGES
} from '../../models/trip.model';

// Re-export type so external components or projects can import it directly
export type { TripYearRow, TripYearDto };

/**
 * 📦 Default mock data for local testing
 */
const INITIAL_MOCK_ROWS: TripYearRow[] = [
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

@Component({
  selector: 'app-trips-list',
  standalone: true,
  imports: [CommonModule, DataTableComponent, ButtonComponent, TripFormModalComponent],
  templateUrl: './trips-list.component.html',
  styleUrl: './trips-list.component.scss'
})
export class TripsListComponent {
  private readonly authService = inject(AuthService);
  private readonly notificationService = inject(NotificationService);

  // ==========================================================================
  // 🟢 STEP 1: DATA ROWS SIGNAL
  // --------------------------------------------------------------------------
  // WHY:
  // Using an Angular signal<TripYearRow[]> provides fine-grained reactivity.
  // When an item's status is upgraded or deleted, updating this signal
  // immediately updates the data table without full-page reloads.
  // ==========================================================================
  readonly rows = signal<TripYearRow[]>([...INITIAL_MOCK_ROWS]);

  // Modal State for adding new trips
  readonly isAddModalOpen = signal<boolean>(false);

  // ==========================================================================
  // 🟢 STEP 2: COMPUTED PERMISSION SIGNALS (Signal Compute)
  // --------------------------------------------------------------------------
  // WHY:
  // - Using `computed()` creates memoized reactive boolean signals.
  // - Unlike normal methods, `computed()` only re-calculates when the underlying
  //   auth/user state changes (e.g. role switch, token refresh, login/logout).
  // - In your other project: replace `this.authService.currentUser()` with your
  //   project's own user store or permission service.
  // ==========================================================================

  /**
   * 💡 canUpgrade Signal:
   * Returns true if the active user has upgrade permissions (Admin / Manager).
   * Drives the visibility of "Upgrade Trip" in the action dropdown.
   */
  protected readonly canUpgrade = computed<boolean>(() => {
    const user = this.authService.currentUser();
    return user?.role === 'ADMIN' || user?.role === 'MANAGER';
  });

  /**
   * 💡 canEdit Signal:
   * Returns true if the user can modify records.
   */
  protected readonly canEdit = computed<boolean>(() => {
    const user = this.authService.currentUser();
    return user?.role === 'ADMIN' || user?.role === 'MANAGER' || user?.role === 'DEVELOPER';
  });

  /**
   * 💡 canDelete Signal:
   * Returns true if the user has full administrative deletion rights.
   */
  protected readonly canDelete = computed<boolean>(() => {
    const user = this.authService.currentUser();
    return user?.role === 'ADMIN';
  });

  /**
   * 💡 canView Signal:
   * Returns true for any authenticated user.
   */
  protected readonly canView = computed<boolean>(() => {
    return this.authService.isAuthenticated();
  });

  // ==========================================================================
  // 🟢 STEP 3: ROW-LEVEL GUARD METHODS
  // --------------------------------------------------------------------------
  // WHY:
  // - Permission signals alone (e.g. canUpgrade) only know IF the user is allowed.
  // - Row guards combine User Capability (canUpgrade()) with Business Status
  //   (row.status === 'draft').
  // - This prevents showing "Upgrade" on a trip that is already Open or Closed.
  // ==========================================================================

  protected canUpgradeRow(row: TripYearRow): boolean {
    return this.canUpgrade() && row.status === 'draft';
  }

  protected canCloseRow(row: TripYearRow): boolean {
    return this.canUpgrade() && row.status === 'open';
  }

  protected canReopenRow(row: TripYearRow): boolean {
    return this.canUpgrade() && row.status === 'closed';
  }

  protected canEditRow(row: TripYearRow): boolean {
    return this.canEdit() && row.status !== 'closed';
  }

  protected canDeleteRow(row: TripYearRow): boolean {
    return this.canDelete();
  }

  // ==========================================================================
  // 🟢 STEP 4: TABLE COLUMNS CONFIGURATION
  // --------------------------------------------------------------------------
  // WHY:
  // Centralizes table headers, cell renderers, and custom badge classes.
  // ==========================================================================
  readonly columns: TableColumn<TripYearRow>[] = [
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
      render: (row: TripYearRow) => TRIP_STATUS_LABELS[row.status] || row.status,
      badgeClass: (row: TripYearRow) => TRIP_STATUS_BADGES[row.status] || 'status-badge badge-draft'
    },
    {
      key: 'note',
      header: 'Notes',
      render: (row: TripYearRow) => (row.note as string) || '—'
    },
    {
      key: 'createdAt',
      header: 'Created Date',
      sortable: true,
      align: 'center',
      width: '140px'
    }
  ];

  // ==========================================================================
  // 🟢 STEP 5: ACTION DROPDOWN CONFIGURATION (Driven by computed signals)
  // --------------------------------------------------------------------------
  // WHY:
  // - Fully declarative: define rules for each action once.
  // - `visible: (row) => ...` determines if this action button is shown.
  // - `disabled: (row) => ...` visually disables the button if condition fails.
  // - `danger: true` applies red alert styling for destructive actions (Delete).
  // ==========================================================================
  readonly tableActions: TableDropdownAction<TripYearRow>[] = [
    // 1. Upgrade Action: Shown ONLY if canUpgrade() is true AND row is 'draft'
    {
      id: 'upgrade_trip',
      label: 'Upgrade Trip',
      icon: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="18 15 12 9 6 15"></polyline></svg>`,
      visible: (row: TripYearRow) => this.canUpgradeRow(row),
      action: (row: TripYearRow) => this.handleUpgrade(row)
    },

    // 2. Edit Action: Visible if canEdit() is true; disabled if closed
    {
      id: 'edit_trip',
      label: 'Edit Trip',
      icon: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>`,
      visible: () => this.canEdit(),
      disabled: (row: TripYearRow) => !this.canEditRow(row),
      action: (row: TripYearRow) => this.handleEdit(row)
    },

    // 3. Close Trip: Visible if canUpgrade() is true AND row is 'open'
    {
      id: 'close_trip',
      label: 'Close Trip',
      icon: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>`,
      visible: (row: TripYearRow) => this.canCloseRow(row),
      action: (row: TripYearRow) => this.handleStatusChange(row.id, 'closed')
    },

    // 4. Re-open Trip: Visible if canUpgrade() is true AND row is 'closed'
    {
      id: 'reopen_trip',
      label: 'Re-open Trip',
      icon: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><polyline points="3 3 3 8 8 8"></polyline></svg>`,
      visible: (row: TripYearRow) => this.canReopenRow(row),
      action: (row: TripYearRow) => this.handleStatusChange(row.id, 'open')
    },

    // 5. Delete Action: Visible in dropdown ONLY if canDelete() is true
    {
      id: 'delete_trip',
      label: 'Delete Trip',
      icon: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>`,
      danger: true,
      visible: () => this.canDelete(),
      action: (row: TripYearRow) => this.handleDeleteTrip(row.id)
    }
  ];

  // ==========================================================================
  // 🟢 STEP 6: ACTION EXECUTION HANDLERS
  // ==========================================================================
  handleUpgrade(row: TripYearRow): void {
    this.handleStatusChange(row.id, 'open');
    this.notificationService.success(`Trip "${row.name}" upgraded to Open status.`, 'Trip Upgraded');
  }

  handleEdit(row: TripYearRow): void {
    this.notificationService.info(`Edit mode initiated for "${row.name}".`, 'Edit Trip');
  }

  handleStatusChange(tripId: string, newStatus: TripStatus): void {
    const current = this.rows().find(r => r.id === tripId);
    if (!current) return;

    this.rows.update(rows =>
      rows.map(row => (row.id === tripId ? { ...row, status: newStatus } : row))
    );

    const label = TRIP_STATUS_LABELS[newStatus] || newStatus;
    this.notificationService.success(`Status for "${current.name}" changed to: ${label}`, 'Status Updated');
  }

  handleDeleteTrip(tripId: string): void {
    const current = this.rows().find(r => r.id === tripId);
    this.rows.update(rows => rows.filter(r => r.id !== tripId));

    if (current) {
      this.notificationService.info(`Trip "${current.name}" deleted.`, 'Trip Removed');
    }
  }

  openAddTripModal(): void {
    this.isAddModalOpen.set(true);
  }

  closeAddTripModal(): void {
    this.isAddModalOpen.set(false);
  }

  onSaveNewTrip(dto: CreateTripDto): void {
    const newTrip: TripYearRow = {
      id: `TRP-${Math.floor(100 + Math.random() * 900)}`,
      name: dto.name.trim(),
      year: dto.year || new Date().getFullYear(),
      status: dto.status || 'draft',
      note: dto.note?.trim() || '—',
      createdAt: new Date().toISOString().split('T')[0]
    };

    this.rows.update(rows => [newTrip, ...rows]);
    this.closeAddTripModal();

    this.notificationService.success(
      `Trip "${newTrip.name}" created with default status (${TRIP_STATUS_LABELS[newTrip.status] || newTrip.status}).`,
      'Trip Created'
    );
  }
}
