import { useState, type ReactNode } from 'react';
import {
  QueryClient,
  QueryClientProvider,
  QueryCache,
  MutationCache,
  type DefaultOptions,
} from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

/**
 * QueryProvider
 */

// ---- Default Options ----
const defaultOptions: DefaultOptions = {
  queries: {
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: 3,
    retryDelay: (attemptIndex: number) =>
      Math.min(1000 * 2 ** attemptIndex, 30_000),
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  },
  mutations: {
    retry: 1,
    retryDelay: 1000,
  },
};

interface QueryProviderProps {
  children: ReactNode;
}

export const QueryProvider: React.FC<QueryProviderProps> = ({ children }) => {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions,
        queryCache: new QueryCache({
          onError: (error, query) => {
            // Only handle errors for queries that don't have their own error handling
            if (query.meta?.errorMessage) {
              console.error(`Query Error: ${query.meta.errorMessage}`, error);
            }

            // Global error handling for unauthorized access
            if (error instanceof Error && error.message.includes('401')) {
              window.dispatchEvent(new CustomEvent('auth:unauthorized'));
            }

          },
        }),
        mutationCache: new MutationCache({
          onError: (error, _variables, _context, mutation) => {
            if (mutation.meta?.errorMessage) {
              console.error(
                `Mutation Error: ${mutation.meta.errorMessage}`,
                error
              );
            }

            if (error instanceof Error && error.message.includes('401')) {
              window.dispatchEvent(new CustomEvent('auth:unauthorized'));
            }
          },
          onSuccess: (_data, _variables, _context, mutation) => {
            // Invalidate related queries on successful mutations
            if (mutation.meta?.invalidateQueries) {
              const queriesToInvalidate = mutation.meta
                .invalidateQueries as string[];
              queriesToInvalidate.forEach((queryKey) => {
                queryClient.invalidateQueries({ queryKey: [queryKey] });
              });
            }
          },
        }),
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}

      {import.meta.env.DEV && (
        <ReactQueryDevtools
          initialIsOpen={false}
          position="bottom"
          buttonPosition="bottom-right"
        />
      )}
    </QueryClientProvider>
  );
};