import { beforeEach, describe, expect, it, vi } from 'vitest';
import { client } from '~/generated/api/client.gen';
import { getPlayerItemAcquisitions } from './itemAcquisitions';

vi.mock('~/generated/api/client.gen', () => ({
  client: { get: vi.fn() },
}));

describe('getPlayerItemAcquisitions', () => {
  beforeEach(() => {
    vi.mocked(client.get).mockReset();
  });

  it('requests the player acquisition endpoint with source and item filters', async () => {
    vi.mocked(client.get).mockResolvedValue({
      data: { total: 1, items: [] },
    } as Awaited<ReturnType<typeof client.get>>);

    await getPlayerItemAcquisitions('EOS_123', {
      pageNumber: 1,
      pageSize: 20,
      sourceKind: 'EntityLootBag',
      itemName: 'ammo762mmBullet',
    });

    expect(client.get).toHaveBeenCalledWith({
      security: [{ scheme: 'basic', type: 'http' }, { name: 'Authorization', type: 'apiKey' }],
      url: '/api/PlayerTracking/Players/EOS_123/ItemAcquisitions',
      query: {
        pageNumber: 1,
        pageSize: 20,
        sourceKind: 'EntityLootBag',
        itemName: 'ammo762mmBullet',
      },
      throwOnError: true,
    });
  });
});
