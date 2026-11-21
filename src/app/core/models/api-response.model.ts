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
