import { useRef, type KeyboardEvent } from 'react';
import { CircleDot, ListChecks, MessageSquare } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import type { PollType } from '../model/poll-builder';

type PollTypeOption = Readonly<{
  icon: LucideIcon;
  label: string;
  type: PollType;
}>;

const pollTypeOptions: readonly PollTypeOption[] = [
  { icon: CircleDot, label: 'Single choice', type: 'single-choice' },
  { icon: ListChecks, label: 'Multiple choice', type: 'multiple-choice' },
  { icon: MessageSquare, label: 'Open-ended', type: 'open-ended' },
];

export type PollTypeTabsProps = Readonly<{
  onChange: (type: PollType) => void;
  value: PollType;
}>;

export function PollTypeTabs({ onChange, value }: PollTypeTabsProps) {
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);

  function selectOption(index: number) {
    const option = pollTypeOptions[index];
    if (!option) {
      return;
    }

    onChange(option.type);
    optionRefs.current[index]?.focus();
  }

  function handleKeyDown(
    event: KeyboardEvent<HTMLButtonElement>,
    currentIndex: number,
  ) {
    let nextIndex: number | undefined;

    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      nextIndex = currentIndex + 1;
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      nextIndex = currentIndex - 1;
    } else if (event.key === 'Home') {
      nextIndex = 0;
    } else if (event.key === 'End') {
      nextIndex = pollTypeOptions.length - 1;
    }

    if (nextIndex === undefined) {
      return;
    }

    event.preventDefault();
    const optionCount = pollTypeOptions.length;
    selectOption((nextIndex + optionCount) % optionCount);
  }

  return (
    <div
      aria-controls="poll-builder-form"
      aria-label="Poll type"
      className="flex w-full flex-wrap gap-1 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] p-1"
      role="radiogroup"
    >
      {pollTypeOptions.map(({ icon: TypeIcon, label, type }, index) => {
        const isSelected = value === type;
        return (
          <button
            aria-controls="poll-builder-form"
            aria-checked={isSelected}
            className={[
              'inline-flex min-h-9 flex-1 items-center justify-center gap-2 rounded-[calc(var(--radius-sm)-2px)] px-3 text-sm font-semibold transition-colors sm:flex-none sm:px-4',
              isSelected
                ? 'bg-[var(--color-primary-soft)] text-[var(--color-primary)]'
                : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-muted)]',
            ].join(' ')}
            id={`poll-type-option-${type}`}
            key={type}
            onClick={() => onChange(type)}
            onKeyDown={(event) => handleKeyDown(event, index)}
            ref={(element) => {
              optionRefs.current[index] = element;
            }}
            role="radio"
            tabIndex={isSelected ? 0 : -1}
            type="button"
          >
            <TypeIcon aria-hidden="true" size={16} />
            {label}
          </button>
        );
      })}
    </div>
  );
}
