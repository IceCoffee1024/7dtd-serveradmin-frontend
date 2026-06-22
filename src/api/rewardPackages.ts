import { client } from '~/generated/api/client.gen';

export type RewardPackageEntryType = 'GameItem' | 'EconomyCurrency' | 'ConsoleCommand';
export type RewardPackageQueryOrder = 'CreatedAt' | 'UpdatedAt' | 'Key' | 'Name' | 'IsEnabled';

export interface RewardPackageDto {
  id: number;
  key: string;
  name: string;
  description?: string | null;
  isEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RewardPackageEntryDto {
  id: number;
  packageId: number;
  entryType: RewardPackageEntryType;
  payloadJson: string;
  sortOrder: number;
  isEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RewardPackageDetailDto {
  package: RewardPackageDto;
  entries: RewardPackageEntryDto[];
}

export interface RewardPackageUpsertDto {
  key: string;
  name: string;
  description?: string | null;
  isEnabled: boolean;
}

export interface RewardPackageEntryUpsertDto {
  entryType: RewardPackageEntryType;
  payloadJson: string;
  sortOrder: number;
  isEnabled: boolean;
}

export interface RewardPackageQueryDto {
  pageNumber?: number;
  pageSize?: number;
  keyword?: string;
  isEnabled?: boolean;
  order?: RewardPackageQueryOrder;
  desc?: boolean;
}

export interface PagedRewardPackageDto {
  total: number;
  items: RewardPackageDto[];
}

const security = [{ scheme: 'basic', type: 'http' }, { name: 'Authorization', type: 'apiKey' }] as const;

export async function getRewardPackages(query?: RewardPackageQueryDto) {
  const response = await client.get<PagedRewardPackageDto>({
    security,
    url: '/api/RewardPackages',
    query: query as Record<string, unknown> | undefined,
  });
  return response.data ?? { total: 0, items: [] };
}

export async function getRewardPackage(id: number) {
  const response = await client.get<RewardPackageDetailDto>({
    security,
    url: '/api/RewardPackages/{id}',
    path: { id },
  });
  if (response.data == null)
    throw new Error(`Reward package #${id} returned an empty response.`);
  return response.data;
}

export async function createRewardPackage(body: RewardPackageUpsertDto) {
  const response = await client.post<RewardPackageDto>({
    security,
    url: '/api/RewardPackages',
    body,
  });
  if (response.data == null)
    throw new Error('Reward package create returned an empty response.');
  return response.data;
}

export async function updateRewardPackage(id: number, body: RewardPackageUpsertDto) {
  await client.put({
    security,
    url: '/api/RewardPackages/{id}',
    path: { id },
    body,
  });
}

export async function deleteRewardPackage(id: number) {
  await client.delete({
    security,
    url: '/api/RewardPackages/{id}',
    path: { id },
  });
}

export async function createRewardPackageEntry(packageId: number, body: RewardPackageEntryUpsertDto) {
  const response = await client.post<RewardPackageEntryDto>({
    security,
    url: '/api/RewardPackages/{packageId}/Entries',
    path: { packageId },
    body,
  });
  if (response.data == null)
    throw new Error('Reward package entry create returned an empty response.');
  return response.data;
}

export async function updateRewardPackageEntry(entryId: number, body: RewardPackageEntryUpsertDto) {
  await client.put({
    security,
    url: '/api/RewardPackages/Entries/{entryId}',
    path: { entryId },
    body,
  });
}

export async function deleteRewardPackageEntry(entryId: number) {
  await client.delete({
    security,
    url: '/api/RewardPackages/Entries/{entryId}',
    path: { entryId },
  });
}
