import type { HTMLAttributes, ReactNode } from 'react';

import { cx } from '@/shared/lib';
import { Icon, type IconName } from '@/shared/ui/icon';

export type StatusTone = 'error' | 'info' | 'neutral' | 'success' | 'warning';

export type StatusBadgeProps = Omit<
  HTMLAttributes<HTMLSpanElement>,
  'children'
> & {
  icon?: IconName;
  label: ReactNode;
  showDot?: boolean;
  tone?: StatusTone;
};

const toneClasses = {
  error: {
    badge: 'bg-[var(--color-surface-error)] text-[var(--color-error)]',
    dot: 'bg-[var(--color-error)]',
  },
  info: {
    badge: 'bg-[var(--color-surface-info)] text-[var(--color-info)]',
    dot: 'bg-[var(--color-info)]',
  },
  neutral: {
    badge: 'bg-[var(--color-surface-muted)] text-[var(--color-text-secondary)]',
    dot: 'bg-[var(--color-text-secondary)]',
  },
  success: {
    badge: 'bg-[var(--color-surface-success)] text-[var(--color-success)]',
    dot: 'bg-[var(--color-success)]',
  },
  warning: {
    badge: 'bg-[var(--color-surface-warning)] text-[var(--color-warning)]',
    dot: 'bg-[var(--color-warning)]',
  },
} satisfies Record<StatusTone, { badge: string; dot: string }>;

export function StatusBadge({
  className,
  icon,
  label,
  role,
  showDot,
  tone = 'neutral',
  ...props
}: StatusBadgeProps) {
  const colors = toneClasses[tone];
  const shouldShowDot = showDot ?? !icon;

  return (
    <span
      {...props}
      className={cx(
        'inline-flex max-w-full items-center gap-2 rounded-full px-2.5 py-1.5',
        'text-xs font-bold leading-none',
        colors.badge,
        className,
      )}
      role={role ?? 'status'}
    >
      {shouldShowDot ? (
        <span
          aria-hidden="true"
          className={cx('size-1.5 shrink-0 rounded-full', colors.dot)}
        />
      ) : null}
      {icon ? <Icon name={icon} size={14} /> : null}
      <span className="min-w-0">{label}</span>
    </span>
  );
}
