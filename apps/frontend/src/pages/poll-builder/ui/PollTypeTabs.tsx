import { CircleDot, ListChecks, MessageSquare } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

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
    <Tabs
      value={value}
      onValueChange={(val) => val && onChange(val as PollType)}
    >
      <TabsList
        aria-controls="poll-builder-form"
        aria-label="Poll type"
        className="flex w-full flex-wrap gap-1 rounded-sm border border-border bg-background p-1"
      >
        {pollTypeOptions.map(({ icon: TypeIcon, label, type }) => (
          <TabsTrigger
            aria-controls="poll-builder-form"
            className="inline-flex min-h-9 flex-1 items-center justify-center gap-2 rounded-[4px] px-3 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted data-[selected]:bg-secondary data-[selected]:text-foreground sm:flex-none sm:px-4"
            id={`poll-type-option-${type}`}
            key={type}
            value={type}
          >
            <TypeIcon aria-hidden="true" size={16} />
            {label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
