export const environment = {
  production: false,
  // 🔌 BACKEND API BASE URL: Replace with your actual local or staging API URL
  apiUrl: 'http://localhost:3000/api/v1',
  appName: 'Enterprise Template [Dev]',
  version: '1.0.0-dev',
  /**
   * 🔌 API INTEGRATION SWITCH:
   * - `true`: Uses realistic mock simulation with network delay (works out of the box with zero setup).
   * - `false`: Dispatches real HTTP requests to `apiUrl` using Angular's HttpClient.
   */
  useMockApi: true
};

