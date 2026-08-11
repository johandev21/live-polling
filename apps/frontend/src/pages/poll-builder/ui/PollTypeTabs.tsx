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
        className="w-full sm:w-fit grid grid-cols-3 sm:flex"
      >
        {pollTypeOptions.map(({ icon: TypeIcon, label, type }) => (
          <TabsTrigger
            aria-controls="poll-builder-form"
            id={`poll-type-option-${type}`}
            key={type}
            value={type}
            className="px-3 sm:px-4 py-1.5 text-xs sm:text-sm"
          >
            <TypeIcon aria-hidden="true" size={15} />
            <span>{label}</span>
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
