import type { RewardPackageDto } from '~/api/rewardPackages';
import { getRewardPackages } from '~/api/rewardPackages';

export interface RewardPackageOption {
  label: string;
  value: number;
  disabled?: boolean;
}

export const rewardPackageCacheKey = ['manual', 'RewardPackages'];

export async function loadRewardPackageOptions(includeDisabled = false): Promise<RewardPackageOption[]> {
  const response = await getRewardPackages({
    pageNumber: 1,
    pageSize: 500,
    isEnabled: includeDisabled ? undefined : true,
    order: 'Name',
  });

  return response.items.map(toRewardPackageOption);
}

export function toRewardPackageOption(item: RewardPackageDto): RewardPackageOption {
  return {
    value: item.id,
    label: item.key ? `${item.name} (${item.key})` : item.name,
    disabled: item.isEnabled === false,
  };
}
