import { type ReactNode } from 'react';

import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

type LiveRoomDialogProps = {
  children: ReactNode;
  className?: string;
  descriptionId?: string;
  onClose: () => void;
  titleId: string;
};

export function LiveRoomDialog({
  children,
  className,
  descriptionId,
  onClose,
  titleId,
}: LiveRoomDialogProps) {
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        aria-describedby={descriptionId}
        aria-labelledby={titleId}
        className={cn('gap-0 p-0 overflow-hidden max-w-[calc(100%-2rem)] sm:max-w-2xl', className)}
        showCloseButton={false}
      >
        {children}
      </DialogContent>
    </Dialog>
  );
}
