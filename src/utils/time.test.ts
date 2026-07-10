import { describe, expect, it } from 'vitest';
import dayjs from '~/plugins/dayjs';
import { formatUtcTimestamp, normalizeUtcTimestamp } from './time';

describe('normalizeUtcTimestamp', () => {
  it('treats server timestamps without an offset as UTC', () => {
    expect(normalizeUtcTimestamp('2026-07-05T14:39:53')).toBe('2026-07-05T14:39:53Z');
    expect(normalizeUtcTimestamp('2026-07-05 14:39:53')).toBe('2026-07-05T14:39:53Z');
  });

  it('preserves timestamps that already include an explicit offset', () => {
    expect(normalizeUtcTimestamp('2026-07-05T14:39:53Z')).toBe('2026-07-05T14:39:53Z');
    expect(normalizeUtcTimestamp('2026-07-05T14:39:53+08:00')).toBe('2026-07-05T14:39:53+08:00');
  });
});

describe('formatUtcTimestamp', () => {
  it('formats a UTC timestamp with a caller supplied template', () => {
    expect(formatUtcTimestamp('2026-07-05T14:39:53Z', '--', 'MM-DD HH:mm'))
      .toBe(dayjs('2026-07-05T14:39:53Z').format('MM-DD HH:mm'));
  });

  it('returns the fallback for empty timestamps', () => {
    expect(formatUtcTimestamp(null)).toBe('--');
    expect(formatUtcTimestamp(undefined, '')).toBe('');
    expect(formatUtcTimestamp('   ')).toBe('--');
  });
});
