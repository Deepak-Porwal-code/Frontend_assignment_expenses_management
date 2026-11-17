import { CURRENCIES } from './constants';

const currencyFormatterCache = new Map();

function getCurrency(currency = 'USD') {
  return CURRENCIES.find((item) => item.value === currency) || CURRENCIES[0];
}

export function currencySymbol(currency = 'USD') {
  return getCurrency(currency).symbol;
}

export function formatCurrency(value, currency = 'USD', options = {}) {
  const amount = Number(value) || 0;
  const { compact = false, whole = false, signed = false } = options;

  if (compact) {
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      notation: 'compact',
      maximumFractionDigits: 1,
    });
    const text = formatter.format(Math.abs(amount));
    if (!signed) return amount < 0 ? `−${text}` : text;
    return `${amount >= 0 ? '+' : '−'}${text}`;
  }

  const key = `${currency}-${whole ? 'whole' : 'full'}`;
  if (!currencyFormatterCache.has(key)) {
    currencyFormatterCache.set(key, new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: whole ? 0 : 2,
      maximumFractionDigits: whole ? 0 : 2,
    }));
  }

  const text = currencyFormatterCache.get(key).format(Math.abs(amount));
  if (signed) return `${amount >= 0 ? '+' : '−'}${text}`;
  return amount < 0 ? `−${text}` : text;
}

export function formatCompactNumber(value) {
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(Number(value) || 0);
}

export function formatPercent(value, digits = 0) {
  const number = Number(value);
  if (!Number.isFinite(number)) return '0%';
  return `${number.toFixed(digits)}%`;
}

export function formatDate(date, style = 'medium') {
  if (!date) return '—';
  const value = new Date(date);
  if (Number.isNaN(value.getTime())) return '—';

  const optionsByStyle = {
    short: { month: 'short', day: 'numeric' },
    medium: { month: 'short', day: 'numeric', year: 'numeric' },
    long: { month: 'long', day: 'numeric', year: 'numeric' },
    weekday: { weekday: 'short', month: 'short', day: 'numeric' },
    full: { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' },
    month: { month: 'short', year: 'numeric' },
  };

  return new Intl.DateTimeFormat('en-US', {
    ...optionsByStyle[style],
    timeZone: 'UTC',
  }).format(value);
}

export function formatMonthKey(key, style = 'long') {
  if (!key) return '—';
  const [year, month] = key.split('-').map(Number);
  return new Intl.DateTimeFormat('en-US', {
    month: style === 'short' ? 'short' : 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(year, month - 1, 1)));
}

export function monthKeyFromDate(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export function currentMonthKey() {
  return monthKeyFromDate(new Date());
}

export function addMonthsToKey(key, delta) {
  const [year, month] = key.split('-').map(Number);
  const date = new Date(year, month - 1 + delta, 1);
  return monthKeyFromDate(date);
}

export function todayInputValue() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function toDateInputValue(value) {
  if (!value) return '';
  return String(value).slice(0, 10);
}

export function formatRelativeDate(value) {
  if (!value) return '—';
  const dateKey = String(value).slice(0, 10);
  const now = new Date();
  const todayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const yesterdayKey = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

  if (dateKey === todayKey) return 'Today';
  if (dateKey === yesterdayKey) return 'Yesterday';
  return formatDate(value, 'short');
}

export function daysUntil(value) {
  if (!value) return 0;
  const target = new Date(`${String(value).slice(0, 10)}T00:00:00Z`);
  const now = new Date();
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return Math.ceil((target.getTime() - today) / (24 * 60 * 60 * 1000));
}

export function formatBytes(bytes = 0) {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB'];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / (1024 ** index)).toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
}

export function initials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');
}

export function greeting(date = new Date()) {
  const hour = date.getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export function clamp(value, min = 0, max = 100) {
  return Math.min(max, Math.max(min, Number(value) || 0));
}

export function pluralize(count, singular, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`;
}

export function formatDateRange(from, to) {
  if (from && to) return `${formatDate(from, 'short')} – ${formatDate(to, 'short')}`;
  if (from) return `From ${formatDate(from, 'short')}`;
  if (to) return `Until ${formatDate(to, 'short')}`;
  return '';
}
