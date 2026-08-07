import type { ButtonHTMLAttributes } from 'react';
import { Button as BaseButton } from '@base-ui/react/button';

import { cx } from '@/shared/lib';
import { Icon, type IconName } from '@/shared/ui/icon';

export type ButtonVariant = 'destructive' | 'primary' | 'quiet' | 'secondary';
export type ButtonSize = 'sm' | 'md' | 'lg';

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  endIcon?: IconName;
  size?: ButtonSize;
  startIcon?: IconName;
  variant?: ButtonVariant;
};

const variantClasses = {
  destructive: [
    'border-[var(--color-error)]',
    'bg-[var(--color-error)]',
    'text-[var(--color-text-on-primary)]',
    'hover:brightness-95',
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
  secondary: [
    'border-[var(--color-border)]',
    'bg-[var(--color-surface)]',
    'text-[var(--color-text-primary)]',
    'hover:bg-[var(--color-surface-muted)]',
  ].join(' '),
} satisfies Record<ButtonVariant, string>;

const sizeClasses = {
  lg: 'min-h-12 px-5 text-base',
  md: 'min-h-11 px-4 text-sm',
  sm: 'min-h-9 px-3 text-xs',
} satisfies Record<ButtonSize, string>;

const iconSizes = {
  lg: 18,
  md: 16,
  sm: 15,
} satisfies Record<ButtonSize, number>;

export function Button({
  children,
  className,
  endIcon,
  size = 'md',
  startIcon,
  type = 'button',
  variant = 'primary',
  ...props
}: ButtonProps) {
  const iconSize = iconSizes[size];

  return (
    <BaseButton
      {...props}
      className={cx(
        'inline-flex shrink-0 items-center justify-center gap-2 rounded-[var(--radius-sm)] border',
        'font-semibold leading-none transition-[filter,background-color,border-color,transform]',
        'hover:cursor-pointer active:translate-y-px',
        'disabled:cursor-not-allowed disabled:opacity-55 disabled:active:translate-y-0',
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      type={type}
    >
      {startIcon ? <Icon name={startIcon} size={iconSize} /> : null}
      <span>{children}</span>
      {endIcon ? <Icon name={endIcon} size={iconSize} /> : null}
    </BaseButton>
  );
}
