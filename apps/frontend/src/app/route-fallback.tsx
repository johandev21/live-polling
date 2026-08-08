import { useLocation, useNavigate } from '@tanstack/react-router';
import { ArrowRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Brand } from '@/shared/ui/brand';

export function DefaultRouteFallback() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return (
    <main className="grid min-h-screen w-full place-items-center bg-background px-4 py-8 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <Card>
          <CardContent className="flex flex-col gap-6 pt-6">
            <Brand size="md" />
            <div className="flex flex-col gap-3">
              <p className="text-xs font-semibold tracking-[0.16em] text-primary uppercase">
                Pulse foundation
              </p>
              <h1 className="text-3xl font-bold tracking-[-0.03em] text-foreground">
                This page is ready for its slice.
              </h1>
              <p className="text-sm leading-6 text-muted-foreground">
                No page has been registered for{' '}
                <code className="rounded bg-muted px-1.5 py-0.5 text-xs text-foreground">
                  {pathname}
                </code>{' '}
                yet.
              </p>
            </div>
            <Button onClick={() => navigate({ to: '/' })}>
              Return to Pulse home
              <ArrowRight />
            </Button>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
