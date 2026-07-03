import { beforeEach, describe, expect, it, vi } from 'vitest';
import { client } from '~/generated/api/client.gen';
import { resetPlayerProfile } from './playerProfileReset';

vi.mock('~/generated/api/client.gen', () => ({
  client: {
    post: vi.fn(),
  },
}));

describe('player profile reset api', () => {
  beforeEach(() => {
    vi.mocked(client.post).mockReset();
  });

  it('posts reset requests to the dedicated player profile endpoint', async () => {
    vi.mocked(client.post).mockResolvedValue({
      data: {
        succeeded: true,
        playerId: 'EOS_123',
        wasOnline: false,
        archivedPaths: [],
        removedPaths: [],
        pluginDataCleared: false,
      },
    } as Awaited<ReturnType<typeof client.post>>);

    const result = await resetPlayerProfile('EOS_123', {
      forceKickIfOnline: false,
    });

    expect(client.post).toHaveBeenCalledWith({
      security: [{ scheme: 'basic', type: 'http' }, { name: 'Authorization', type: 'apiKey' }],
      url: '/api/GameServer/Players/EOS_123/Profile/Reset',
      body: {
        forceKickIfOnline: false,
      },
      headers: {
        'Content-Type': 'application/json',
      },
      throwOnError: true,
    });
    expect(result.succeeded).toBe(true);
  });

  it('encodes player ids in the reset route', async () => {
    vi.mocked(client.post).mockResolvedValue({
      data: {
        succeeded: true,
        playerId: 'Steam_7656119:abc',
        wasOnline: false,
        archivedPaths: [],
        removedPaths: [],
        pluginDataCleared: false,
      },
    } as Awaited<ReturnType<typeof client.post>>);

    await resetPlayerProfile('Steam_7656119:abc', {
      forceKickIfOnline: true,
      kickReason: 'Resetting player profile',
    });

    expect(client.post).toHaveBeenCalledWith(expect.objectContaining({
      url: '/api/GameServer/Players/Steam_7656119%3Aabc/Profile/Reset',
      body: {
        forceKickIfOnline: true,
        kickReason: 'Resetting player profile',
      },
    }));
  });
});
