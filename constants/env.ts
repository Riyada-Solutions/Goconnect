export const ENV = {
  USE_MOCK_DATA: process.env.EXPO_PUBLIC_USE_MOCK_DATA === 'false',
  API_BASE_URL:
    process.env.EXPO_PUBLIC_API_BASE_URL ??
    'https://nurse-app.careconnectksa.com/api',
  /** Separate host for the shared signature/image upload endpoint. */
  SIGNATURE_API_BASE_URL:
    process.env.EXPO_PUBLIC_SIGNATURE_API_BASE_URL ??
    'https://staging.careconnectksa.com/api',
}
