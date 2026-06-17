<script setup lang="ts">
import type { ProfileStatus } from './types';
import type {
  AdminUserDto,
  BanEntryDto,
  ClaimOwnerDto,
  EconomyAccountDetailDto,
  HomeLocationDto,
  MuteEntryDto,
  PlayerDetailsDto,
  PlayerTrackingSummaryDto,
  VehicleLocationDto,
} from '~/generated/api/types.gen';
import { useI18n } from 'vue-i18n';
import { formatPosition } from '~/utils';

defineProps<{
  details: PlayerDetailsDto | null;
  displayName: string;
  economyAccount: EconomyAccountDetailDto | null;
  homes: HomeLocationDto[];
  landClaims: ClaimOwnerDto | null;
  vehicles: VehicleLocationDto[];
  status: ProfileStatus;
  adminEntry: AdminUserDto | null;
  banEntry: BanEntryDto | null;
  muteEntry: MuteEntryDto | null;
  trackingSummary: PlayerTrackingSummaryDto | null;
  formatTime: (value: string | null | undefined) => string;
}>();

const { t } = useI18n();

function formatSessionSeconds(seconds: number | null | undefined): string {
  const value = Math.max(0, seconds ?? 0);
  const hours = Math.floor(value / 3600);
  const minutes = Math.floor((value % 3600) / 60);
  if (hours > 0)
    return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

function formatLocation(summary: PlayerTrackingSummaryDto | null): string {
  const location = summary?.lastLocation;
  if (!location || location.x == null || location.y == null || location.z == null)
    return '--';
  return `${Math.round(location.x)}, ${Math.round(location.y)}, ${Math.round(location.z)}`;
}
</script>

<template>
  <div class="player-profile-grid">
    <section class="profile-panel">
      <h3>{{ t('views.playerProfile.sections.basic') }}</h3>
      <dl>
        <dt>{{ t('views.playerList.playerName') }}</dt>
        <dd>{{ details?.playerName ?? displayName }}</dd>
        <dt>{{ t('views.playerList.entityId') }}</dt>
        <dd>{{ details?.entityId ?? '--' }}</dd>
        <dt>{{ t('views.playerList.permissionLevel') }}</dt>
        <dd>{{ details?.permissionLevel ?? adminEntry?.permissionLevel ?? '--' }}</dd>
        <dt>{{ t('views.playerList.position') }}</dt>
        <dd>{{ formatPosition(details?.position) || '--' }}</dd>
        <dt>{{ t('views.playerList.lastLogin') }}</dt>
        <dd>{{ formatTime(details?.lastLogin) }}</dd>
      </dl>
    </section>

    <section class="profile-panel">
      <h3>{{ t('views.playerProfile.sections.progress') }}</h3>
      <dl>
        <dt>{{ t('views.playerList.level') }}</dt>
        <dd>{{ details?.level ?? '--' }}</dd>
        <dt>{{ t('views.playerList.gameStage') }}</dt>
        <dd>{{ details?.gameStage ?? '--' }}</dd>
        <dt>{{ t('views.playerList.zombieKills') }}</dt>
        <dd>{{ details?.zombieKills ?? '--' }}</dd>
        <dt>{{ t('views.playerList.playerKills') }}</dt>
        <dd>{{ details?.playerKills ?? '--' }}</dd>
        <dt>{{ t('views.playerList.deaths') }}</dt>
        <dd>{{ details?.deaths ?? '--' }}</dd>
      </dl>
    </section>

    <section class="profile-panel">
      <h3>{{ t('views.playerProfile.sections.assets') }}</h3>
      <dl>
        <dt>{{ t('views.playerProfile.fields.balance') }}</dt>
        <dd>{{ economyAccount?.balance ?? '--' }}</dd>
        <dt>{{ t('views.playerProfile.fields.frozen') }}</dt>
        <dd>{{ economyAccount?.isFrozen ? t('common.yes') : t('common.no') }}</dd>
        <dt>{{ t('views.playerProfile.fields.homes') }}</dt>
        <dd>{{ homes.length }}</dd>
        <dt>{{ t('views.playerProfile.fields.landClaims') }}</dt>
        <dd>{{ landClaims?.claimPositions?.length ?? 0 }}</dd>
        <dt>{{ t('views.playerProfile.fields.vehicles') }}</dt>
        <dd>{{ vehicles.length }}</dd>
      </dl>
    </section>

    <section class="profile-panel">
      <h3>{{ t('views.playerProfile.sections.access') }}</h3>
      <dl>
        <dt>{{ t('views.playerProfile.flags.admin') }}</dt>
        <dd>{{ status.isAdmin ? t('common.yes') : t('common.no') }}</dd>
        <dt>{{ t('views.playerProfile.flags.whitelisted') }}</dt>
        <dd>{{ status.isWhitelisted ? t('common.yes') : t('common.no') }}</dd>
        <dt>{{ t('views.playerProfile.flags.banned') }}</dt>
        <dd>{{ banEntry ? formatTime(banEntry.bannedUntil) : t('common.no') }}</dd>
        <dt>{{ t('views.playerProfile.flags.muted') }}</dt>
        <dd>{{ muteEntry ? (muteEntry.mutedUntil ? formatTime(muteEntry.mutedUntil) : t('views.playerProfile.permanent')) : t('common.no') }}</dd>
      </dl>
    </section>

    <section class="profile-panel">
      <h3>{{ t('views.playerProfile.sections.tracking') }}</h3>
      <dl>
        <dt>{{ t('views.playerProfile.tracking.totalSessionTime') }}</dt>
        <dd>{{ formatSessionSeconds(trackingSummary?.totalSessionSeconds) }}</dd>
        <dt>{{ t('views.playerProfile.tracking.sessionCount') }}</dt>
        <dd>{{ trackingSummary?.sessionCount ?? 0 }}</dd>
        <dt>{{ t('views.playerProfile.tracking.lastActivityAt') }}</dt>
        <dd>{{ formatTime(trackingSummary?.lastActivityAt) }}</dd>
        <dt>{{ t('views.playerProfile.tracking.lastLocation') }}</dt>
        <dd>{{ formatLocation(trackingSummary) }}</dd>
        <dt>{{ t('views.playerProfile.tracking.lastInventorySnapshot') }}</dt>
        <dd>{{ formatTime(trackingSummary?.lastInventorySnapshot?.createdAt) }}</dd>
      </dl>
    </section>
  </div>
</template>

<style scoped lang="scss">
.player-profile-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.profile-panel {
  min-width: 0;
  padding: 14px;
  border: 1px solid var(--el-border-color-light);
  border-radius: 8px;
  background: color-mix(in srgb, var(--el-bg-color) 96%, white 4%);
}

.profile-panel h3 {
  margin: 0 0 12px;
  font-size: 15px;
  font-weight: 700;
}

.profile-panel dl {
  display: grid;
  grid-template-columns: minmax(96px, 34%) minmax(0, 1fr);
  gap: 10px 14px;
  margin: 0;
}

.profile-panel dt {
  color: var(--el-text-color-secondary);
}

.profile-panel dd {
  min-width: 0;
  margin: 0;
  overflow-wrap: anywhere;
}

@media (max-width: 960px) {
  .player-profile-grid {
    grid-template-columns: 1fr;
  }
}
</style>
