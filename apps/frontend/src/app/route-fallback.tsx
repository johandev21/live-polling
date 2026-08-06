import { Brand, Button, CenteredCardLayout } from '@/shared/ui';

import type { RouteFallbackProps } from './router';

export function DefaultRouteFallback({
  navigate,
  pathname,
}: RouteFallbackProps) {
  return (
    <CenteredCardLayout maxWidth="sm">
      <div className="flex flex-col gap-6">
        <Brand size="md" />
        <div className="flex flex-col gap-3">
          <p className="font-[var(--font-mono)] text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-primary)]">
            Pulse foundation
          </p>
          <h1 className="text-3xl font-bold tracking-[-0.03em] text-[var(--color-text-primary)]">
            This page is ready for its slice.
          </h1>
          <p className="text-sm leading-6 text-[var(--color-text-secondary)]">
            No page has been registered for{' '}
            <code className="rounded bg-[var(--color-surface-muted)] px-1.5 py-0.5 font-[var(--font-mono)] text-xs text-[var(--color-text-primary)]">
              {pathname}
            </code>{' '}
            yet.
          </p>
        </div>
        <Button endIcon="arrowRight" onClick={() => navigate('/')}>
          Return to Pulse home
        </Button>
      </div>
    </CenteredCardLayout>
  );
}
