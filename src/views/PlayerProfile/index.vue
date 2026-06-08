<script setup lang="ts">
import type { ProfileStatus } from './types';
import type {
  AdminUserDto,
  BanEntryDto,
  ChatMessageDto,
  ClaimOwnerDto,
  EconomyAccountDetailDto,
  EconomyTransactionDto,
  GameEventLogDto,
  HomeLocationDto,
  Language,
  MuteEntryDto,
  PlayerDetailsDto,
  TeleportLogDto,
  VehicleLocationDto,
  WhitelistEntryDto,
} from '~/generated/api/types.gen';
import dayjs from 'dayjs';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import { gameServerGetPlayerProfileOverview } from '~/generated/api/sdk.gen';
import { useLocaleStore } from '~/stores/locale';
import PlayerProfileActions from './PlayerProfileActions.vue';
import PlayerProfileActivityPanel from './PlayerProfileActivityPanel.vue';
import PlayerProfileAssetsPanel from './PlayerProfileAssetsPanel.vue';
import PlayerProfileEconomyPanel from './PlayerProfileEconomyPanel.vue';
import PlayerProfileOverviewPanel from './PlayerProfileOverviewPanel.vue';
import PlayerProfileTeleportPanel from './PlayerProfileTeleportPanel.vue';

defineOptions({ name: 'PlayerProfilePage' });

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const localeStore = useLocaleStore();

const loading = ref(false);
const loadedAt = ref<Date | null>(null);
const details = ref<PlayerDetailsDto | null>(null);
const economyAccount = ref<EconomyAccountDetailDto | null>(null);
const homes = ref<HomeLocationDto[]>([]);
const landClaims = ref<ClaimOwnerDto | null>(null);
const vehicles = ref<VehicleLocationDto[]>([]);
const chatMessages = ref<ChatMessageDto[]>([]);
const gameEvents = ref<GameEventLogDto[]>([]);
const economyTransactions = ref<EconomyTransactionDto[]>([]);
const teleportLogs = ref<TeleportLogDto[]>([]);
const adminEntry = ref<AdminUserDto | null>(null);
const banEntry = ref<BanEntryDto | null>(null);
const muteEntry = ref<MuteEntryDto | null>(null);
const whitelistEntry = ref<WhitelistEntryDto | null>(null);

const playerId = computed(() => {
  const value = route.params.playerId;
  return Array.isArray(value) ? value[0] : String(value ?? '');
});

const displayName = computed(() =>
  details.value?.playerName
  || economyAccount.value?.playerName
  || adminEntry.value?.displayName
  || banEntry.value?.displayName
  || muteEntry.value?.playerName
  || whitelistEntry.value?.displayName
  || String(route.query.playerName ?? '')
  || playerId.value,
);

const status = computed<ProfileStatus>(() => ({
  isAdmin: adminEntry.value != null || details.value?.isAdmin === true,
  isBanned: banEntry.value != null,
  isMuted: muteEntry.value != null,
  isWhitelisted: whitelistEntry.value != null,
}));

const isOnline = computed(() => details.value != null && details.value.isOffline === false);

const summaryCards = computed(() => [
  {
    label: t('views.playerProfile.summary.status'),
    value: isOnline.value ? t('common.online') : t('common.offline'),
    type: isOnline.value ? 'success' : 'info',
  },
  {
    label: t('views.playerProfile.summary.balance'),
    value: economyAccount.value == null ? '--' : String(economyAccount.value.balance ?? 0),
    type: economyAccount.value?.isFrozen ? 'warning' : 'success',
  },
  {
    label: t('views.playerProfile.summary.landClaims'),
    value: String(landClaims.value?.claimPositions?.length ?? 0),
    type: 'primary',
  },
  {
    label: t('views.playerProfile.summary.vehicles'),
    value: String(vehicles.value.length),
    type: 'primary',
  },
]);

function formatTime(value: string | null | undefined): string {
  return value ? dayjs(value).format('YYYY-MM-DD HH:mm:ss') : '--';
}

async function loadProfile() {
  if (!playerId.value)
    return;

  loading.value = true;
  try {
    const { data } = await gameServerGetPlayerProfileOverview({
      path: {
        playerId: playerId.value,
      },
      query: {
        language: localeStore.languageEnglishName as Language,
        activityLimit: 8,
      },
      throwOnError: true,
    });

    details.value = data?.details ?? null;
    economyAccount.value = data?.economyAccount ?? null;
    homes.value = data?.homes ?? [];
    landClaims.value = data?.landClaims ?? null;
    vehicles.value = data?.vehicles ?? [];
    chatMessages.value = data?.chatMessages ?? [];
    gameEvents.value = data?.gameEvents ?? [];
    economyTransactions.value = data?.economyTransactions ?? [];
    teleportLogs.value = data?.teleportLogs ?? [];
    adminEntry.value = data?.adminEntry ?? null;
    banEntry.value = data?.banEntry ?? null;
    muteEntry.value = data?.muteEntry ?? null;
    whitelistEntry.value = data?.whitelistEntry ?? null;
    loadedAt.value = new Date();
  }
  catch (error) {
    console.error(error);
  }
  finally {
    loading.value = false;
  }
}

function goBack() {
  if (window.history.length > 1)
    router.back();
  else
    void router.push({ name: 'PlayerList', params: { locale: route.params.locale } });
}

function goToPlayerFilteredPage(name: string) {
  void router.push({
    name,
    params: { locale: route.params.locale },
    query: {
      playerId: playerId.value,
      playerName: displayName.value,
    },
  });
}

onMounted(loadProfile);
watch(playerId, loadProfile);
</script>

<template>
  <el-card v-loading="loading" class="player-profile-page" shadow="never">
    <div class="player-profile-page__body">
      <header class="player-profile-header">
        <div class="player-profile-header__main">
          <el-button circle plain @click="goBack">
            <icon-mdi:arrow-left />
          </el-button>
          <div class="min-w-0">
            <h2 class="player-profile-header__title">
              {{ displayName }}
            </h2>
            <p class="player-profile-header__id">
              {{ playerId }}
            </p>
          </div>
        </div>
        <div class="player-profile-header__actions">
          <el-tag :type="isOnline ? 'success' : 'info'" effect="plain">
            {{ isOnline ? t('common.online') : t('common.offline') }}
          </el-tag>
          <el-tag v-if="status.isAdmin" type="warning" effect="plain">
            {{ t('views.playerList.admin') }}
          </el-tag>
          <el-tag v-if="status.isBanned" type="danger" effect="plain">
            {{ t('views.playerProfile.flags.banned') }}
          </el-tag>
          <el-tag v-if="status.isMuted" type="danger" effect="plain">
            {{ t('views.playerProfile.flags.muted') }}
          </el-tag>
          <el-button :loading="loading" @click="loadProfile">
            <icon-mdi:refresh class="mr-1" />
            {{ t('components.myTable.refresh') }}
          </el-button>
        </div>
      </header>

      <section class="player-profile-summary">
        <div
          v-for="item in summaryCards"
          :key="item.label"
          class="player-profile-summary__item"
        >
          <span>{{ item.label }}</span>
          <strong>{{ item.value }}</strong>
        </div>
      </section>

      <PlayerProfileActions
        :player-id="playerId"
        :display-name="displayName"
        :is-online="isOnline"
        :status="status"
        @refreshed="loadProfile"
      />

      <el-tabs class="player-profile-tabs">
        <el-tab-pane :label="t('views.playerProfile.tabs.overview')">
          <PlayerProfileOverviewPanel
            :details="details"
            :display-name="displayName"
            :economy-account="economyAccount"
            :homes="homes"
            :land-claims="landClaims"
            :vehicles="vehicles"
            :status="status"
            :admin-entry="adminEntry"
            :ban-entry="banEntry"
            :mute-entry="muteEntry"
            :format-time="formatTime"
          />
        </el-tab-pane>

        <el-tab-pane :label="t('views.playerProfile.tabs.assets')">
          <PlayerProfileAssetsPanel
            :homes="homes"
            :vehicles="vehicles"
            :format-time="formatTime"
            @view-page="goToPlayerFilteredPage"
          />
        </el-tab-pane>

        <el-tab-pane :label="t('views.playerProfile.tabs.activity')">
          <PlayerProfileActivityPanel
            :chat-messages="chatMessages"
            :game-events="gameEvents"
            :economy-transactions="economyTransactions"
            :teleport-logs="teleportLogs"
            :format-time="formatTime"
            @view-page="goToPlayerFilteredPage"
          />
        </el-tab-pane>

        <el-tab-pane :label="t('views.playerProfile.tabs.economy')">
          <PlayerProfileEconomyPanel
            :economy-transactions="economyTransactions"
            :format-time="formatTime"
            @view-page="goToPlayerFilteredPage"
          />
        </el-tab-pane>

        <el-tab-pane :label="t('views.playerProfile.tabs.teleport')">
          <PlayerProfileTeleportPanel
            :teleport-logs="teleportLogs"
            :format-time="formatTime"
            @view-page="goToPlayerFilteredPage"
          />
        </el-tab-pane>
      </el-tabs>

      <footer class="player-profile-footer">
        {{ t('views.playerProfile.loadedAt') }}: {{ loadedAt ? dayjs(loadedAt).format('YYYY-MM-DD HH:mm:ss') : '--' }}
      </footer>
    </div>
  </el-card>
</template>

<style scoped lang="scss">
.player-profile-page {
  :deep(.el-card__body) {
    padding: 0;
  }
}

.player-profile-page__body {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 18px;
}

.player-profile-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.player-profile-header__main,
.player-profile-header__actions {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.player-profile-header__actions {
  flex-wrap: wrap;
  justify-content: flex-end;
}

.player-profile-header__title {
  margin: 0;
  overflow: hidden;
  font-size: 20px;
  font-weight: 700;
  line-height: 1.3;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.player-profile-header__id {
  margin: 4px 0 0;
  color: var(--el-text-color-secondary);
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 12px;
}

.player-profile-summary {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.player-profile-summary__item {
  border: 1px solid var(--el-border-color-light);
  border-radius: 8px;
  background: color-mix(in srgb, var(--el-bg-color) 96%, white 4%);
}

.player-profile-summary__item {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 14px;
}

.player-profile-summary__item span {
  color: var(--el-text-color-secondary);
  font-size: 13px;
}

.player-profile-summary__item strong {
  color: var(--el-text-color-primary);
  font-size: 22px;
}

.player-profile-tabs {
  min-height: 0;
}

.player-profile-footer {
  color: var(--el-text-color-secondary);
  font-size: 12px;
  text-align: right;
}

@media (max-width: 960px) {
  .player-profile-header,
  .player-profile-header__actions {
    align-items: flex-start;
    flex-direction: column;
  }

  .player-profile-summary {
    grid-template-columns: 1fr;
  }
}
</style>
