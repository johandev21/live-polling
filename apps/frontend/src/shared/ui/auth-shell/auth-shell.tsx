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
    <main className="min-h-screen bg-[var(--color-bg-canvas)] lg:grid lg:grid-cols-[minmax(19rem,36vw)_minmax(0,1fr)]">
      <aside
        aria-describedby={bodyId}
        aria-labelledby={headingId}
        className="flex min-h-64 flex-col justify-between gap-12 bg-[var(--color-primary)] p-7 sm:p-10 lg:min-h-screen lg:p-14"
      >
        <Brand aria-label="Pulse home" href="/" size="lg" tone="inverse" />
        <div className="flex max-w-md flex-col gap-5">
          <p className="font-[var(--font-mono)] text-xs font-bold tracking-[0.16em] text-[var(--color-text-on-primary-soft)]">
            {eyebrow}
          </p>
          <h1
            className="text-4xl font-bold leading-[1.08] tracking-[-0.04em] text-[var(--color-text-on-primary)] sm:text-5xl lg:text-[2.75rem]"
            id={headingId}
          >
            {heading}
          </h1>
          <p
            className="max-w-sm text-base leading-6 text-[var(--color-text-on-primary-muted)]"
            id={bodyId}
          >
            {body}
          </p>
        </div>
        <div className="flex items-center gap-2.5 text-xs text-[var(--color-text-on-primary-soft)]">
          <FooterIcon aria-hidden="true" size={17} strokeWidth={1.8} />
          <span>{footer}</span>
        </div>
      </aside>
      <section
        aria-label="Page content"
        className="flex min-h-[32rem] items-center justify-center bg-[var(--color-surface)] px-5 py-12 sm:px-8 lg:min-h-screen lg:px-12"
      >
        <div className="w-full max-w-md">{children}</div>
      </section>
    </main>
  );
}
