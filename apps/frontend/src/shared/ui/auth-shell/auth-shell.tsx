import { useId, type ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

import { Brand } from '@/shared/ui/brand';

export type AuthShellProps = Readonly<{
  body: ReactNode;
  children: ReactNode;
  eyebrow: ReactNode;
  footer: ReactNode;
  footerIcon: LucideIcon;
  heading: ReactNode;
}>;

export function AuthShell({
  body,
  children,
  eyebrow,
  footer,
  footerIcon: FooterIcon,
  heading,
}: AuthShellProps) {
  const headingId = useId();
  const bodyId = useId();

  return (
    <main className="min-h-screen bg-mist-50 lg:grid lg:grid-cols-[minmax(19rem,36vw)_minmax(0,1fr)] dark:bg-background">
      <aside
        aria-describedby={bodyId}
        aria-labelledby={headingId}
        className="flex min-h-64 flex-col justify-between gap-12 bg-primary p-7 text-primary-foreground sm:p-10 lg:min-h-screen lg:p-14"
      >
        <Brand aria-label="Pulse home" href="/" size="lg" tone="inverse" />
        <div className="flex max-w-md flex-col gap-5">
          <p className="font-mono text-xs font-bold tracking-[0.16em] text-primary-foreground/70">
            {eyebrow}
          </p>
          <h1
            className="text-4xl leading-[1.08] font-bold tracking-[-0.04em] text-primary-foreground sm:text-5xl lg:text-[2.75rem]"
            id={headingId}
          >
            {heading}
          </h1>
          <p
            className="max-w-sm text-base leading-6 text-primary-foreground/80"
            id={bodyId}
          >
            {body}
          </p>
        </div>
        <div className="flex items-center gap-2.5 text-xs text-primary-foreground/70">
          <FooterIcon aria-hidden="true" size={17} strokeWidth={1.8} />
          <span>{footer}</span>
        </div>
      </aside>
      <section
        aria-label="Page content"
        className="flex min-h-128 items-center justify-center bg-card px-5 py-12 sm:px-8 lg:min-h-screen lg:px-12"
      >
        <div className="w-full max-w-md">{children}</div>
      </section>
    </main>
  );
}
