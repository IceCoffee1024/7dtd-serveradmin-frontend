import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import Grid from './index.vue';

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('~/utils', () => ({
  markIcon: () => 'span',
}));

vi.mock('~/plugins/contextMenu', () => ({
  showCustomContextMenu: vi.fn(),
}));

describe('player inventory grid', () => {
  it('adds stable selectors and accessible names to item cells', () => {
    const wrapper = mount(Grid, {
      props: {
        bag: [
          {
            container: 'Backpack',
            slotIndex: 0,
            item: {
              itemName: 'meleeToolTorch',
              localizationName: 'Torch',
              iconName: 'meleeToolTorch',
              iconColor: null,
              count: 1,
              maxStackAllowed: 1,
              quality: null,
              qualityColor: null,
              useTimes: 0,
              maxUseTimes: 0,
              isMod: false,
              isBlock: false,
              parts: null,
            },
          },
        ],
      },
      global: {
        config: {
          globalProperties: {
            $t: (key: string) => key,
          } as any,
        },
        stubs: {
          ElTag: { template: '<div><slot /></div>' },
          GameIconEx: { template: '<div class="game-icon-ex-stub" v-bind="$attrs" />' },
        },
      },
    });

    const item = wrapper.get('[data-testid="inventory-grid-item-Backpack-0"]');

    expect(item.attributes('aria-label')).toContain('components.playerInventoryDialog.containers.Backpack #0 Torch');
    expect(item.attributes('role')).toBe('button');
    expect(item.attributes('tabindex')).toBe('0');
  });
});
