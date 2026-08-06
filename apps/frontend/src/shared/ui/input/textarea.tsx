import { forwardRef, type TextareaHTMLAttributes } from 'react';

import { cx } from '@/shared/lib';

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  invalid?: boolean;
};

const textareaClasses = [
  'block min-h-32 w-full resize-y rounded-[var(--radius-sm)] border',
  'border-[var(--color-border)] bg-[var(--color-bg-canvas)]',
  'px-4 py-3 text-sm leading-6 text-[var(--color-text-primary)]',
  'placeholder:text-[var(--color-text-tertiary)]',
  'transition-[border-color,background-color]',
  'focus-visible:border-[var(--color-primary)]',
  'aria-invalid:border-[var(--color-error)]',
  'disabled:cursor-not-allowed disabled:opacity-60',
].join(' ');

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea(
    { 'aria-invalid': ariaInvalid, className, invalid, rows = 5, ...props },
    ref,
  ) {
    return (
      <textarea
        {...props}
        ref={ref}
        aria-invalid={invalid ?? ariaInvalid}
        className={cx(textareaClasses, className)}
        rows={rows}
      />
    );
  },
);
