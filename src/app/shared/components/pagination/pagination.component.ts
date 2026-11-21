import { Component, computed, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface PaginationChangeEvent {
  page: number;
  pageSize: number;
}

@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './pagination.component.html',
  styleUrl: './pagination.component.scss'
})
export class PaginationComponent {
  // Inputs
  totalItems = input.required<number>();
  pageSize = input<number>(5);
  currentPage = input<number>(1);
  pageSizeOptions = input<number[]>([5, 10, 20, 50]);
  showPageSizeSelector = input<boolean>(true);
  showTotalInfo = input<boolean>(true);

  // Outputs
  pageChange = output<number>();
  pageSizeChange = output<number>();
  paginationChange = output<PaginationChangeEvent>();

  // Computed Values
  readonly totalPages = computed(() => {
    const size = Math.max(1, this.pageSize());
    return Math.max(1, Math.ceil(this.totalItems() / size));
  });

  readonly startItem = computed(() => {
    if (this.totalItems() === 0) return 0;
    return (this.currentPage() - 1) * this.pageSize() + 1;
  });

  readonly endItem = computed(() => {
    return Math.min(this.currentPage() * this.pageSize(), this.totalItems());
  });

  readonly pages = computed<(number | string)[]>(() => {
    const total = this.totalPages();
    const current = this.currentPage();
    const delta = 1; // Number of pages before and after current

    if (total <= 7) {
      // Show all pages if 7 or fewer
      return Array.from({ length: total }, (_, i) => i + 1);
    }

    const range: number[] = [];
    for (
      let i = Math.max(2, current - delta);
      i <= Math.min(total - 1, current + delta);
      i++
    ) {
      range.push(i);
    }

    const pagesWithEllipsis: (number | string)[] = [];

    // Always include first page
    pagesWithEllipsis.push(1);

    if (range[0] > 2) {
      pagesWithEllipsis.push('...');
    }

    pagesWithEllipsis.push(...range);

    if (range[range.length - 1] < total - 1) {
      pagesWithEllipsis.push('...');
    }

    // Always include last page
    pagesWithEllipsis.push(total);

    return pagesWithEllipsis;
  });

  goToPage(page: number | string): void {
    if (typeof page !== 'number') return;
    if (page < 1 || page > this.totalPages() || page === this.currentPage()) return;

    this.pageChange.emit(page);
    this.paginationChange.emit({
      page,
      pageSize: this.pageSize()
    });
  }

  onPageSizeSelect(event: Event): void {
    const newSize = Number((event.target as HTMLSelectElement).value);
    if (newSize === this.pageSize()) return;

    this.pageSizeChange.emit(newSize);
    // When page size changes, jump to page 1
    this.pageChange.emit(1);
    this.paginationChange.emit({
      page: 1,
      pageSize: newSize
    });
  }
}
