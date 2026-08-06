import {
  AlertCircle,
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronDown,
  Copy,
  ExternalLink,
  Info,
  Link,
  LoaderCircle,
  LockKeyhole,
  Mail,
  Menu,
  Plus,
  RefreshCw,
  Send,
  Settings,
  Users,
  Wifi,
  WifiOff,
  X,
  type LucideIcon,
  type LucideProps,
} from 'lucide-react';

const iconMap = {
  alertCircle: AlertCircle,
  arrowRight: ArrowRight,
  arrowUpRight: ArrowUpRight,
  check: Check,
  chevronDown: ChevronDown,
  copy: Copy,
  externalLink: ExternalLink,
  info: Info,
  link: Link,
  loaderCircle: LoaderCircle,
  lockKeyhole: LockKeyhole,
  mail: Mail,
  menu: Menu,
  plus: Plus,
  refreshCw: RefreshCw,
  send: Send,
  settings: Settings,
  users: Users,
  wifi: Wifi,
  wifiOff: WifiOff,
  x: X,
} satisfies Record<string, LucideIcon>;

export type IconName = keyof typeof iconMap;

export type IconProps = Omit<
  LucideProps,
  'aria-hidden' | 'aria-label' | 'role'
> & {
  decorative?: boolean;
  label?: string;
  name: IconName;
};

export function Icon({
  label,
  decorative = !label,
  name,
  size = 18,
  strokeWidth = 1.8,
  ...props
}: IconProps) {
  const IconComponent = iconMap[name];

  return (
    <IconComponent
      {...props}
      aria-hidden={decorative ? true : undefined}
      aria-label={decorative ? undefined : label}
      role={decorative ? undefined : 'img'}
      size={size}
      strokeWidth={strokeWidth}
    />
  );
}
