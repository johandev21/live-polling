import type { ButtonHTMLAttributes } from 'react';
import { Button as BaseButton } from '@base-ui/react/button';

import { cx } from '@/shared/lib';
import { Icon, type IconName } from '@/shared/ui/icon';

export type IconButtonVariant = 'danger' | 'default' | 'primary' | 'quiet';
export type IconButtonSize = 'sm' | 'md' | 'lg';

export type IconButtonProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'children'
> & {
  icon: IconName;
  label: string;
  size?: IconButtonSize;
  variant?: IconButtonVariant;
};

const variantClasses = {
  danger: [
    'border-[var(--color-error)]',
    'bg-[var(--color-surface-error)]',
    'text-[var(--color-error)]',
    'hover:bg-[var(--color-error)]',
    'hover:text-[var(--color-text-on-primary)]',
  ].join(' '),
  default: [
    'border-[var(--color-border)]',
    'bg-[var(--color-surface)]',
    'text-[var(--color-text-secondary)]',
    'hover:bg-[var(--color-surface-muted)]',
  ].join(' '),
  primary: [
    'border-[var(--color-primary)]',
    'bg-[var(--color-primary)]',
    'text-[var(--color-text-on-primary)]',
    'hover:brightness-95',
  ].join(' '),
  quiet: [
    'border-transparent',
    'bg-transparent',
    'text-[var(--color-text-secondary)]',
    'hover:bg-[var(--color-surface-muted)]',
  ].join(' '),
} satisfies Record<IconButtonVariant, string>;

const sizeClasses = {
  lg: 'size-12',
  md: 'size-10',
  sm: 'size-8',
} satisfies Record<IconButtonSize, string>;

const iconSizes = {
  lg: 20,
  md: 18,
  sm: 16,
} satisfies Record<IconButtonSize, number>;

export function IconButton({
  className,
  icon,
  label,
  size = 'md',
  title,
  type = 'button',
  variant = 'default',
  ...props
}: IconButtonProps) {
  return (
    <BaseButton
      {...props}
      aria-label={label}
      className={cx(
        'inline-flex shrink-0 items-center justify-center rounded-[var(--radius-sm)] border',
        'transition-[filter,background-color,border-color,transform] hover:cursor-pointer',
        'active:translate-y-px disabled:cursor-not-allowed disabled:opacity-55 disabled:active:translate-y-0',
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      title={title ?? label}
      type={type}
    >
      <Icon name={icon} size={iconSizes[size]} />
    </BaseButton>
  );
}
