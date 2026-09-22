import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AppErrorBoundary } from '../components/AppErrorBoundary';
import { SessionProvider } from '../contexts/SessionProvider';
import { SignupFlowProvider } from '../features/auth/SignupFlowProvider';
export function AppProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({ defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } } }),
  );
  return (
    <AppErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <SessionProvider>
          <SignupFlowProvider>
            <BrowserRouter>{children}</BrowserRouter>
          </SignupFlowProvider>
        </SessionProvider>
      </QueryClientProvider>
    </AppErrorBoundary>
  );
}
