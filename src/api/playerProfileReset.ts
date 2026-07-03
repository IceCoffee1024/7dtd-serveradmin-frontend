import { client } from '~/generated/api/client.gen';

export interface PlayerProfileResetRequestDto {
  forceKickIfOnline: boolean;
  kickReason?: string | null;
  offlineWaitTimeoutSeconds?: number | null;
}

export interface PlayerProfileResetResultDto {
  succeeded: boolean;
  failureKind?: string | null;
  errorMessage?: string | null;
  playerId: string;
  wasOnline: boolean;
  archiveDirectory?: string | null;
  archivedPaths: string[];
  removedPaths: string[];
  pluginDataCleared: boolean;
}

export async function resetPlayerProfile(playerId: string, body: PlayerProfileResetRequestDto) {
  const { data } = await client.post<PlayerProfileResetResultDto, unknown, true>({
    security: [{ scheme: 'basic', type: 'http' }, { name: 'Authorization', type: 'apiKey' }],
    url: `/api/GameServer/Players/${encodeURIComponent(playerId)}/Profile/Reset`,
    body,
    headers: {
      'Content-Type': 'application/json',
    },
    throwOnError: true,
  });

  return data;
}
