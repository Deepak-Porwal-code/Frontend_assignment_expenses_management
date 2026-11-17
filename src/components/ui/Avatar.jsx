import { initials } from '../../lib/format';
import { cx } from '../../lib/cx';

const PALETTES = [
  ['#818CF8', '#4338CA'],
  ['#34D399', '#047857'],
  ['#FBBF24', '#B45309'],
  ['#F472B6', '#BE185D'],
  ['#22D3EE', '#0E7490'],
  ['#A78BFA', '#6D28D9'],
];

function paletteFor(name = '') {
  const total = Array.from(name).reduce((sum, character) => sum + character.charCodeAt(0), 0);
  return PALETTES[total % PALETTES.length];
}

export function Avatar({ name = '', size = 'md', className = '' }) {
  const [from, to] = paletteFor(name);

  return (
    <span
      className={cx('avatar', `avatar--${size}`, className)}
      style={{ '--avatar-from': from, '--avatar-to': to }}
      aria-hidden="true"
    >
      {initials(name) || '?'}
    </span>
  );
}
