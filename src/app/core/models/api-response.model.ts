export interface ApiResponse<T> {
  data: T;
  message?: string;
  timestamp: string;
  status: number;
}

export interface ApiError {
  status: number;
  message: string;
  errors?: Record<string, string[]>;
  timestamp: string;
}

/**
 * Standard Paginated Response Model from Backend REST APIs
 * Customize property names if your backend uses different keys (e.g. results vs items)
 */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages?: number;
}

/**
 * Standard Query Parameters sent to Backend API for Data Tables
 */
export interface TableQueryParams {
  page?: number;
  pageSize?: number;
  search?: string;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  [key: string]: any;
}
