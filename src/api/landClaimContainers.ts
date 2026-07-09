import type { InvItemDto, PositionDto } from '~/generated/api/types.gen';
import { client } from '~/generated/api/client.gen';

const security = [{ scheme: 'basic', type: 'http' }, { name: 'Authorization', type: 'apiKey' }] as const;

export interface LandClaimContainerSummaryDto {
  position: PositionDto | null;
  blockName?: string | null;
  localizedName?: string | null;
  ownerId?: string | null;
  ownerName?: string | null;
  landClaimOwnerId?: string | null;
  landClaimOwnerName?: string | null;
  isLocked?: boolean | null;
  hasPassword?: boolean | null;
  isUserAccessing?: boolean | null;
  slotCount?: number | null;
  itemCount?: number | null;
  isPlayerStorage?: boolean | null;
  isLoaded?: boolean | null;
  coverage?: string | null;
}

export interface LandClaimContainerInventoryDto {
  position: PositionDto | null;
  blockName?: string | null;
  localizedName?: string | null;
  ownerId?: string | null;
  ownerName?: string | null;
  landClaimOwnerId?: string | null;
  landClaimOwnerName?: string | null;
  isLocked?: boolean | null;
  hasPassword?: boolean | null;
  isUserAccessing?: boolean | null;
  slotCount?: number | null;
  itemCount?: number | null;
  isPlayerStorage?: boolean | null;
  isLoaded?: boolean | null;
  coverage?: string | null;
  items: InvItemDto[];
}

interface ContainerPosition {
  x: number;
  y: number;
  z: number;
}

function encodePathSegment(value: string | number): string {
  return encodeURIComponent(String(value));
}

export async function getLandClaimContainers(playerId: string): Promise<LandClaimContainerSummaryDto[]> {
  const { data } = await client.get<LandClaimContainerSummaryDto[], unknown, true>({
    security,
    url: `/api/GameServer/LandClaims/${encodePathSegment(playerId)}/Containers`,
    throwOnError: true,
  });

  return data ?? [];
}

export async function getLandClaimContainerInventory(
  playerId: string,
  position: ContainerPosition,
): Promise<LandClaimContainerInventoryDto> {
  const { data } = await client.get<LandClaimContainerInventoryDto, unknown, true>({
    security,
    url: `/api/GameServer/LandClaims/${encodePathSegment(playerId)}/Containers/${encodePathSegment(position.x)}/${encodePathSegment(position.y)}/${encodePathSegment(position.z)}/Inventory`,
    throwOnError: true,
  });

  return data ?? { position, items: [] };
}
