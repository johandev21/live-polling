import * as React from 'react';
import { Minus, Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export type NumberInputProps = Readonly<{
  className?: string;
  disabled?: boolean;
  id?: string;
  max?: number;
  min?: number;
  onChange?: (value: number | undefined) => void;
  placeholder?: string;
  step?: number;
  value?: number;
}>;

export function NumberInput({
  className,
  disabled = false,
  id,
  max = 500,
  min = 50,
  onChange,
  placeholder = '500',
  step = 10,
  value,
}: NumberInputProps) {
  const currentValue = value ?? max;

  function handleDecrement() {
    const nextValue = Math.max(min, currentValue - step);
    onChange?.(nextValue);
  }

  function handleIncrement() {
    const nextValue = Math.min(max, currentValue + step);
    onChange?.(nextValue);
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const valStr = e.target.value;
    if (valStr === '') {
      onChange?.(undefined);
      return;
    }
    const num = Number(valStr);
    if (!isNaN(num)) {
      onChange?.(num);
    }
  }

  return (
    <div className={cn('flex items-center gap-1.5', className)}>
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="size-9 shrink-0"
        disabled={disabled || currentValue <= min}
        onClick={handleDecrement}
        aria-label="Decrease value"
      >
        <Minus size={15} />
      </Button>
      <Input
        id={id}
        type="number"
        min={min}
        max={max}
        step={step}
        value={value ?? ''}
        placeholder={placeholder}
        onChange={handleInputChange}
        disabled={disabled}
        className="h-9 w-24 text-center text-sm font-semibold sm:text-base [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
      />
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="size-9 shrink-0"
        disabled={disabled || currentValue >= max}
        onClick={handleIncrement}
        aria-label="Increase value"
      >
        <Plus size={15} />
      </Button>
    </div>
  );
}
