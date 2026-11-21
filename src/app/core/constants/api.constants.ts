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
  }
} as const;
