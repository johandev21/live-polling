import { createElement, type ReactNode } from 'react';

import { cx } from '@/shared/lib';
import { Surface, type SurfacePadding } from '@/shared/ui/surface';

export type CenteredCardMaxWidth = 'lg' | 'md' | 'sm' | 'xl';

export type CenteredCardLayoutProps = {
  as?: 'div' | 'main' | 'section';
  card?: boolean;
  cardClassName?: string;
  children: ReactNode;
  className?: string;
  maxWidth?: CenteredCardMaxWidth;
  padding?: SurfacePadding;
};

const maxWidthClasses = {
  lg: 'max-w-3xl',
  md: 'max-w-xl',
  sm: 'max-w-md',
  xl: 'max-w-5xl',
} satisfies Record<CenteredCardMaxWidth, string>;

export function CenteredCardLayout({
  as = 'main',
  card = true,
  cardClassName,
  children,
  className,
  maxWidth = 'md',
  padding = 'lg',
}: CenteredCardLayoutProps) {
  const content = card ? (
    <Surface
      as="section"
      className={cardClassName}
      elevation="card"
      padding={padding}
    >
      {children}
    </Surface>
  ) : (
    <div className={cardClassName}>{children}</div>
  );

  return createElement(
    as,
    {
      className: cx(
        'grid min-h-screen w-full place-items-center bg-[var(--color-bg-canvas)] px-4 py-8',
        'sm:px-6 lg:px-8',
        className,
      ),
    },
    <div className={cx('w-full', maxWidthClasses[maxWidth])}>{content}</div>,
  );
}
