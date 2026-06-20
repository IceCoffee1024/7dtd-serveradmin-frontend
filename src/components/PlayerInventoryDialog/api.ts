import type { RemovePlayerInventoryItemRequestDto } from './types';
import { client } from '~/generated/api/client.gen';

export interface RemovePlayerInventoryItemOptions {
  playerId: string;
  body: RemovePlayerInventoryItemRequestDto;
}

export async function removePlayerInventoryItem(options: RemovePlayerInventoryItemOptions): Promise<string[]> {
  const { data } = await client.post<Record<200, string[]>, unknown, true>({
    security: [{ scheme: 'basic', type: 'http' }, { name: 'Authorization', type: 'apiKey' }],
    url: '/api/GameServer/Players/{playerId}/Inventory/RemoveItem',
    path: {
      playerId: options.playerId,
    },
    body: options.body,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  return data;
}
