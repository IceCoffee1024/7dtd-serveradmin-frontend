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

  it('forwards stable selectors and accessible names to the visible inventory icon', () => {
    const wrapper = mount(GameIconEx, {
      props: {
        itemName: 'meleeToolTorch',
        iconName: 'meleeToolTorch',
        count: 1,
      },
      attrs: {
        'data-testid': 'inventory-grid-item-Backpack-0',
        'aria-label': '背包 #0 火把',
        'role': 'button',
        'tabindex': '0',
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

    const icon = wrapper.get('.game-icon-ex');

    expect(icon.attributes('data-testid')).toBe('inventory-grid-item-Backpack-0');
    expect(icon.attributes('aria-label')).toBe('背包 #0 火把');
    expect(icon.attributes('role')).toBe('button');
    expect(icon.attributes('tabindex')).toBe('0');
  });
});
