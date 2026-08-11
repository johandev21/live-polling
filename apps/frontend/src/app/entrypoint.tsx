import { QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from '@tanstack/react-router';

import { TooltipProvider } from '@/components/ui/tooltip';
import { useHostSession } from '@/shared/hooks/use-host-auth';
import { queryClient } from '@/shared/lib/query-client';

import { router } from './router';

function InnerApp() {
  const { data: hostSession, isLoading } = useHostSession();

  const authContext = {
    isAuthenticated: Boolean(hostSession?.user),
    isLoading,
    user: hostSession?.user ?? null,
  };

  return <RouterProvider context={{ auth: authContext }} router={router} />;
}

export function AppEntrypoint() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <InnerApp />
      </TooltipProvider>
    </QueryClientProvider>
  );
}
