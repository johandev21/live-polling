import { type ReactNode } from 'react';
import { Dialog } from '@base-ui/react/dialog';

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
    <Dialog.Root open onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-[var(--color-text-primary)]/35 transition-opacity data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-6">
          <Dialog.Popup
            aria-describedby={descriptionId}
            aria-labelledby={titleId}
            className={className}
          >
            {children}
          </Dialog.Popup>
        </div>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
