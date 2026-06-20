import { beforeEach, describe, expect, it, vi } from 'vitest';
import { gameServerRemovePlayerInventoryItem } from '~/generated/api/sdk.gen';
import { removePlayerInventoryItem } from './api';

vi.mock('~/generated/api/sdk.gen', () => ({
  gameServerRemovePlayerInventoryItem: vi.fn(),
}));

describe('player inventory api', () => {
  beforeEach(() => {
    vi.mocked(gameServerRemovePlayerInventoryItem).mockReset();
  });

  it('removes player inventory items through the generated client', async () => {
    vi.mocked(gameServerRemovePlayerInventoryItem).mockResolvedValue({
      data: ['Removed itemA'],
    } as Awaited<ReturnType<typeof gameServerRemovePlayerInventoryItem>>);

    const result = await removePlayerInventoryItem({
      playerId: 'player-1',
      body: {
        itemName: 'itemA',
        mode: 'SelectedSlot',
        container: 'Backpack',
        slotIndex: 3,
      },
    });

    expect(gameServerRemovePlayerInventoryItem).toHaveBeenCalledWith({
      path: { playerId: 'player-1' },
      body: {
        itemName: 'itemA',
        mode: 'SelectedSlot',
        container: 'Backpack',
        slotIndex: 3,
      },
    });
    expect(result).toEqual(['Removed itemA']);
  });
});
