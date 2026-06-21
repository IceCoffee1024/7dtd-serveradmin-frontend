import { describe, expect, it } from 'vitest';
import { sanitizeDisplayText } from './displayText';

describe('sanitizeDisplayText', () => {
  it('removes null bytes and non-printing control characters before rendering backend messages', () => {
    expect(sanitizeDisplayText('网关失败\0\0\u0007  详情')).toBe('网关失败  详情');
  });

  it('keeps normal whitespace that is useful in diagnostic text', () => {
    expect(sanitizeDisplayText('第一行\n\t第二行')).toBe('第一行\n\t第二行');
  });

  it('returns an empty string for missing text', () => {
    expect(sanitizeDisplayText(null)).toBe('');
    expect(sanitizeDisplayText(undefined)).toBe('');
  });
});
