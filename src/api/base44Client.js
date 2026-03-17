// Base44 client removed. All API calls now go to our own backend
// via the axios client defined in `src/api/client.js`.
// This dummy export exists only so legacy imports `import { base44 }` don't crash.
// Remaining references to `base44` should be migrated to the new backend APIs.
export const base44 = {};
