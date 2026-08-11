import type { ReactNode } from 'react';

export type GlassHeaderProps = Readonly<{
  children: ReactNode;
  className?: string;
  containerClassName?: string;
}>;

export function GlassHeader({
  children,
  className = '',
  containerClassName = 'max-w-7xl px-4 sm:px-6 lg:px-8',
}: GlassHeaderProps) {
  return (
    <header
      className={`sticky top-0 z-40 w-full glass-effect transition-all ${className}`}
    >
      <div
        className={`mx-auto flex w-full items-center justify-between gap-4 py-3 ${containerClassName}`}
      >
        {children}
      </div>
    </header>
  );
}
