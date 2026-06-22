import { beforeEach, describe, expect, it, vi } from 'vitest';
import { rewardPackagesGetPackages } from '~/generated/api/sdk.gen';
import { loadRewardPackageOptions } from './rewardPackages';

vi.mock('~/generated/api/sdk.gen', () => ({
  rewardPackagesGetPackages: vi.fn(),
}));

describe('reward package queries', () => {
  beforeEach(() => {
    vi.mocked(rewardPackagesGetPackages).mockReset();
  });

  it('loads package options through the generated client', async () => {
    vi.mocked(rewardPackagesGetPackages).mockResolvedValue({
      data: {
        total: 2,
        items: [
          {
            id: 1,
            key: 'starter',
            name: 'Starter Pack',
            isEnabled: true,
          },
          {
            id: 2,
            key: 'disabled',
            name: 'Disabled Pack',
            isEnabled: false,
          },
          {
            key: 'missing-id',
            name: 'Missing Id Pack',
            isEnabled: true,
          },
        ],
      },
    } as Awaited<ReturnType<typeof rewardPackagesGetPackages>>);

    const result = await loadRewardPackageOptions(true);

    expect(rewardPackagesGetPackages).toHaveBeenCalledWith({
      query: {
        pageNumber: 1,
        pageSize: 500,
        isEnabled: undefined,
        order: 'Name',
      },
      throwOnError: true,
    });
    expect(result).toEqual([
      { value: 1, label: 'Starter Pack (starter)', disabled: false },
      { value: 2, label: 'Disabled Pack (disabled)', disabled: true },
    ]);
  });
});
