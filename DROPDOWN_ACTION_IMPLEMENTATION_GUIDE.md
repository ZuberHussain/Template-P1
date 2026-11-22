# 📋 Dropdown Action & Permissions Implementation Guide
### (Ready-to-Copy Template for Your Other Project)

This guide shows how to control table dropdown actions using **`computed()` signals** (like `canUpgrade`, `canEdit`, `canDelete`), so an action only appears in the dropdown if the user has the computed capability.

---

## 1. Type Definitions (`trip-year.model.ts`)

```typescript
export type TripStatus = 'draft' | 'open' | 'closed' | string;

export interface TripYearDto {
  id: string;
  name: string;
  year: number;
  status: TripStatus;
  note?: string;
  createdAt: string;
}

/**
 * 🏷️ Row type with flexible index signature as requested:
 */
export type TripYearRow = TripYearDto & Record<string, unknown>;

export const TRIP_STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  open: 'Open',
  closed: 'Closed'
};
```

---

## 2. Component Implementation (`trip-year-list.component.ts`)

```typescript
import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '@core/services/auth.service';
import { TripYearDto, TripYearRow, TripStatus } from './models/trip-year.model';

export interface TableDropdownAction<T = any> {
  id: string;
  label: string;
  icon?: string;
  danger?: boolean;
  visible?: (item: T) => boolean;
  disabled?: (item: T) => boolean;
  action: (item: T) => void;
}

@Component({
  selector: 'app-trip-year-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './trip-year-list.component.html',
  styleUrl: './trip-year-list.component.scss'
})
export class TripYearListComponent {
  private readonly authService = inject(AuthService);

  // ==========================================================================
  // 1. DATA ROWS SIGNAL (Mock Data for local testing)
  // ==========================================================================
  readonly rows = signal<TripYearRow[]>([
    {
      id: 'TRP-101',
      name: 'Annual Global Tech Conference',
      year: 2026,
      status: 'draft',
      note: 'Delegation summit',
      createdAt: '2026-01-15'
    },
    {
      id: 'TRP-102',
      name: 'Dubai Regional Logistics Summit',
      year: 2026,
      status: 'open',
      note: 'Supply chain summit',
      createdAt: '2026-02-01'
    },
    {
      id: 'TRP-103',
      name: 'Cybersecurity Infrastructure Audit',
      year: 2025,
      status: 'closed',
      note: 'Compliance review',
      createdAt: '2025-11-20'
    }
  ]);

  // Track active open dropdown row ID
  readonly activeDropdownRowId = signal<string | number | null>(null);

  // ==========================================================================
  // 2. 🛡️ COMPUTED PERMISSION SIGNALS (Signal Compute)
  // ==========================================================================
  /**
   * 💡 canUpgrade Signal:
   * Computed signal returning boolean whether current user can upgrade records.
   * If true, user can see the "Upgrade" action in the dropdown.
   */
  protected readonly canUpgrade = computed<boolean>(() => {
    const user = this.authService.currentUser();
    // Replace with your project's logic: e.g. user.role === 'ADMIN' or user.canUpgrade
    return user?.role === 'ADMIN' || user?.role === 'MANAGER';
  });

  /**
   * 💡 canEdit Signal:
   */
  protected readonly canEdit = computed<boolean>(() => {
    const user = this.authService.currentUser();
    return user?.role === 'ADMIN' || user?.role === 'DEVELOPER';
  });

  /**
   * 💡 canDelete Signal:
   */
  protected readonly canDelete = computed<boolean>(() => {
    const user = this.authService.currentUser();
    return user?.role === 'ADMIN';
  });

  // --------------------------------------------------------------------------
  // Row-Level Permission Check Methods:
  // Combines the computed signal (user capability) with row state (record status)
  // --------------------------------------------------------------------------
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
  // 3. ⚡ ACTION DROPDOWN CONFIGURATION (Driven by computed signals)
  // ==========================================================================
  readonly tableActions: TableDropdownAction<TripYearRow>[] = [
    // 1. Upgrade Trip (Visible in dropdown ONLY if canUpgrade() is true AND row is draft)
    {
      id: 'upgrade_trip',
      label: 'Upgrade Trip',
      visible: (row: TripYearRow) => this.canUpgradeRow(row),
      action: (row: TripYearRow) => this.handleUpgrade(row)
    },

    // 2. Edit Trip (Visible if canEdit() is true; disabled if row is closed)
    {
      id: 'edit_trip',
      label: 'Edit Trip',
      visible: () => this.canEdit(),
      disabled: (row: TripYearRow) => !this.canEditRow(row),
      action: (row: TripYearRow) => this.handleEdit(row)
    },

    // 3. Close Trip (Visible if canUpgrade() is true AND row is open)
    {
      id: 'close_trip',
      label: 'Close Trip',
      visible: (row: TripYearRow) => this.canCloseRow(row),
      action: (row: TripYearRow) => this.handleStatusChange(row.id, 'closed')
    },

    // 4. Re-open Trip (Visible if canUpgrade() is true AND row is closed)
    {
      id: 'reopen_trip',
      label: 'Re-open Trip',
      visible: (row: TripYearRow) => this.canReopenRow(row),
      action: (row: TripYearRow) => this.handleStatusChange(row.id, 'open')
    },

    // 5. Delete Trip (Visible in dropdown ONLY if canDelete() is true)
    {
      id: 'delete_trip',
      label: 'Delete Trip',
      danger: true,
      visible: () => this.canDelete(),
      action: (row: TripYearRow) => this.handleDelete(row.id)
    }
  ];

  // Helper to filter permitted actions for a specific row
  getPermittedActions(row: TripYearRow): TableDropdownAction<TripYearRow>[] {
    return this.tableActions.filter(action => {
      if (action.visible && !action.visible(row)) return false;
      return true;
    });
  }

  hasAnyAction(row: TripYearRow): boolean {
    return this.getPermittedActions(row).length > 0;
  }

  // Dropdown UI toggle methods
  toggleDropdown(rowId: string, event: MouseEvent): void {
    event.stopPropagation();
    this.activeDropdownRowId.update(current => (current === rowId ? null : rowId));
  }

  closeDropdown(): void {
    this.activeDropdownRowId.set(null);
  }

  executeAction(action: TableDropdownAction<TripYearRow>, row: TripYearRow, event: MouseEvent): void {
    event.stopPropagation();
    this.closeDropdown();
    action.action(row);
  }

  // Action Handlers
  handleUpgrade(row: TripYearRow): void {
    this.handleStatusChange(row.id, 'open');
  }

  handleEdit(row: TripYearRow): void {
    console.log('Edit row:', row);
  }

  handleStatusChange(id: string, newStatus: TripStatus): void {
    this.rows.update(rows =>
      rows.map(r => (r.id === id ? { ...r, status: newStatus } : r))
    );
  }

  handleDelete(id: string): void {
    this.rows.update(rows => rows.filter(r => r.id !== id));
  }
}
```

---

## 3. Template Usage Options

### Option A: Using `<app-data-table>` (Recommended)
```html
<app-data-table
  [data]="rows()"
  [columns]="columns"
  [actions]="tableActions"
  actionsHeader="Actions"
  rowIdKey="id"
></app-data-table>
```

### Option B: Direct HTML Template (For custom `<table>` in your other project)
```html
<td class="actions-cell text-center">
  @if (hasAnyAction(row)) {
    <div class="dropdown-wrapper">
      <button
        type="button"
        class="dropdown-toggle-btn"
        (click)="toggleDropdown(row.id, $event)"
        [attr.aria-expanded]="activeDropdownRowId() === row.id"
      >
        <span>Options</span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </button>

      <!-- Dropdown Menu -->
      @if (activeDropdownRowId() === row.id) {
        <div class="dropdown-menu">
          <div class="dropdown-header">Actions</div>
          @for (action of getPermittedActions(row); track action.id) {
            <button
              type="button"
              class="dropdown-item"
              [class.item-danger]="action.danger"
              [disabled]="action.disabled && action.disabled(row)"
              (click)="executeAction(action, row, $event)"
            >
              <span>{{ action.label }}</span>
            </button>
          }
        </div>
      }
    </div>
  } @else {
    <!-- Restricted badge when user has no permissions -->
    <span class="no-permissions-badge">Restricted</span>
  }
</td>
```
