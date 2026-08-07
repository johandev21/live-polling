import { type ReactElement, type ReactNode } from 'react';
import { Field as BaseField } from '@base-ui/react/field';

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
  return (
    <BaseField.Root
      className={cx('flex w-full flex-col gap-2', className)}
      id={id}
      invalid={Boolean(error)}
    >
      <BaseField.Label
        className="text-sm font-semibold text-[var(--color-text-primary)]"
        htmlFor={id}
      >
        {label}
        {required ? (
          <span aria-hidden="true" className="ml-1 text-[var(--color-error)]">
            *
          </span>
        ) : null}
      </BaseField.Label>
      <BaseField.Control render={children} />
      {hint || error ? (
        <div className="flex flex-col gap-1">
          {hint ? (
            <BaseField.Description
              className="text-xs leading-5 text-[var(--color-text-tertiary)]"
              id={`${id}-hint`}
            >
              {hint}
            </BaseField.Description>
          ) : null}
          {error ? (
            <BaseField.Error
              className="text-xs leading-5 text-[var(--color-error)]"
              id={`${id}-error`}
              role="alert"
            >
              {error}
            </BaseField.Error>
          ) : null}
        </div>
      ) : null}
    </BaseField.Root>
  );
}
