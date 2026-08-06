import type { HTMLAttributes, ReactNode } from 'react';

import { cx } from '@/shared/lib';
import { Icon, type IconName } from '@/shared/ui/icon';

export type CalloutTone = 'error' | 'info' | 'neutral' | 'success' | 'warning';

export type CalloutProps = Omit<
  HTMLAttributes<HTMLDivElement>,
  'children' | 'title'
> & {
  children: ReactNode;
  icon?: IconName;
  title?: ReactNode;
  tone?: CalloutTone;
};

const toneClasses = {
  error: {
    icon: 'text-[var(--color-error)]',
    surface:
      'border-[var(--color-error)]/25 bg-[var(--color-surface-error)] text-[var(--color-text-primary)]',
  },
  info: {
    icon: 'text-[var(--color-info)]',
    surface:
      'border-[var(--color-info)]/25 bg-[var(--color-surface-info)] text-[var(--color-text-primary)]',
  },
  neutral: {
    icon: 'text-[var(--color-text-secondary)]',
    surface:
      'border-[var(--color-border)] bg-[var(--color-surface-muted)] text-[var(--color-text-primary)]',
  },
  success: {
    icon: 'text-[var(--color-success)]',
    surface:
      'border-[var(--color-success)]/25 bg-[var(--color-surface-success)] text-[var(--color-text-primary)]',
  },
  warning: {
    icon: 'text-[var(--color-warning)]',
    surface:
      'border-[var(--color-warning)]/25 bg-[var(--color-surface-warning)] text-[var(--color-text-primary)]',
  },
} satisfies Record<CalloutTone, { icon: string; surface: string }>;

const defaultIcons = {
  error: 'alertCircle',
  info: 'info',
  neutral: 'info',
  success: 'check',
  warning: 'alertCircle',
} satisfies Record<CalloutTone, IconName>;

export function Callout({
  children,
  className,
  icon,
  role,
  title,
  tone = 'neutral',
  ...props
}: CalloutProps) {
  const colors = toneClasses[tone];

  return (
    <div
      {...props}
      className={cx(
        'flex gap-3 rounded-[var(--radius-md)] border p-4',
        colors.surface,
        className,
      )}
      role={role ?? (tone === 'error' ? 'alert' : 'note')}
    >
      <Icon
        className={cx('mt-0.5 shrink-0', colors.icon)}
        name={icon ?? defaultIcons[tone]}
        size={18}
      />
      <div className="min-w-0 flex-1 text-sm leading-5">
        {title ? (
          <p className="mb-1 font-semibold text-[var(--color-text-primary)]">
            {title}
          </p>
        ) : null}
        <div className="text-[var(--color-text-secondary)]">{children}</div>
      </div>
    </div>
  );
}
