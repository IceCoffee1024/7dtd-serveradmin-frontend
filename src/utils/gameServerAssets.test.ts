import { describe, expect, it } from 'vitest';
import { getMapTileUrl } from './gameServerAssets';

describe('gameServerAssets', () => {
  it('does not include access tokens in map tile URLs', () => {
    const url = getMapTileUrl(3, 4, 5);

    expect(url).toBe('/api/GameServer/MapTile/3/4/5.png');
    expect(url).not.toContain('access_token');
    expect(url).not.toContain('secret-token');
  });
});
