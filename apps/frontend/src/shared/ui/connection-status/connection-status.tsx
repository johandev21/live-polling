import type { ReactNode } from 'react';

import {
  StatusBadge,
  type StatusBadgeProps,
  type StatusTone,
} from '@/shared/ui/status-badge';
import type { IconName } from '@/shared/ui/icon';

export type ConnectionState =
  | 'connected'
  | 'connecting'
  | 'reconnecting'
  | 'stale'
  | 'synchronized';

export type ConnectionStatusProps = Omit<
  StatusBadgeProps,
  'icon' | 'label' | 'tone'
> & {
  label?: ReactNode;
  state: ConnectionState;
};

const stateConfig = {
  connected: {
    icon: 'wifi',
    label: 'Connected',
    tone: 'success',
  },
  connecting: {
    icon: 'loaderCircle',
    label: 'Connecting',
    tone: 'neutral',
  },
  reconnecting: {
    icon: 'refreshCw',
    label: 'Reconnecting',
    tone: 'warning',
  },
  stale: {
    icon: 'wifiOff',
    label: 'Resync needed',
    tone: 'warning',
  },
  synchronized: {
    icon: 'check',
    label: 'Synchronized',
    tone: 'success',
  },
} satisfies Record<
  ConnectionState,
  { icon: IconName; label: string; tone: StatusTone }
>;

export function ConnectionStatus({
  label,
  state,
  ...props
}: ConnectionStatusProps) {
  const config = stateConfig[state];

  return (
    <StatusBadge
      {...props}
      icon={config.icon}
      label={label ?? config.label}
      tone={config.tone}
    />
  );
}
