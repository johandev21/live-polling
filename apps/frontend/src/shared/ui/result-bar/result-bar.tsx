import type { HTMLAttributes, ReactNode } from 'react';

import { cx } from '@/shared/lib';

export type ResultBarProps = Omit<
  HTMLAttributes<HTMLDivElement>,
  'children'
> & {
  ariaLabel?: string;
  count: number;
  countLabel?: ReactNode;
  label: ReactNode;
  percentage: number;
  percentageLabel?: ReactNode;
};

export function ResultBar({
  ariaLabel,
  className,
  count,
  countLabel = 'responses',
  label,
  percentage,
  percentageLabel = `${percentage}%`,
  'aria-label': nativeAriaLabel,
  ...props
}: ResultBarProps) {
  const visualPercentage = Math.min(100, Math.max(0, percentage));
  const accessibleLabel = ariaLabel ?? nativeAriaLabel ?? 'Result percentage';
  const valueText =
    typeof percentageLabel === 'string'
      ? percentageLabel
      : typeof percentageLabel === 'number'
        ? `${percentageLabel}`
        : `${percentage}%`;

  return (
    <div
      {...props}
      aria-label={accessibleLabel}
      className={cx('flex w-full flex-col gap-2', className)}
      role="group"
    >
      <div className="flex items-baseline justify-between gap-4 text-sm">
        <span className="min-w-0 break-words font-semibold text-[var(--color-text-primary)]">
          {label}
        </span>
        <span className="shrink-0 font-[var(--font-mono)] text-xs font-semibold text-[var(--color-primary)]">
          {percentageLabel}
        </span>
      </div>
      <div
        aria-label={accessibleLabel}
        aria-valuemax={100}
        aria-valuemin={0}
        aria-valuenow={visualPercentage}
        aria-valuetext={valueText}
        className="h-2 w-full overflow-hidden rounded-full bg-[var(--color-surface-muted)]"
        role="progressbar"
      >
        <div
          className="h-full rounded-full bg-[var(--color-primary)] transition-[width] motion-reduce:transition-none"
          style={{ width: `${visualPercentage}%` }}
        />
      </div>
      <span className="text-xs text-[var(--color-text-tertiary)]">
        {count} {countLabel}
      </span>
    </div>
  );
}
