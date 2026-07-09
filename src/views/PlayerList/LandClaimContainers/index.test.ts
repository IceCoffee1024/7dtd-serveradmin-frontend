import type { ComponentPublicInstance } from 'vue';
import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent } from 'vue';
import LandClaimContainers from './index.vue';

const api = vi.hoisted(() => ({
  getAllLandClaimContainers: vi.fn(),
  getLandClaimContainerInventory: vi.fn(),
}));

const profileNavigation = vi.hoisted(() => ({
  viewPlayerProfile: vi.fn(),
}));

const gpsNavigation = vi.hoisted(() => ({
  viewLandClaimContainerOnMap: vi.fn(),
}));

vi.mock('vue-i18n', async (importOriginal) => {
  const actual = await importOriginal<typeof import('vue-i18n')>();
  return {
    ...actual,
    useI18n: () => ({
      t: (key: string) => key,
    }),
  };
});

vi.mock('~/api/landClaimContainers', () => api);

vi.mock('~/composables', async (importOriginal) => {
  const actual = await importOriginal<typeof import('~/composables')>();
  return {
    ...actual,
    usePlayerProfileNavigation: () => profileNavigation,
    useGpsMapNavigation: () => gpsNavigation,
  };
});

vi.mock('~/utils', async (importOriginal) => {
  const actual = await importOriginal<typeof import('~/utils')>();
  return {
    ...actual,
    formatPosition: (position: { x?: number; y?: number; z?: number } | null | undefined) =>
      position == null ? '' : `${position.x}, ${position.y}, ${position.z}`,
  };
});

const MyTableStub = defineComponent({
  name: 'MyTable',
  props: {
    columns: {
      type: Array,
      default: () => [],
    },
    fetchData: {
      type: Function,
      required: true,
    },
    contextMenuItems: {
      type: Array,
      default: () => [],
    },
  },
  template: '<div class="my-table-stub" />',
});

function mountPage() {
  return mount(LandClaimContainers, {
    global: {
      stubs: {
        MyTable: MyTableStub,
        ElAlert: { template: '<div class="alert-stub" />' },
        ElButton: { template: '<button type="button"><slot /></button>' },
        ElDialog: { template: '<div><slot /></div>' },
        ElEmpty: { template: '<div class="empty-stub" />' },
        ElTable: { template: '<div><slot /></div>' },
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

function getMyTableVm(wrapper: ReturnType<typeof mount>) {
  return wrapper.getComponent(MyTableStub).vm as unknown as ComponentPublicInstance<{
    fetchData: (params: any) => Promise<{ list: any[]; total: number }>;
    contextMenuItems: Array<{ label: string; command: (row: any) => unknown }>;
  }>;
}

describe('global land claim containers page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.getLandClaimContainerInventory.mockResolvedValue({
      position: { x: 10, y: 64, z: 10 },
      items: [],
    });
    api.getAllLandClaimContainers.mockResolvedValue([
      {
        position: { x: 120, y: 64, z: 88 },
        blockName: 'cntStorageGeneric',
        localizedName: 'Secure Chest',
        itemCount: 4,
        slotCount: 72,
        ownerId: 'EOS_OWNER_1',
        ownerName: 'ContainerOwner',
        landClaimOwnerId: 'EOS_1',
        landClaimOwnerName: 'Alice',
        isLocked: true,
        hasPassword: false,
        isUserAccessing: false,
        isPlayerStorage: true,
        isLoaded: true,
        coverage: 'loaded',
      },
      {
        position: { x: 220, y: 64, z: 188 },
        blockName: 'cntStorageWorkingStiffs',
        localizedName: 'Working Stiffs Crate',
        itemCount: 2,
        slotCount: 24,
        ownerId: 'EOS_OWNER_2',
        ownerName: 'SecondOwner',
        landClaimOwnerId: 'EOS_2',
        landClaimOwnerName: 'Bob',
        isLocked: false,
        hasPassword: false,
        isUserAccessing: false,
        isPlayerStorage: true,
        isLoaded: true,
        coverage: 'loaded',
      },
    ]);
  });

  it('filters and paginates the fetched container summaries locally', async () => {
    const wrapper = mountPage();
    const table = getMyTableVm(wrapper);

    const result = await table.fetchData({
      pageNumber: 1,
      pageSize: 1,
      search: { keyword: 'alice' },
      sortField: 'itemCount',
      sortOrder: 'descending',
    });

    expect(api.getAllLandClaimContainers).toHaveBeenCalledTimes(1);
    expect(result.total).toBe(1);
    expect(result.list).toHaveLength(1);
    expect(result.list[0].landClaimOwnerName).toBe('Alice');
  });

  it('routes profile and gps actions from the context menu', async () => {
    const wrapper = mountPage();
    const table = getMyTableVm(wrapper);
    const items = table.contextMenuItems;
    const row = {
      position: { x: 120, y: 64, z: 88 },
      landClaimOwnerId: 'EOS_1',
      landClaimOwnerName: 'Alice',
      ownerId: 'EOS_OWNER_1',
      ownerName: 'ContainerOwner',
    };

    await items.find(item => item.label === 'views.playerList.viewProfile')?.command(row);
    await items.find(item => item.label === 'views.playerProfile.tracking.viewRegionOnMap')?.command(row);

    expect(profileNavigation.viewPlayerProfile).toHaveBeenCalledWith({
      playerId: 'EOS_1',
      playerName: 'Alice',
    });
    expect(gpsNavigation.viewLandClaimContainerOnMap).toHaveBeenCalledWith(row.position, 48);
  });
});
