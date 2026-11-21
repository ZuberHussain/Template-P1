export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh-token',
    ME: '/auth/me',
    FORGOT_PASSWORD: '/auth/forgot-password'
  },
  USERS: {
    BASE: '/users',
    PROFILE: '/users/profile'
  },
  DASHBOARD: {
    METRICS: '/dashboard/metrics'
  },
  /**
   * 🔌 Trips & Data Table API Endpoints:
   * Adjust these path definitions to match your backend REST routes.
   */
  TRIPS: {
    BASE: '/trips',
    GET_ALL: '/trips',
    GET_BY_ID: (id: string | number) => `/trips/${id}`,
    CREATE: '/trips',
    UPDATE: (id: string | number) => `/trips/${id}`,
    UPDATE_STATUS: (id: string | number) => `/trips/${id}/status`,
    DELETE: (id: string | number) => `/trips/${id}`
  }
} as const;
