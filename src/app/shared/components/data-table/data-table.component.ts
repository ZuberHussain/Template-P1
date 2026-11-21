import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '@core/services/auth.service';
import { ClickOutsideDirective } from '../../directives/click-outside.directive';
import { PaginationComponent } from '../pagination/pagination.component';

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
  imports: [CommonModule, FormsModule, ClickOutsideDirective, PaginationComponent],
  templateUrl: './data-table.component.html',
  styleUrl: './data-table.component.scss'
})
export class DataTableComponent<T extends Record<string, any>> {
  private readonly authService = inject(AuthService);

  // Table Inputs
  data = input.required<T[]>();
  columns = input.required<TableColumn<T>[]>();
  actions = input<TableDropdownAction<T>[]>([]);
  actionsHeader = input<string>('Actions');
  searchPlaceholder = input<string>('Search records...');
  searchable = input<boolean>(true);
  emptyMessage = input<string>('No matching records found');
  rowIdKey = input<string>('id');

  // Pagination Inputs
  paginated = input<boolean>(true);
  pageSize = input<number>(5);
  pageSizeOptions = input<number[]>([5, 10, 20, 50]);

  // Internal State Signals
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
  }

  // 1. Filtered & Sorted Full Data
  readonly filteredData = computed(() => {
    let rows = [...(this.data() || [])];
    const term = this.searchTerm().trim().toLowerCase();

    // Search filter across visible column values
    if (term) {
      rows = rows.filter(item => {
        return this.columns().some(col => {
          const val = col.render ? col.render(item) : item[col.key];
          if (val === null || val === undefined) return false;
          return String(val).toLowerCase().includes(term);
        });
      });
    }

    // Sorting
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

  // 2. Paginated Slice for Display
  readonly paginatedRows = computed(() => {
    const rows = this.filteredData();
    if (!this.paginated()) {
      return rows;
    }

    const page = this.currentPage();
    const size = this.currentPageSize();
    const startIndex = (page - 1) * size;
    return rows.slice(startIndex, startIndex + size);
  });

  onSearchChange(term: string): void {
    this.searchTerm.set(term);
    this.currentPage.set(1); // Reset to first page on search
    this.activeDropdownRowId.set(null);
  }

  clearSearch(): void {
    this.searchTerm.set('');
    this.currentPage.set(1);
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
  }

  onPageChange(page: number): void {
    this.currentPage.set(page);
    this.activeDropdownRowId.set(null);
  }

  onPageSizeChange(size: number): void {
    this.currentPageSize.set(size);
    this.currentPage.set(1);
    this.activeDropdownRowId.set(null);
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
