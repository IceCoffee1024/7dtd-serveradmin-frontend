import type { ComposerTranslation } from 'vue-i18n';
import { describe, expect, it } from 'vitest';
import { getChatTypeLabel } from './chatType';

const t = ((key: string) => key) as ComposerTranslation;

describe('getChatTypeLabel', () => {
  it('shows custom chat type values instead of collapsing them to unknown', () => {
    expect(getChatTypeLabel('AdminChannel', t)).toBe('AdminChannel');
  });
});
