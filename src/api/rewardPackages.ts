import type {
  PagedDtoOfRewardPackageDto as PagedRewardPackageDto,
  RewardPackageDetailDto,
  RewardPackageDto,
  RewardPackageEntryDto,
  RewardPackageEntryUpsertDto,
  RewardPackageQueryOrder,
  RewardPackageUpsertDto,
} from '~/generated/api/types.gen';
import {
  rewardPackagesCreateEntry,
  rewardPackagesCreatePackage,
  rewardPackagesDeleteEntry,
  rewardPackagesDeletePackage,
  rewardPackagesGetPackage,
  rewardPackagesGetPackages,
  rewardPackagesUpdateEntry,
  rewardPackagesUpdatePackage,
} from '~/generated/api/sdk.gen';

export type {
  PagedRewardPackageDto,
  RewardPackageDetailDto,
  RewardPackageDto,
  RewardPackageEntryDto,
  RewardPackageEntryUpsertDto,
  RewardPackageQueryOrder,
  RewardPackageUpsertDto,
};

export interface RewardPackageQueryDto {
  pageNumber?: number;
  pageSize?: number;
  keyword?: string | null;
  isEnabled?: boolean | null;
  order?: RewardPackageQueryOrder | null;
  desc?: boolean;
}

export async function getRewardPackages(query?: RewardPackageQueryDto) {
  const response = await rewardPackagesGetPackages({
    query,
    throwOnError: true,
  });
  return response.data ?? { total: 0, items: [] };
}

export async function getRewardPackage(id: number) {
  const response = await rewardPackagesGetPackage({
    path: { id },
    throwOnError: true,
  });
  if (response.data == null)
    throw new Error(`Reward package #${id} returned an empty response.`);
  return response.data;
}

export async function createRewardPackage(body: RewardPackageUpsertDto) {
  const response = await rewardPackagesCreatePackage({
    body,
    throwOnError: true,
  });
  if (response.data == null)
    throw new Error('Reward package create returned an empty response.');
  return response.data;
}

export async function updateRewardPackage(id: number, body: RewardPackageUpsertDto) {
  await rewardPackagesUpdatePackage({
    path: { id },
    body,
    throwOnError: true,
  });
}

export async function deleteRewardPackage(id: number) {
  await rewardPackagesDeletePackage({
    path: { id },
    throwOnError: true,
  });
}

export async function createRewardPackageEntry(packageId: number, body: RewardPackageEntryUpsertDto) {
  const response = await rewardPackagesCreateEntry({
    path: { packageId },
    body,
    throwOnError: true,
  });
  if (response.data == null)
    throw new Error('Reward package entry create returned an empty response.');
  return response.data;
}

export async function updateRewardPackageEntry(entryId: number, body: RewardPackageEntryUpsertDto) {
  await rewardPackagesUpdateEntry({
    path: { entryId },
    body,
    throwOnError: true,
  });
}

export async function deleteRewardPackageEntry(entryId: number) {
  await rewardPackagesDeleteEntry({
    path: { entryId },
    throwOnError: true,
  });
}
