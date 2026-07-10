import { client } from '~/generated/api/client.gen';

const security = [{ scheme: 'basic', type: 'http' }, { name: 'Authorization', type: 'apiKey' }] as const;

export type ItemAcquisitionSourceKind = 'EntityLootBag' | 'WorldDrop' | 'AdminGrant' | 'SystemGrant';

export interface ItemAcquisitionItemDto {
  id?: number;
  sortOrder?: number;
  itemName?: string | null;
  localizedItemName?: string | null;
  count?: number | null;
  quality?: number | null;
  seed?: number | null;
  useTimes?: number | null;
  mods?: string[] | null;
}

export interface ItemAcquisitionDto {
  id?: number;
  occurredAt?: string | null;
  playerId?: string | null;
  playerName?: string | null;
  sourceKind?: ItemAcquisitionSourceKind | null;
  evidenceLevel?: 'Confirmed' | 'Partial' | null;
  sourceEntityId?: number | null;
  sourceEntityClass?: string | null;
  sourceLootList?: string | null;
  sourceName?: string | null;
  sourceX?: number | null;
  sourceY?: number | null;
  sourceZ?: number | null;
  playerX?: number | null;
  playerY?: number | null;
  playerZ?: number | null;
  operationReference?: string | null;
  items?: ItemAcquisitionItemDto[] | null;
}

export interface ItemAcquisitionQuery {
  pageNumber?: number;
  pageSize?: number;
  startTime?: string;
  endTime?: string;
  itemName?: string;
  sourceKind?: ItemAcquisitionSourceKind;
}

interface PagedResult<T> {
  total?: number | null;
  items?: T[] | null;
}

export async function getPlayerItemAcquisitions(
  playerId: string,
  query: ItemAcquisitionQuery,
): Promise<PagedResult<ItemAcquisitionDto>> {
  const { data } = await client.get<PagedResult<ItemAcquisitionDto>, unknown, true>({
    security,
    url: `/api/PlayerTracking/Players/${encodeURIComponent(playerId)}/ItemAcquisitions`,
    query: { ...query },
    throwOnError: true,
  });

  return data ?? { total: 0, items: [] };
}
