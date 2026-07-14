export const ENV = {
  USE_MOCK_DATA: process.env.EXPO_PUBLIC_USE_MOCK_DATA === 'true',
  /** Bare domain, no `/api` suffix — append `/api` where a path is built. */
  API_BASE_URL: process.env.EXPO_PUBLIC_API_BASE_URL ?? '',
}
