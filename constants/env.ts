export const ENV = {
  USE_MOCK_DATA: process.env.EXPO_PUBLIC_USE_MOCK_DATA === 'true',
  API_BASE_URL:
    process.env.EXPO_PUBLIC_API_BASE_URL ??
    'https://nurse-app.careconnectksa.com/api',
}
