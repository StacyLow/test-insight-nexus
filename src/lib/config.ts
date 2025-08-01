export const config = {
  mongodb: {
    uri: import.meta.env.VITE_MONGODB_URI || 'mongodb://localhost:27017/testdb',
    database: import.meta.env.VITE_MONGODB_DATABASE_NAME || 'testdb',
    collection: import.meta.env.VITE_MONGODB_COLLECTION_NAME || 'test_results'
  },
  isDevelopment: import.meta.env.DEV,
  useRealData: import.meta.env.VITE_USE_REAL_DATA === 'true',
  debugDatabase: import.meta.env.VITE_DEBUG_DB === 'true'
};