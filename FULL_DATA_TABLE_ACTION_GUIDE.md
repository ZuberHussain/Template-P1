# 📘 Master Guide: Data Table Action Column & Permission System
### How to implement in any Angular project from scratch (Step-by-Step with the "Why" behind every line)

---

## 🧭 Overview & Execution Roadmap

When building an enterprise data table with permission-based dropdown actions in Angular, follow this exact sequence:

```
┌────────────────────────────────────────────────────────────────────────┐
│  Step 1: Data Model & Row Type (Dto & Record<string, unknown>)         │
│  Step 2: Table Action Interface (TableDropdownAction<T>)               │
│  Step 3: Component Signals (rows signal & computed permission signals) │
│  Step 4: Row-Level Guard Methods (Combining permission + row state)    │
│  Step 5: Action Column Configuration (tableActions array)              │
│  Step 6: Table Template & Dropdown UI (Reusable or Raw HTML Table)     │
│  Step 7: Click-Outside Directive & Styling                             │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 🧱 STEP 1: Define the Data Model & Row Type

### The Code (`src/app/models/trip-year.model.ts`):
```typescript
export type TripStatus = 'draft' | 'open' | 'closed' | string;

/**
 * 1. Base Backend DTO: Represents the exact shape sent by the server.
 */
export interface TripYearDto {
  id: string;
  name: string;
  year: number;
  status: TripStatus;
  note?: string;
  createdAt: string;
}

/**
 * 2. Table Row Type:
 * Combines the strict DTO with a dynamic record index signature.
 */
export type TripYearRow = TripYearDto & Record<string, unknown>;
```

### 💡 WHY DO WE WRITE IT THIS WAY?
1. **Separation of Concerns**: `TripYearDto` matches the strict API contract from your backend.
2. **Why `& Record<string, unknown>`?**:
   - In TypeScript, generic reusable data tables need to dynamically access row fields using column keys: `row[col.key]`.
   - Without `Record<string, unknown>`, TypeScript in `strict` mode throws:
     `Element implicitly has an 'any' type because type 'TripYearDto' has no index signature.`
   - Adding `& Record<string, unknown>` tells TypeScript: *"This object has all the strict fields of `TripYearDto`, but also safely allows string-based property lookups `row[key]`."*

---

## ⚙️ STEP 2: Define the Table Action Contract

### The Code (`src/app/shared/components/data-table/data-table.models.ts`):
```typescript
export interface TableDropdownAction<T = any> {
  id: string;                      // Unique identifier for the action (e.g. 'upgrade', 'edit')
  label: string;                   // Text displayed in the dropdown button
  icon?: string;                   // Optional SVG HTML icon string
  danger?: boolean;                // If true, applies red/destructive styling (e.g. Delete)
  visible?: (item: T) => boolean;  // Dynamic visibility rule (evaluated per row)
  disabled?: (item: T) => boolean; // Dynamic disabled rule (evaluated per row)
  action: (item: T) => void;       // Callback function executed on click
}
```

### 💡 WHY DO WE WRITE IT THIS WAY?
1. **Decoupled Architecture**: Notice that `TableDropdownAction` contains **no imports of AuthService or hardcoded role names**.
2. **Pure Functional Flexibility**:
   - Instead of hardcoding `permission: 'ADMIN'`, we use `visible: (row) => boolean`.
   - This allows any component to pass any condition: checking a signal (`this.canUpgrade()`), checking the row status (`row.status === 'draft'`), or both!
   - This makes the table 100% portable to ANY project regardless of how that project handles auth.

---

## 🛡️ STEP 3: Component Signals & Computed Permissions

### The Code (`src/app/pages/trips-list/trips-list.component.ts`):
```typescript
import { Component, computed, inject, signal } from '@angular/core';
import { TripYearRow, TripStatus } from './models/trip-year.model';
import { TableDropdownAction } from './data-table.models';
import { AuthService } from '@core/services/auth.service';

@Component({
  selector: 'app-trips-list',
  standalone: true,
  templateUrl: './trips-list.component.html'
})
export class TripsListComponent {
  private readonly authService = inject(AuthService);

  // 1. Data Rows Signal initialized with Mock Data
  readonly rows = signal<TripYearRow[]>([
    { id: 'TRP-101', name: 'Conference Alpha', year: 2026, status: 'draft', createdAt: '2026-01-15' },
    { id: 'TRP-102', name: 'Logistics Beta', year: 2026, status: 'open', createdAt: '2026-02-01' },
    { id: 'TRP-103', name: 'Security Audit', year: 2025, status: 'closed', createdAt: '2025-11-20' }
  ]);

  // ==========================================================================
  // COMPUTED PERMISSION SIGNALS
  // ==========================================================================
  /**
   * canUpgrade Signal:
   * Evaluates to true if the active user has upgrade privileges.
   */
  protected readonly canUpgrade = computed<boolean>(() => {
    const user = this.authService.currentUser();
    // Plug in your project's user/role/permission logic here:
    return user?.role === 'ADMIN' || user?.role === 'MANAGER';
  });

  protected readonly canEdit = computed<boolean>(() => {
    const user = this.authService.currentUser();
    return user?.role === 'ADMIN' || user?.role === 'DEVELOPER';
  });

  protected readonly canDelete = computed<boolean>(() => {
    const user = this.authService.currentUser();
    return user?.role === 'ADMIN';
  });
```

### 💡 WHY DO WE WRITE IT THIS WAY?
1. **Why `computed()` signals instead of regular methods (`getCanUpgrade()`)?**:
   - In Angular templates, regular methods run on **every single change detection cycle**, leading to performance degradation.
   - `computed()` signals are **memoized**: they only re-evaluate when their dependencies (like `currentUser()`) change.
2. **Why `protected`?**:
   - `protected` exposes the signals to the component's HTML template while keeping them encapsulated from external components.

---

## 🔍 STEP 4: Row-Level Guard Methods

### The Code:
```typescript
  // ==========================================================================
  // ROW-LEVEL GUARDS
  // ==========================================================================
  /**
   * Can a specific row be upgraded?
   * Requires:
   * 1. User has upgrade permission (canUpgrade() is true)
   * 2. The row is in 'draft' status (you cannot upgrade an already open/closed row)
   */
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
    // Only editable if user has edit permission AND row is not permanently closed
    return this.canEdit() && row.status !== 'closed';
  }

  protected canDeleteRow(row: TripYearRow): boolean {
    return this.canDelete();
  }
```

### 💡 WHY DO WE WRITE IT THIS WAY?
- **Separation of User Capability vs. Business State**:
  - `canUpgrade()` answers: *"Is the user allowed to upgrade trips?"*
  - `canUpgradeRow(row)` answers: *"Is this specific trip eligible to be upgraded right now?"*
- Combining both guarantees that even if a user is an Admin, they won't see invalid actions (like "Upgrade" on a trip that is already Open or Closed).

---

## ⚡ STEP 5: Define the Table Actions Configuration

### The Code:
```typescript
  // ==========================================================================
  // TABLE ACTIONS ARRAY
  // ==========================================================================
  readonly tableActions: TableDropdownAction<TripYearRow>[] = [
    // 1. Upgrade Trip (Visible in dropdown ONLY if canUpgradeRow(row) is true)
    {
      id: 'upgrade_trip',
      label: 'Upgrade Trip',
      icon: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="18 15 12 9 6 15"></polyline></svg>`,
      visible: (row: TripYearRow) => this.canUpgradeRow(row),
      action: (row: TripYearRow) => this.handleUpgrade(row)
    },

    // 2. Edit Trip (Visible if canEdit(); disabled if closed)
    {
      id: 'edit_trip',
      label: 'Edit Trip',
      icon: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path></svg>`,
      visible: () => this.canEdit(),
      disabled: (row: TripYearRow) => !this.canEditRow(row),
      action: (row: TripYearRow) => this.handleEdit(row)
    },

    // 3. Close Trip (Visible if canCloseRow(row) is true)
    {
      id: 'close_trip',
      label: 'Close Trip',
      icon: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>`,
      visible: (row: TripYearRow) => this.canCloseRow(row),
      action: (row: TripYearRow) => this.handleStatusChange(row.id, 'closed')
    },

    // 4. Delete Trip (Destructive danger action)
    {
      id: 'delete_trip',
      label: 'Delete Trip',
      danger: true,
      visible: () => this.canDelete(),
      action: (row: TripYearRow) => this.handleDeleteTrip(row.id)
    }
  ];

  // Action Handlers
  handleUpgrade(row: TripYearRow): void {
    this.handleStatusChange(row.id, 'open');
  }

  handleEdit(row: TripYearRow): void {
    console.log('Edit clicked for', row);
  }

  handleStatusChange(id: string, newStatus: TripStatus): void {
    this.rows.update(rows =>
      rows.map(r => (r.id === id ? { ...r, status: newStatus } : r))
    );
  }

  handleDeleteTrip(id: string): void {
    this.rows.update(rows => rows.filter(r => r.id !== id));
  }
```

### 💡 WHY DO WE WRITE IT THIS WAY?
- **Declarative vs Imperative**: All action rules (icon, visibility, disabled state, click handler) are declared in one clean list.
- **Easy Maintenance**: Adding a 6th or 7th action in the future requires adding only one object to this array without touching any HTML!

---

## 🖥️ STEP 6: Table Template & Dropdown UI

You have two choices for using this in your other project:

---

### Option A: Using `<app-data-table>` (Recommended Component approach)

In `trips-list.component.html`:
```html
<app-data-table
  [data]="rows()"
  [columns]="columns"
  [actions]="tableActions"
  actionsHeader="Actions"
  rowIdKey="id"
></app-data-table>
```

#### How `<app-data-table>` handles actions internally:
1. Filters actions using `getPermittedActions(row)`:
   ```typescript
   getPermittedActions(row: T): TableDropdownAction<T>[] {
     return this.actions().filter(action => {
       if (action.visible && !action.visible(row)) return false;
       return true;
     });
   }
   ```
2. If `getPermittedActions(row).length > 0`, it displays the **Options** dropdown button.
3. If no actions are permitted for that row, it automatically displays `<span class="no-permissions-badge">Restricted</span>`.

---

### Option B: Direct HTML Table (If writing a custom table without `<app-data-table>`)

In your component TypeScript:
```typescript
readonly activeDropdownRowId = signal<string | number | null>(null);

toggleDropdown(rowId: string, event: MouseEvent): void {
  event.stopPropagation();
  this.activeDropdownRowId.update(curr => (curr === rowId ? null : rowId));
}

closeDropdown(): void {
  this.activeDropdownRowId.set(null);
}

getPermittedActions(row: TripYearRow): TableDropdownAction<TripYearRow>[] {
  return this.tableActions.filter(action => {
    if (action.visible && !action.visible(row)) return false;
    return true;
  });
}
```

In your component HTML:
```html
<table>
  <thead>
    <tr>
      <th>Trip Name</th>
      <th>Year</th>
      <th>Status</th>
      <th class="actions-header text-center">Actions</th>
    </tr>
  </thead>
  <tbody>
    @for (row of rows(); track row.id) {
      <tr>
        <td>{{ row.name }}</td>
        <td>{{ row.year }}</td>
        <td><span class="status-badge">{{ row.status }}</span></td>

        <!-- ACTION DROPDOWN CELL -->
        <td class="actions-cell text-center">
          @if (getPermittedActions(row).length > 0) {
            <div class="dropdown-wrapper" (appClickOutside)="closeDropdown()">
              <!-- Dropdown Trigger Button -->
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
                <div class="dropdown-menu animate-fade-in" role="menu">
                  <div class="dropdown-header">Actions</div>
                  @for (action of getPermittedActions(row); track action.id) {
                    <button
                      type="button"
                      class="dropdown-item"
                      [class.item-danger]="action.danger"
                      [disabled]="action.disabled && action.disabled(row)"
                      (click)="action.action(row); closeDropdown()"
                      role="menuitem"
                    >
                      @if (action.icon) {
                        <span class="action-icon" [innerHTML]="action.icon"></span>
                      }
                      <span class="action-label">{{ action.label }}</span>
                    </button>
                  }
                </div>
              }
            </div>
          } @else {
            <!-- Restricted indicator when user lacks permissions -->
            <span class="no-permissions-badge">Restricted</span>
          }
        </td>
      </tr>
    }
  </tbody>
</table>
```

---

## 🎨 STEP 7: Dropdown Styling & Click-Outside

### Click-Outside Directive (`src/app/shared/directives/click-outside.directive.ts`):
```typescript
import { Directive, ElementRef, inject, output } from '@angular/core';

@Directive({
  selector: '[appClickOutside]',
  standalone: true,
  host: {
    '(document:click)': 'onDocumentClick($event)'
  }
})
export class ClickOutsideDirective {
  private readonly elementRef = inject(ElementRef);
  clickOutside = output<void>({ alias: 'appClickOutside' });

  onDocumentClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.clickOutside.emit();
    }
  }
}
```

### SCSS Styles:
```scss
.actions-cell {
  position: relative;
  overflow: visible; // Crucial: lets dropdown float above table boundaries
}

.dropdown-wrapper {
  position: relative;
  display: inline-block;
}

.dropdown-toggle-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.875rem;
  background-color: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  color: #1e293b;
  font-size: 0.8125rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    border-color: #2563eb;
    color: #2563eb;
    background-color: #eff6ff;
  }
}

.dropdown-menu {
  position: absolute;
  top: calc(100% + 6px);
  right: 0; // In LTR layout (or inset-inline-end in RTL)
  z-index: 1000;
  min-width: 180px;
  background-color: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
  padding: 0.375rem;

  .dropdown-header {
    padding: 0.375rem 0.75rem;
    font-size: 0.6875rem;
    font-weight: 600;
    color: #64748b;
    text-transform: uppercase;
    border-bottom: 1px solid #f1f5f9;
    margin-bottom: 0.25rem;
  }

  .dropdown-item {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 0.75rem;
    border: none;
    background: transparent;
    border-radius: 6px;
    color: #1e293b;
    font-size: 0.8125rem;
    text-align: left;
    cursor: pointer;

    &:hover:not(:disabled) {
      background-color: #eff6ff;
      color: #2563eb;
    }

    &.item-danger {
      color: #dc2626;

      &:hover:not(:disabled) {
        background-color: #fef2f2;
      }
    }

    &:disabled {
      opacity: 0.45;
      cursor: not-allowed;
    }
  }
}

.no-permissions-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.75rem;
  color: #94a3b8;
  background-color: #f8fafc;
  padding: 0.25rem 0.625rem;
  border-radius: 4px;
  border: 1px dashed #cbd5e1;
}
```

---

## 🚀 5-Minute Checklist to Transfer to Your Other Project

1. [ ] **Copy the Type**: In your model file, export `type MyRow = MyDto & Record<string, unknown>`.
2. [ ] **Copy the Action Interface**: Include `TableDropdownAction<T>`.
3. [ ] **Define your Signal**: `rows = signal<MyRow[]>(MOCK_DATA)`.
4. [ ] **Define Computed Permissions**: Create `protected readonly canUpgrade = computed(() => ...)`.
5. [ ] **Define Row Guards**: Create `protected canUpgradeRow(row) { return this.canUpgrade() && row.status === '...'; }`.
6. [ ] **Define `tableActions`**: Set `visible: (row) => this.canUpgradeRow(row)`.
7. [ ] **Add to Template**: Pass to `<app-data-table [data]="rows()" [actions]="tableActions">` (or use the raw table snippet).
