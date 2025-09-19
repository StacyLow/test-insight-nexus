export const config = {
  isDevelopment: import.meta.env.DEV,
  useRealData: true, // Always use Supabase data
  debugDatabase: import.meta.env.VITE_DEBUG_DB === 'true'
};