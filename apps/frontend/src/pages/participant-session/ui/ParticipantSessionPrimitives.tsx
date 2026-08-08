import type { ReactNode } from 'react';
import {
  AlertCircle,
  Check,
  Info,
  LoaderCircle,
  RefreshCw,
  Wifi,
  WifiOff,
} from 'lucide-react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

export type ConnectionState =
  | 'connected'
  | 'connecting'
  | 'reconnecting'
  | 'stale'
  | 'synchronized';

type StatusTone = 'error' | 'info' | 'neutral' | 'success' | 'warning';
type StatusIcon = 'alertCircle' | 'check' | 'info' | 'loaderCircle' | 'refreshCw' | 'wifi' | 'wifiOff';

const statusClasses: Record<StatusTone, string> = {
  error: 'bg-destructive/10 text-destructive',
  info: 'bg-muted text-muted-foreground',
  neutral: 'bg-muted text-muted-foreground',
  success: 'bg-secondary text-secondary-foreground',
  warning: 'bg-muted text-muted-foreground',
};

function StatusIcon({ name }: Readonly<{ name: StatusIcon }>) {
  const props = { 'aria-hidden': true, size: 14 };
  if (name === 'alertCircle') return <AlertCircle {...props} />;
  if (name === 'check') return <Check {...props} />;
  if (name === 'loaderCircle') return <LoaderCircle {...props} />;
  if (name === 'refreshCw') return <RefreshCw {...props} />;
  if (name === 'wifi') return <Wifi {...props} />;
  if (name === 'wifiOff') return <WifiOff {...props} />;
  return <Info {...props} />;
}

export function ParticipantCard({
  children,
  className,
  padding = 'md',
}: Readonly<{ children: ReactNode; className?: string; padding?: 'lg' | 'md' }>) {
  return (
    <section>
      <Card
        className={cn(
          'rounded-lg border-border bg-card text-foreground shadow-none',
          padding === 'lg' ? 'p-8 sm:p-10' : 'p-6',
          className,
        )}
      >
        {children}
      </Card>
    </section>
  );
}

export function ParticipantCallout({
  children,
  icon,
  title,
  tone = 'neutral',
  className,
}: Readonly<{
  children: ReactNode;
  className?: string;
  icon?: StatusIcon;
  title?: ReactNode;
  tone?: StatusTone;
}>) {
  return (
    <Alert
      className={cn(
        'flex gap-3 rounded-md border p-4',
        statusClasses[tone],
        className,
      )}
      role={tone === 'error' ? 'alert' : 'note'}
    >
      {icon ? <StatusIcon name={icon} /> : null}
      <div className="min-w-0 flex-1 text-sm leading-5">
        {title ? <AlertTitle className="mb-1 font-semibold text-foreground">{title}</AlertTitle> : null}
        <AlertDescription className="text-muted-foreground">{children}</AlertDescription>
      </div>
    </Alert>
  );
}

export function ParticipantStatusBadge({
  icon,
  label,
  tone = 'neutral',
}: Readonly<{ icon?: StatusIcon; label: ReactNode; tone?: StatusTone }>) {
  return (
    <Badge
      className={cn(
        'h-auto rounded-full px-2.5 py-1.5 text-xs font-bold leading-none',
        statusClasses[tone],
      )}
      role="status"
      variant="outline"
    >
      {icon ? <StatusIcon name={icon} /> : <span aria-hidden="true" className="size-1.5 shrink-0 rounded-full bg-current" />}
      <span className="min-w-0">{label}</span>
    </Badge>
  );
}

const connectionConfig: Record<ConnectionState, { icon: StatusIcon; label: string; tone: StatusTone }> = {
  connected: { icon: 'wifi', label: 'Connected', tone: 'success' },
  connecting: { icon: 'loaderCircle', label: 'Connecting', tone: 'neutral' },
  reconnecting: { icon: 'refreshCw', label: 'Reconnecting', tone: 'warning' },
  stale: { icon: 'wifiOff', label: 'Resync needed', tone: 'warning' },
  synchronized: { icon: 'check', label: 'Synchronized', tone: 'success' },
};

export function ParticipantConnectionStatus({
  label,
  state,
}: Readonly<{ label?: ReactNode; state: ConnectionState }>) {
  const config = connectionConfig[state];
  return <ParticipantStatusBadge icon={config.icon} label={label ?? config.label} tone={config.tone} />;
}

export function ParticipantBrand({
  href,
  ...props
}: Readonly<{ 'aria-label'?: string; href: string }>) {
  return (
    <a aria-label={props['aria-label']} className="inline-flex w-fit items-center gap-2.5 rounded-sm font-semibold" href={href}>
      <span aria-hidden="true" className="size-7 shrink-0 rounded-full bg-primary" />
      <span className="text-xl font-bold leading-none tracking-[-0.02em] text-foreground">pulse</span>
    </a>
  );
}

export function ParticipantResultBar({
  ariaLabel,
  count,
  label,
  percentage,
}: Readonly<{ ariaLabel: string; count: number; label: ReactNode; percentage: number }>) {
  const visualPercentage = Math.min(100, Math.max(0, percentage));
  return (
    <div aria-label={ariaLabel} className="flex w-full flex-col gap-2" role="group">
      <div className="flex items-baseline justify-between gap-4 text-sm">
        <span className="min-w-0 break-words font-semibold text-foreground">{label}</span>
        <span className="shrink-0 font-mono text-xs font-semibold text-primary">{percentage}%</span>
      </div>
      <Progress aria-label={ariaLabel} className="gap-0" value={visualPercentage} />
      <span className="text-xs text-muted-foreground">{count} responses</span>
    </div>
  );
}
