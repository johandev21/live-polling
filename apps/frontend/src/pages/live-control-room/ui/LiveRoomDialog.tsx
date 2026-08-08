import { type ReactNode } from 'react';

import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';

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
        className={className}
        showCloseButton={false}
      >
        {children}
      </DialogContent>
    </Dialog>
  );
}
