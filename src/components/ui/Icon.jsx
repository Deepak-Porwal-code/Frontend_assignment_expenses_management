import {
  ArrowLeftRight,
  Banknote,
  BookOpen,
  Briefcase,
  Bus,
  Car,
  ChartPie,
  Clapperboard,
  Coffee,
  CreditCard,
  Dumbbell,
  Flag,
  Gamepad2,
  Gauge,
  Gift,
  GraduationCap,
  HeartPulse,
  Home,
  Landmark,
  Laptop,
  LayoutDashboard,
  Music,
  PawPrint,
  PiggyBank,
  Plane,
  Receipt,
  Repeat2,
  Settings2,
  Shapes,
  Shirt,
  ShoppingBag,
  Smartphone,
  Sparkles,
  Tag,
  TrendingUp,
  Utensils,
  Wallet,
} from 'lucide-react';
import { getAccountType } from '../../lib/constants';
import { cx } from '../../lib/cx';

/**
 * One place that maps the icon names stored in MongoDB to lucide components.
 * If a category uses an unknown icon it gracefully falls back to a tag.
 */
const CATEGORY_ICONS = {
  tag: Tag,
  utensils: Utensils,
  coffee: Coffee,
  plane: Plane,
  car: Car,
  bus: Bus,
  'shopping-bag': ShoppingBag,
  shirt: Shirt,
  receipt: Receipt,
  home: Home,
  clapperboard: Clapperboard,
  gamepad: Gamepad2,
  'heart-pulse': HeartPulse,
  dumbbell: Dumbbell,
  'graduation-cap': GraduationCap,
  'book-open': BookOpen,
  repeat: Repeat2,
  wallet: Wallet,
  laptop: Laptop,
  briefcase: Briefcase,
  'trending-up': TrendingUp,
  gift: Gift,
  'paw-print': PawPrint,
  music: Music,
  smartphone: Smartphone,
  sparkles: Sparkles,
  shapes: Shapes,
};

const ACCOUNT_ICONS = {
  'wallet-cash': Banknote,
  bank: Landmark,
  'credit-card': CreditCard,
  wallet: Wallet,
  savings: PiggyBank,
};

export const NAV_ICONS = {
  dashboard: LayoutDashboard,
  transactions: ArrowLeftRight,
  analytics: ChartPie,
  budgets: Gauge,
  goals: Flag,
  recurring: Repeat2,
  accounts: Landmark,
  settings: Settings2,
};

const SIZES = { sm: 15, md: 18, lg: 22 };

export function CategoryIcon({ category, size = 'md', className = '' }) {
  const Icon = CATEGORY_ICONS[category?.icon] || Tag;
  const color = category?.color || '#64748B';

  return (
    <span
      className={cx('icon-tile', `icon-tile--${size}`, className)}
      style={{ '--tile-color': color, '--tile-bg': `${color}1A` }}
      aria-hidden="true"
    >
      <Icon size={SIZES[size] || SIZES.md} strokeWidth={2} />
    </span>
  );
}

export function AccountIcon({ type, size = 'md', className = '' }) {
  const accountType = getAccountType(type);
  const Icon = ACCOUNT_ICONS[accountType.icon] || Landmark;

  return (
    <span
      className={cx('icon-tile', `icon-tile--${size}`, className)}
      style={{ '--tile-color': accountType.color, '--tile-bg': `${accountType.color}1A` }}
      aria-hidden="true"
    >
      <Icon size={SIZES[size] || SIZES.md} strokeWidth={2} />
    </span>
  );
}

export { CATEGORY_ICONS, ACCOUNT_ICONS };
