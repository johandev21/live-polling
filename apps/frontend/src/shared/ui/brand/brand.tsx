import { cx } from '@/shared/lib';

export type BrandSize = 'sm' | 'md' | 'lg';
export type BrandTone = 'default' | 'inverse';

export type BrandProps = {
  'aria-label'?: string;
  className?: string;
  href?: string;
  size?: BrandSize;
  tone?: BrandTone;
};

const sizeClasses = {
  sm: {
    gap: 'gap-2',
    mark: 'size-6',
    wordmark: 'text-lg',
  },
  md: {
    gap: 'gap-2.5',
    mark: 'size-7',
    wordmark: 'text-xl',
  },
  lg: {
    gap: 'gap-3',
    mark: 'size-8',
    wordmark: 'text-2xl',
  },
} satisfies Record<BrandSize, Record<string, string>>;

const toneClasses = {
  default: {
    mark: 'bg-[var(--color-primary)]',
    wordmark: 'text-[var(--color-text-primary)]',
  },
  inverse: {
    mark: 'bg-[var(--color-text-on-primary)]',
    wordmark: 'text-[var(--color-text-on-primary)]',
  },
} satisfies Record<BrandTone, Record<string, string>>;

export function Brand({
  'aria-label': ariaLabel,
  className,
  href,
  size = 'md',
  tone = 'default',
}: BrandProps) {
  const classes = sizeClasses[size];
  const colors = toneClasses[tone];
  const brandClassName = cx(
    'inline-flex w-fit items-center rounded-[var(--radius-sm)] font-semibold',
    classes.gap,
    className,
  );
  const content = (
    <>
      <span
        aria-hidden="true"
        className={cx('shrink-0 rounded-full', classes.mark, colors.mark)}
      />
      <span
        className={cx(
          'font-bold leading-none tracking-[-0.02em]',
          classes.wordmark,
          colors.wordmark,
        )}
      >
        pulse
      </span>
    </>
  );

  if (href) {
    return (
      <a aria-label={ariaLabel} className={brandClassName} href={href}>
        {content}
      </a>
    );
  }

  return (
    <span aria-label={ariaLabel} className={brandClassName}>
      {content}
    </span>
  );
}
