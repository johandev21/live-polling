import { cloneElement, type ReactElement, type ReactNode } from 'react';

import { cx } from '@/shared/lib';

type FieldControlProps = {
  'aria-describedby'?: string;
  'aria-errormessage'?: string;
  'aria-invalid'?: boolean | 'false' | 'true';
  id?: string;
  required?: boolean;
};

export type FieldProps = {
  children: ReactElement<FieldControlProps>;
  className?: string;
  error?: ReactNode;
  hint?: ReactNode;
  id: string;
  label: ReactNode;
  required?: boolean;
};

export function Field({
  children,
  className,
  error,
  hint,
  id,
  label,
  required = false,
}: FieldProps) {
  const describedBy = [
    children.props['aria-describedby'],
    hint ? `${id}-hint` : null,
    error ? `${id}-error` : null,
  ]
    .filter(Boolean)
    .join(' ');
  const control = cloneElement(children, {
    'aria-describedby': describedBy || undefined,
    'aria-errormessage': error ? `${id}-error` : undefined,
    'aria-invalid': error ? true : children.props['aria-invalid'],
    id,
    required: required || children.props.required,
  });

  return (
    <div className={cx('flex w-full flex-col gap-2', className)}>
      <label
        className="text-sm font-semibold text-[var(--color-text-primary)]"
        htmlFor={id}
      >
        {label}
        {required ? (
          <span aria-hidden="true" className="ml-1 text-[var(--color-error)]">
            *
          </span>
        ) : null}
      </label>
      {control}
      {hint || error ? (
        <div className="flex flex-col gap-1">
          {hint ? (
            <p
              className="text-xs leading-5 text-[var(--color-text-tertiary)]"
              id={`${id}-hint`}
            >
              {hint}
            </p>
          ) : null}
          {error ? (
            <p
              aria-live="polite"
              className="text-xs leading-5 text-[var(--color-error)]"
              id={`${id}-error`}
              role="alert"
            >
              {error}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
