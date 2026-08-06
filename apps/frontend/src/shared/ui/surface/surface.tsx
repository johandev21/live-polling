import { createElement, type ElementType, type HTMLAttributes } from 'react';

import { cx } from '@/shared/lib';

export type SurfacePadding = 'lg' | 'md' | 'none' | 'sm';
export type SurfaceTone = 'default' | 'inverse' | 'muted';
export type SurfaceElevation = 'card' | 'none';

export type SurfaceProps = Omit<HTMLAttributes<HTMLElement>, 'className'> & {
  as?: ElementType;
  className?: string;
  elevation?: SurfaceElevation;
  padding?: SurfacePadding;
  tone?: SurfaceTone;
};

const toneClasses = {
  default: [
    'border-[var(--color-border)]',
    'bg-[var(--color-surface)]',
    'text-[var(--color-text-primary)]',
  ].join(' '),
  inverse: [
    'border-[var(--color-border-inverse)]',
    'bg-[var(--color-surface-inverse)]',
    'text-[var(--color-text-on-primary)]',
  ].join(' '),
  muted: [
    'border-transparent',
    'bg-[var(--color-surface-muted)]',
    'text-[var(--color-text-primary)]',
  ].join(' '),
} satisfies Record<SurfaceTone, string>;

const paddingClasses = {
  lg: 'p-8 sm:p-10',
  md: 'p-6',
  none: '',
  sm: 'p-4',
} satisfies Record<SurfacePadding, string>;

const elevationClasses = {
  card: 'shadow-[var(--shadow-card)]',
  none: '',
} satisfies Record<SurfaceElevation, string>;

export function Surface({
  as = 'div',
  className,
  elevation = 'none',
  padding = 'md',
  tone = 'default',
  ...props
}: SurfaceProps) {
  return createElement(as, {
    ...props,
    className: cx(
      'rounded-[var(--radius-lg)] border',
      toneClasses[tone],
      paddingClasses[padding],
      elevationClasses[elevation],
      className,
    ),
  });
}
