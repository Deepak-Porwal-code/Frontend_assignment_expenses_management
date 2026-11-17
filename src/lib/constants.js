export const APP_NAME = 'Moneta';

export const CURRENCIES = [
  { value: 'USD', label: 'US Dollar', symbol: '$' },
  { value: 'EUR', label: 'Euro', symbol: '€' },
  { value: 'GBP', label: 'British Pound', symbol: '£' },
  { value: 'INR', label: 'Indian Rupee', symbol: '₹' },
  { value: 'CAD', label: 'Canadian Dollar', symbol: 'CA$' },
  { value: 'AUD', label: 'Australian Dollar', symbol: 'A$' },
  { value: 'JPY', label: 'Japanese Yen', symbol: '¥' },
];

export const ACCOUNT_TYPES = [
  {
    value: 'cash',
    label: 'Cash',
    icon: 'wallet-cash',
    description: 'Physical cash you keep close',
    color: '#10B981',
  },
  {
    value: 'bank',
    label: 'Bank Account',
    icon: 'bank',
    description: 'Checking or current account',
    color: '#0A84FF',
  },
  {
    value: 'credit',
    label: 'Credit Card',
    icon: 'credit-card',
    description: 'A card balance you track',
    color: '#8B5CF6',
  },
  {
    value: 'wallet',
    label: 'Wallet',
    icon: 'wallet',
    description: 'UPI, PayPal or digital wallets',
    color: '#F59E0B',
  },
  {
    value: 'savings',
    label: 'Savings',
    icon: 'savings',
    description: 'Money set aside for later',
    color: '#14B8A6',
  },
];

export const getAccountType = (value) => (
  ACCOUNT_TYPES.find((type) => type.value === value) || ACCOUNT_TYPES[1]
);

export const TRANSACTION_TYPES = [
  { value: 'expense', label: 'Expense' },
  { value: 'income', label: 'Income' },
];

export const FREQUENCIES = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
];

export const RANGE_OPTIONS = [
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
  { value: '3months', label: '3 Months' },
  { value: 'year', label: 'Year' },
];

export const FREQUENCY_LABELS = {
  daily: 'Daily',
  weekly: 'Weekly',
  monthly: 'Monthly',
  yearly: 'Yearly',
};

export const RANGE_LABELS = {
  week: 'This week',
  month: 'This month',
  '3months': 'Last 3 months',
  year: 'Last 12 months',
};

export const CATEGORY_ICON_OPTIONS = [
  { value: 'tag', label: 'Tag' },
  { value: 'utensils', label: 'Food' },
  { value: 'coffee', label: 'Coffee' },
  { value: 'plane', label: 'Travel' },
  { value: 'car', label: 'Car' },
  { value: 'bus', label: 'Transit' },
  { value: 'shopping-bag', label: 'Shopping' },
  { value: 'shirt', label: 'Clothing' },
  { value: 'receipt', label: 'Bills' },
  { value: 'home', label: 'Home' },
  { value: 'clapperboard', label: 'Movies' },
  { value: 'gamepad', label: 'Games' },
  { value: 'heart-pulse', label: 'Health' },
  { value: 'dumbbell', label: 'Fitness' },
  { value: 'graduation-cap', label: 'Education' },
  { value: 'book-open', label: 'Books' },
  { value: 'repeat', label: 'Subscription' },
  { value: 'wallet', label: 'Wallet' },
  { value: 'laptop', label: 'Freelance' },
  { value: 'briefcase', label: 'Business' },
  { value: 'trending-up', label: 'Investment' },
  { value: 'gift', label: 'Gift' },
  { value: 'paw-print', label: 'Pets' },
  { value: 'music', label: 'Music' },
  { value: 'smartphone', label: 'Phone' },
  { value: 'sparkles', label: 'Personal' },
  { value: 'shapes', label: 'Other' },
];

export const COLOR_OPTIONS = [
  '#6366F1',
  '#0A84FF',
  '#8B5CF6',
  '#EC4899',
  '#F43F5E',
  '#F97316',
  '#F59E0B',
  '#10B981',
  '#14B8A6',
  '#64748B',
];

export const CHART_COLORS = [
  '#6366F1',
  '#22C55E',
  '#F59E0B',
  '#EC4899',
  '#06B6D4',
  '#8B5CF6',
  '#F97316',
  '#14B8A6',
  '#84CC16',
  '#EF4444',
  '#64748B',
];

export const BUDGET_STATUS_TONE = {
  on_track: 'success',
  watch: 'info',
  warning: 'warning',
  critical: 'danger',
  exceeded: 'danger',
};

export const BUDGET_STATUS_LABEL = {
  on_track: 'On track',
  watch: 'Watch',
  warning: 'Warning',
  critical: 'Near limit',
  exceeded: 'Exceeded',
};

export const ATTACHMENT_LIMIT_BYTES = 2 * 1024 * 1024;
export const ATTACHMENT_ACCEPT = 'image/jpeg,image/png,image/webp,image/gif,application/pdf';

export const NAV_GROUPS = [
  {
    label: 'Overview',
    items: [
      { to: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
      { to: '/transactions', label: 'Transactions', icon: 'transactions' },
      { to: '/analytics', label: 'Analytics', icon: 'analytics' },
    ],
  },
  {
    label: 'Plan',
    items: [
      { to: '/budgets', label: 'Budgets', icon: 'budgets' },
      { to: '/goals', label: 'Savings goals', icon: 'goals' },
      { to: '/recurring', label: 'Recurring', icon: 'recurring' },
    ],
  },
  {
    label: 'Manage',
    items: [
      { to: '/accounts', label: 'Accounts', icon: 'accounts' },
      { to: '/settings', label: 'Settings', icon: 'settings' },
    ],
  },
];

export const PAGE_TITLES = {
  '/dashboard': 'Dashboard',
  '/transactions': 'Transactions',
  '/analytics': 'Analytics',
  '/budgets': 'Budgets',
  '/goals': 'Savings goals',
  '/recurring': 'Recurring',
  '/accounts': 'Accounts',
  '/settings': 'Settings',
};
