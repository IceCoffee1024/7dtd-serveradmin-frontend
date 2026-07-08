import dayjs from '~/plugins/dayjs';

const EXPLICIT_OFFSET_PATTERN = /(?:Z|[+-]\d{2}:?\d{2})$/i;

export function normalizeUtcTimestamp(value: string | null | undefined): string | null {
  const text = value?.trim();
  if (!text) {
    return null;
  }

  if (EXPLICIT_OFFSET_PATTERN.test(text)) {
    return text;
  }

  return `${text.replace(/^(\d{4}-\d{2}-\d{2})\s+/, '$1T')}Z`;
}

export function formatUtcTimestamp(value: string | null | undefined, fallback = '--'): string {
  const normalized = normalizeUtcTimestamp(value);
  return normalized ? dayjs(normalized).format('YYYY-MM-DD HH:mm:ss') : fallback;
}
