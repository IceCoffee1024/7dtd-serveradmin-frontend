import { beforeEach, describe, expect, it, vi } from 'vitest';
import { client } from '~/generated/api/client.gen';
import { getAllLandClaimContainers, getLandClaimContainerInventory, getLandClaimContainers } from './landClaimContainers';

vi.mock('~/generated/api/client.gen', () => ({
  client: {
    get: vi.fn(),
  },
}));

describe('land claim containers api', () => {
  beforeEach(() => {
    vi.mocked(client.get).mockReset();
  });

  it('gets container summaries for the selected player', async () => {
    vi.mocked(client.get).mockResolvedValue({
      data: [
        {
          position: { x: 10, y: 64, z: -4 },
          blockName: 'cntStorageGeneric',
          itemCount: 12,
        },
      ],
    } as Awaited<ReturnType<typeof client.get>>);

    const result = await getLandClaimContainers('EOS_123');

    expect(client.get).toHaveBeenCalledWith({
      security: [{ scheme: 'basic', type: 'http' }, { name: 'Authorization', type: 'apiKey' }],
      url: '/api/GameServer/LandClaims/EOS_123/Containers',
      throwOnError: true,
    });
    expect(result).toHaveLength(1);
  });

  it('gets all readable land-claim container summaries for the global page', async () => {
    vi.mocked(client.get).mockResolvedValue({
      data: [
        {
          position: { x: 120, y: 64, z: 88 },
          landClaimOwnerId: 'EOS_123',
          landClaimOwnerName: 'Alice',
          blockName: 'cntStorageGeneric',
          itemCount: 4,
        },
      ],
    } as Awaited<ReturnType<typeof client.get>>);

    const result = await getAllLandClaimContainers();

    expect(client.get).toHaveBeenCalledWith({
      security: [{ scheme: 'basic', type: 'http' }, { name: 'Authorization', type: 'apiKey' }],
      url: '/api/GameServer/LandClaimContainers',
      throwOnError: true,
    });
    expect(result[0]?.landClaimOwnerId).toBe('EOS_123');
  });

  it('encodes player id and coordinates for inventory requests', async () => {
    vi.mocked(client.get).mockResolvedValue({
      data: {
        position: { x: 10, y: 64, z: -4 },
        items: [],
      },
    } as Awaited<ReturnType<typeof client.get>>);

    await getLandClaimContainerInventory('Steam_7656119:abc', { x: 10, y: 64, z: -4 });

    expect(client.get).toHaveBeenCalledWith(expect.objectContaining({
      url: '/api/GameServer/LandClaims/Steam_7656119%3Aabc/Containers/10/64/-4/Inventory',
      throwOnError: true,
    }));
  });
});
