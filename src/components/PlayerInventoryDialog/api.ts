import type { RemovePlayerInventoryItemRequestDto } from '~/generated/api/types.gen';
import { gameServerRemovePlayerInventoryItem } from '~/generated/api/sdk.gen';

export interface RemovePlayerInventoryItemOptions {
  playerId: string;
  body: RemovePlayerInventoryItemRequestDto;
}

export async function removePlayerInventoryItem(options: RemovePlayerInventoryItemOptions): Promise<string[]> {
  const { data } = await gameServerRemovePlayerInventoryItem({
    path: {
      playerId: options.playerId,
    },
    body: options.body,
  });

  return data;
}
