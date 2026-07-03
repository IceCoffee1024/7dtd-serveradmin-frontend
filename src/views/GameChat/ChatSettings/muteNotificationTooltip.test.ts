import { describe, expect, it } from 'vitest';
import { createI18n } from 'vue-i18n';
import zhCN from '~/locales/zh-cn.json';
import { getMuteNotificationTooltip } from './muteNotificationTooltip';

function createTranslator() {
  const i18n = createI18n({
    legacy: false,
    locale: 'zh-cn',
    messages: {
      'zh-cn': zhCN,
    },
  });

  return i18n.global.t as (key: string, named?: Record<string, string>) => string;
}

describe('getMuteNotificationTooltip', () => {
  it('keeps mute notification placeholder names visible in tooltip text', () => {
    const t = createTranslator();

    const tooltip = getMuteNotificationTooltip(t, 'muteAppliedPrivateMessage');

    expect(tooltip).toContain('{player}');
    expect(tooltip).toContain('{playerName}');
    expect(tooltip).toContain('{playerId}');
    expect(tooltip).toContain('{reason}');
    expect(tooltip).toContain('{mutedUntil}');
    expect(tooltip).not.toContain('、、、、');
  });
});
