import { QueryClient } from "@tanstack/react-query";

/**
 * All API error toasts are handled globally by the Axios response interceptor
 * in src/api/client.js. No additional error handler is needed here.
 */
export const queryClientInstance = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      // Retry once for transient network blips; a second failure triggers
      // the axios interceptor toast.
      retry: 1,
      retryDelay: (attempt) => Math.min(1_000 * 2 ** attempt, 10_000),
    },
    mutations: {
      // Never silently retry mutations — fail fast so the error toast appears
      // immediately and the loading state resolves.
      retry: 0,
    },
  },
});
