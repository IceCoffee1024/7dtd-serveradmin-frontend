import { client } from '~/generated/api/client.gen';

export type PlayerProfileTimelineItemType = 'Chat' | 'Event' | 'Economy' | 'Teleport';

export interface PlayerProfileTimelineItemDto {
  id: string;
  type: PlayerProfileTimelineItemType;
  sourceId?: number | null;
  title: string;
  description: string;
  timestamp: string;
}

export interface PagedDto<T> {
  total: number;
  items: T[];
}

export interface GetPlayerProfileTimelineOptions {
  playerId: string;
  pageNumber?: number;
  pageSize?: number;
  type?: PlayerProfileTimelineItemType | null;
}

export function getPlayerProfileTimeline(options: GetPlayerProfileTimelineOptions) {
  return client.get<{ 200: PagedDto<PlayerProfileTimelineItemDto> }, unknown, true>({
    security: [{ scheme: 'basic', type: 'http' }, { name: 'Authorization', type: 'apiKey' }],
    url: '/api/GameServer/PlayerProfiles/{playerId}/Timeline',
    path: {
      playerId: options.playerId,
    },
    query: {
      pageNumber: options.pageNumber,
      pageSize: options.pageSize,
      type: options.type ?? undefined,
    },
    throwOnError: true,
  });
}
