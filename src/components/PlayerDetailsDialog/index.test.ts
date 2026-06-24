import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import PlayerDetailsDialog from './index.vue';

const mocks = vi.hoisted(() => ({
  ensure: vi.fn(),
  fetch: vi.fn(),
  liveQuery: vi.fn(),
  historyQuery: vi.fn(),
}));

vi.mock('@pinia/colada', () => ({
  useQueryCache: () => ({
    ensure: mocks.ensure,
    fetch: mocks.fetch,
  }),
}));

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('~/generated/api/@pinia/colada.gen', () => ({
  gameServerGetHistoryPlayerByIdQuery: mocks.historyQuery,
  gameServerGetPlayerDetailsQuery: mocks.liveQuery,
}));

vi.mock('~/utils', () => ({
  formatMinute: (value: number) => `${value}m`,
  formatPosition: (value: unknown) => JSON.stringify(value ?? null),
}));

function createPlayerDetails() {
  return {
    entityId: 1,
    playerId: 'Steam_111',
    platformId: 'EOS_111',
    playerName: 'Alpha',
    position: { x: 1, y: 2, z: 3 },
    ip: '127.0.0.1',
    ping: 10,
    permissionLevel: 100,
    isAdmin: false,
    isOnline: true,
    isTwitchEnabled: null,
    isTwitchSafe: null,
    zombieKills: 1,
    playerKills: 2,
    deaths: 3,
    level: 4,
    expToNextLevel: 5,
    skillPoints: 6,
    gameStage: 7,
    playGroup: '',
    lastLogin: '2026-06-24T00:00:00Z',
    acl: [],
    landClaimBlocks: [],
    backpacks: [],
    bedroll: null,
    questPositions: [],
    ownedVendingMachinePositions: [],
    lastSpawnPosition: { x: 1, y: 2, z: 3 },
    score: 8,
    stats: { health: 9, stamina: 10, food: 11, water: 12 },
    isLandProtectionActive: false,
    distanceWalked: 13,
    totalItemsCrafted: 14,
    longestLife: 15,
    currentLife: 16,
    totalTimePlayed: 17,
    rentedVMPosition: { x: 0, y: 0, z: 0 },
    rentalEndTime: 0,
    rentalEndDay: 0,
    spawnPoints: [],
    alreadyCraftedList: [],
    unlockedRecipeList: [],
    favoriteRecipeList: [],
    ownedEntities: [],
    playerProfile: null,
  };
}

function mountDialog() {
  return mount(PlayerDetailsDialog, {
    global: {
      config: {
        globalProperties: {
          $t: (key: string) => key,
        } as any,
      },
      stubs: {
        MyDialog: {
          expose: ['open'],
          methods: {
            open: vi.fn(),
          },
          template: '<div><slot /></div>',
        },
        ElTable: { template: '<div><slot /></div>' },
        ElTableColumn: { template: '<div />' },
      },
    },
  });
}

describe('player details dialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('uses live player details query by default', async () => {
    const liveOptions = { key: ['live'] };
    mocks.liveQuery.mockReturnValue(liveOptions);
    mocks.historyQuery.mockReturnValue({ key: ['history'] });
    mocks.ensure.mockReturnValue({ key: ['entry'] });
    mocks.fetch.mockResolvedValue({ status: 'success', data: createPlayerDetails() });
    const wrapper = mountDialog();

    await wrapper.vm.open('Steam_111', 'Alpha');

    expect(mocks.liveQuery).toHaveBeenCalledWith({ path: { playerId: 'Steam_111' } });
    expect(mocks.historyQuery).not.toHaveBeenCalled();
    expect(mocks.ensure).toHaveBeenCalledWith(liveOptions);
  });

  it('uses cached history player details query in history mode', async () => {
    mocks.liveQuery.mockReturnValue({ key: ['live'] });
    const historyOptions = { key: ['history'] };
    mocks.historyQuery.mockReturnValue(historyOptions);
    mocks.ensure.mockReturnValue({ key: ['entry'] });
    mocks.fetch.mockResolvedValue({ status: 'success', data: createPlayerDetails() });
    const wrapper = mountDialog();

    await wrapper.vm.open('Steam_111', 'Alpha', 'history');

    expect(mocks.historyQuery).toHaveBeenCalledWith({ path: { playerId: 'Steam_111' } });
    expect(mocks.liveQuery).not.toHaveBeenCalled();
    expect(mocks.ensure).toHaveBeenCalledWith(historyOptions);
  });
});
