import { CircleDot, ListChecks, MessageSquare } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Tabs } from '@base-ui/react/tabs';

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
  return (
    <Tabs.Root
      value={value}
      onValueChange={(val) => val && onChange(val as PollType)}
    >
      <Tabs.List
        aria-controls="poll-builder-form"
        aria-label="Poll type"
        className="flex w-full flex-wrap gap-1 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] p-1"
      >
        {pollTypeOptions.map(({ icon: TypeIcon, label, type }) => (
          <Tabs.Tab
            aria-controls="poll-builder-form"
            className="inline-flex min-h-9 flex-1 items-center justify-center gap-2 rounded-[calc(var(--radius-sm)-2px)] px-3 text-sm font-semibold text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-surface-muted)] data-[selected]:bg-[var(--color-primary-soft)] data-[selected]:text-[var(--color-primary)] sm:flex-none sm:px-4"
            id={`poll-type-option-${type}`}
            key={type}
            value={type}
          >
            <TypeIcon aria-hidden="true" size={16} />
            {label}
          </Tabs.Tab>
        ))}
      </Tabs.List>
    </Tabs.Root>
  );
}
