import type { ReactNode } from 'react';

import { Spinner } from '@/components/ui/spinner';
import { useHostSessionGuard } from '@/shared/hooks/use-host-auth';

type SignedOutGuardProps = Readonly<{
  children: ReactNode;
}>;

export function SignedOutGuard({ children }: SignedOutGuardProps) {
  const isChecking = useHostSessionGuard();

  if (isChecking) {
    return (
      <main className="grid min-h-screen w-full place-items-center bg-mist-50 dark:bg-background">
        <Spinner className="size-6" />
      </main>
    );
  }

  return children;
}
