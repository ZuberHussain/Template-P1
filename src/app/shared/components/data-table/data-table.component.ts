import { Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { AuthService } from '@core/services/auth.service';
import { TableQueryParams } from '@core/models/api-response.model';
import { ClickOutsideDirective } from '../../directives/click-outside.directive';
import { PaginationComponent } from '../pagination/pagination.component';
import { LoadingSpinnerComponent } from '../loading-spinner/loading-spinner.component';

export interface TableColumn<T = any> {
  key: string;
  header: string;
  sortable?: boolean;
  align?: 'start' | 'center' | 'end';
  width?: string;
  cellType?: 'text' | 'badge';
  render?: (item: T) => string | number;
  badgeClass?: (item: T) => string;
}

export interface TableDropdownAction<T = any> {
  id: string;
  label: string;
  icon?: string;
  permission?: string; // Required user permission to see this action
  danger?: boolean;
  visible?: (item: T) => boolean;
  disabled?: (item: T) => boolean;
  action: (item: T) => void;
}

@Component({
  selector: 'app-data-table',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ClickOutsideDirective,
    PaginationComponent,
    LoadingSpinnerComponent
  ],
  templateUrl: './data-table.component.html',
  styleUrl: './data-table.component.scss'
})
export class DataTableComponent<T extends Record<string, any>> {
  private readonly authService = inject(AuthService);
  private readonly searchSubject = new Subject<string>();

  // ==========================================
  // Core Table Inputs
  // ==========================================
  data = input.required<T[]>();
  columns = input.required<TableColumn<T>[]>();
  actions = input<TableDropdownAction<T>[]>([]);
  actionsHeader = input<string>('Actions');
  searchPlaceholder = input<string>('Search records...');
  searchable = input<boolean>(true);
  emptyMessage = input<string>('No matching records found');
  rowIdKey = input<string>('id');

  // ==========================================
  // API & State Inputs
  // ==========================================
  /** Whether an asynchronous API call is currently in progress */
  loading = input<boolean>(false);
  loadingMessage = input<string>('Loading records from server...');
  /** Optional error message returned from failed API fetch */
  errorMessage = input<string | null>(null);
  /** Toggle reload button in table toolbar */
  showRefresh = input<boolean>(true);
  /**
   * Server-Side Mode:
   * - If `false` (default): Client-side pagination, searching, and sorting are performed locally.
   * - If `true`: Emits `queryChange` event whenever page, search, or sort changes so the API handles querying.
   */
  serverSide = input<boolean>(false);
  /** Total count of records from backend API (used when serverSide is true) */
  totalItems = input<number | null>(null);

  // ==========================================
  // Pagination Inputs
  // ==========================================
  paginated = input<boolean>(true);
  pageSize = input<number>(5);
  pageSizeOptions = input<number[]>([5, 10, 20, 50]);

  // ==========================================
  // API & Event Outputs
  // ==========================================
  /** Emits when page, pageSize, search, or sort changes (ideal for server-side API calls) */
  queryChange = output<TableQueryParams>();
  /** Emits when the user clicks the Refresh button */
  refresh = output<void>();
  /** Emits when the user clicks Retry on an error */
  retry = output<void>();

  // ==========================================
  // Internal State Signals
  // ==========================================
  readonly searchTerm = signal<string>('');
  readonly activeDropdownRowId = signal<string | number | null>(null);
  readonly sortColumn = signal<string | null>(null);
  readonly sortDirection = signal<'asc' | 'desc'>('asc');
  readonly currentPage = signal<number>(1);
  readonly currentPageSize = signal<number>(5);

  constructor() {
    effect(() => {
      this.currentPageSize.set(this.pageSize());
    });

    // Debounced search handler for smooth server-side and client-side searching
    this.searchSubject
      .pipe(
        debounceTime(350),
        distinctUntilChanged(),
        takeUntilDestroyed()
      )
      .subscribe(term => {
        this.searchTerm.set(term);
        this.currentPage.set(1); // Reset to page 1 on new search
        this.activeDropdownRowId.set(null);

        if (this.serverSide()) {
          this.emitQueryChange();
        }
      });
  }

  // 1. Filtered & Sorted Data
  readonly filteredData = computed(() => {
    // In Server-Side mode, data is pre-filtered and sorted by the backend API
    if (this.serverSide()) {
      return this.data() || [];
    }

    let rows = [...(this.data() || [])];
    const term = this.searchTerm().trim().toLowerCase();

    // Client-side search across visible column values
    if (term) {
      rows = rows.filter(item => {
        return this.columns().some(col => {
          const val = col.render ? col.render(item) : item[col.key];
          if (val === null || val === undefined) return false;
          return String(val).toLowerCase().includes(term);
        });
      });
    }

    // Client-side sorting
    const sortKey = this.sortColumn();
    const sortDir = this.sortDirection();
    if (sortKey) {
      rows.sort((a, b) => {
        const valA = a[sortKey];
        const valB = b[sortKey];
        if (valA === valB) return 0;
        if (valA === null || valA === undefined) return 1;
        if (valB === null || valB === undefined) return -1;

        const comparison = valA > valB ? 1 : -1;
        return sortDir === 'asc' ? comparison : -comparison;
      });
    }

    return rows;
  });

  // 2. Paginated Rows for Display
  readonly paginatedRows = computed(() => {
    // In Server-Side mode, data is already the current page's slice returned from the API
    if (this.serverSide()) {
      return this.data() || [];
    }

    const rows = this.filteredData();
    if (!this.paginated()) {
      return rows;
    }

    const page = this.currentPage();
    const size = this.currentPageSize();
    const startIndex = (page - 1) * size;
    return rows.slice(startIndex, startIndex + size);
  });

  // 3. Effective Total Count for Pagination component
  readonly effectiveTotalCount = computed(() => {
    if (this.serverSide()) {
      return this.totalItems() !== null && this.totalItems() !== undefined
        ? this.totalItems()!
        : (this.data()?.length || 0);
    }
    return this.filteredData().length;
  });

  onSearchInput(value: string): void {
    this.searchSubject.next(value);
  }

  clearSearch(): void {
    this.onSearchInput('');
  }

  handleSort(columnKey: string, isSortable?: boolean): void {
    if (!isSortable) return;

    if (this.sortColumn() === columnKey) {
      if (this.sortDirection() === 'asc') {
        this.sortDirection.set('desc');
      } else {
        this.sortColumn.set(null);
        this.sortDirection.set('asc');
      }
    } else {
      this.sortColumn.set(columnKey);
      this.sortDirection.set('asc');
    }

    if (this.serverSide()) {
      this.emitQueryChange();
    }
  }

  onPageChange(page: number): void {
    this.currentPage.set(page);
    this.activeDropdownRowId.set(null);

    if (this.serverSide()) {
      this.emitQueryChange();
    }
  }

  onPageSizeChange(size: number): void {
    this.currentPageSize.set(size);
    this.currentPage.set(1);
    this.activeDropdownRowId.set(null);

    if (this.serverSide()) {
      this.emitQueryChange();
    }
  }

  onRefresh(): void {
    this.refresh.emit();
  }

  onRetry(): void {
    this.retry.emit();
  }

  private emitQueryChange(): void {
    this.queryChange.emit({
      page: this.currentPage(),
      pageSize: this.currentPageSize(),
      search: this.searchTerm().trim() || undefined,
      sortBy: this.sortColumn() || undefined,
      sortDirection: this.sortColumn() ? this.sortDirection() : undefined
    });
  }

  toggleDropdown(row: T, event: MouseEvent): void {
    event.stopPropagation();
    const rowId = row[this.rowIdKey()] ?? JSON.stringify(row);
    if (this.activeDropdownRowId() === rowId) {
      this.activeDropdownRowId.set(null);
    } else {
      this.activeDropdownRowId.set(rowId);
    }
  }

  closeDropdown(): void {
    this.activeDropdownRowId.set(null);
  }

  executeAction(action: TableDropdownAction<T>, row: T, event: MouseEvent): void {
    event.stopPropagation();
    this.closeDropdown();
    action.action(row);
  }

  getPermittedActions(row: T): TableDropdownAction<T>[] {
    return this.actions().filter(action => {
      if (action.permission && !this.authService.hasPermission(action.permission)) {
        return false;
      }
      if (action.visible && !action.visible(row)) {
        return false;
      }
      return true;
    });
  }

  hasAnyAction(row: T): boolean {
    return this.getPermittedActions(row).length > 0;
  }

  getCellValue(row: T, col: TableColumn<T>): string | number {
    if (col.render) {
      return col.render(row);
    }
    return row[col.key] ?? '—';
  }
}
