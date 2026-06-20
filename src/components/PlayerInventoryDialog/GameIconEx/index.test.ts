import { mount } from '@vue/test-utils';
import { ElTooltip } from 'element-plus';
import { describe, expect, it, vi } from 'vitest';
import GameIconEx from './index.vue';

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key: string) => key,
  }),
}));

describe('game icon ex', () => {
  it('forwards contextmenu listeners to the visible inventory icon', async () => {
    const onContextmenu = vi.fn();
    const wrapper = mount(GameIconEx, {
      attachTo: document.body,
      props: {
        itemName: 'meleeToolTorch',
        iconName: 'meleeToolTorch',
        count: 1,
        onContextmenu,
      },
      global: {
        components: {
          ElTooltip,
        },
        stubs: {
          GameIcon: { template: '<div class="game-icon-stub" />' },
        },
      },
    });

    await wrapper.get('.game-icon-ex').trigger('contextmenu');

    expect(onContextmenu).toHaveBeenCalledOnce();
  });
});
