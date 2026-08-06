import { forwardRef, type InputHTMLAttributes } from 'react';

import { cx } from '@/shared/lib';
import { Icon, type IconName } from '@/shared/ui/icon';

export type TextInputProps = InputHTMLAttributes<HTMLInputElement> & {
  invalid?: boolean;
  leadingIcon?: IconName;
};

const inputClasses = [
  'block min-h-12 w-full rounded-[var(--radius-sm)] border',
  'border-[var(--color-border)] bg-[var(--color-bg-canvas)]',
  'px-4 py-3 text-sm text-[var(--color-text-primary)]',
  'placeholder:text-[var(--color-text-tertiary)]',
  'transition-[border-color,background-color]',
  'focus-visible:border-[var(--color-primary)]',
  'aria-invalid:border-[var(--color-error)]',
  'disabled:cursor-not-allowed disabled:opacity-60',
].join(' ');

export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(
  function TextInput(
    {
      'aria-invalid': ariaInvalid,
      className,
      invalid,
      leadingIcon,
      type = 'text',
      ...props
    },
    ref,
  ) {
    const input = (
      <input
        {...props}
        ref={ref}
        aria-invalid={invalid ?? ariaInvalid}
        className={cx(inputClasses, leadingIcon ? 'pl-11' : null, className)}
        type={type}
      />
    );

    if (!leadingIcon) {
      return input;
    }

    return (
      <span className="relative block w-full">
        <Icon
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)]"
          name={leadingIcon}
          size={18}
        />
        {input}
      </span>
    );
  },
);
