import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent } from 'vue';
import PlayerLandClaimContainersPanel from './PlayerLandClaimContainersPanel.vue';

const api = vi.hoisted(() => ({
  getLandClaimContainers: vi.fn(),
  getLandClaimContainerInventory: vi.fn(),
}));

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('~/api/landClaimContainers', () => api);

vi.mock('~/utils', () => ({
  formatPosition: (position: { x?: number; y?: number; z?: number } | null | undefined) =>
    position == null ? '' : `${position.x}, ${position.y}, ${position.z}`,
}));

const ElTableStub = defineComponent({
  props: {
    data: {
      type: Array,
      default: () => [],
    },
  },
  emits: ['row-click'],
  template: `
    <div class="table-stub">
      <button
        v-for="row in data"
        :key="row.blockName"
        class="row-stub"
        type="button"
        @click="$emit('row-click', row)"
      >
        {{ row.blockName }}
      </button>
    </div>
  `,
});

function mountPanel(playerId = 'EOS_A') {
  return mount(PlayerLandClaimContainersPanel, {
    props: {
      playerId,
    },
    global: {
      stubs: {
        ElAlert: { template: '<div class="alert-stub" />' },
        ElButton: { emits: ['click'], template: '<button type="button" @click="$emit(\'click\')"><slot /></button>' },
        ElDialog: { props: ['modelValue'], template: '<div v-if="modelValue" class="dialog-stub"><slot /></div>' },
        ElEmpty: { template: '<div class="empty-stub" />' },
        ElTable: ElTableStub,
        ElTableColumn: { template: '<div><slot /></div>' },
        ElTag: { template: '<span><slot /></span>' },
        GameIconEx: { template: '<div class="icon-stub" />' },
      },
      directives: {
        loading: {},
      },
    },
  });
}

describe('player land claim containers panel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.getLandClaimContainerInventory.mockResolvedValue({
      position: { x: 10, y: 64, z: 10 },
      items: [],
    });
  });

  it('clears stale rows and open inventory when player changes', async () => {
    api.getLandClaimContainers.mockImplementation((playerId: string) => {
      if (playerId === 'EOS_A') {
        return Promise.resolve([
          {
            position: { x: 10, y: 64, z: 10 },
            blockName: 'cntStorageA',
            itemCount: 1,
          },
        ]);
      }

      return new Promise(() => {});
    });

    const wrapper = mountPanel('EOS_A');
    await flushPromises();

    expect(wrapper.text()).toContain('cntStorageA');

    await wrapper.get('.row-stub').trigger('click');
    await flushPromises();
    expect(wrapper.find('.dialog-stub').exists()).toBe(true);

    await wrapper.setProps({ playerId: 'EOS_B' });

    expect(wrapper.text()).not.toContain('cntStorageA');
    expect(wrapper.find('.dialog-stub').exists()).toBe(false);
    expect(api.getLandClaimContainers).toHaveBeenLastCalledWith('EOS_B');
  });
});
