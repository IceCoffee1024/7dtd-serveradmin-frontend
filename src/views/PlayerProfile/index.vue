<script setup lang="ts">
import type {
  AdminUserDto,
  BanEntryDto,
  ChatMessageDto,
  ClaimOwnerDto,
  EconomyAccountDetailDto,
  EconomyTransactionDto,
  GameEventLogDto,
  HomeLocationDto,
  MuteEntryDto,
  PlayerDetailsDto,
  TeleportLogDto,
  VehicleLocationDto,
  WhitelistEntryDto,
} from '~/generated/api/types.gen';
import dayjs from 'dayjs';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import {
  chatGetMutes,
  chatMessagesGet,
  economyGetAccount,
  economyTransactionsGetTransactions,
  gameEventLogGetGameEventLogs,
  gameServerGetAdminUsers,
  gameServerGetBans,
  gameServerGetLandClaims,
  gameServerGetPlayerDetails,
  gameServerGetVehicleLocations,
  gameServerGetWhitelistEntries,
  teleportGetHomes,
  teleportGetLogs,
} from '~/generated/api/sdk.gen';
import { formatPosition } from '~/utils';

defineOptions({ name: 'PlayerProfilePage' });

interface ProfileStatus {
  isAdmin: boolean;
  isBanned: boolean;
  isMuted: boolean;
  isWhitelisted: boolean;
}

const { t } = useI18n();
const route = useRoute();
const router = useRouter();

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

function formatHomePosition(home: HomeLocationDto): string {
  if (home.x == null || home.y == null || home.z == null)
    return '--';
  return `${home.x}, ${home.y}, ${home.z}`;
}

function formatTeleportPosition(log: TeleportLogDto, side: 'from' | 'to'): string {
  const x = side === 'from' ? log.fromX : log.toX;
  const y = side === 'from' ? log.fromY : log.toY;
  const z = side === 'from' ? log.fromZ : log.toZ;
  if (x == null || y == null || z == null)
    return '--';
  return `${x}, ${y}, ${z}`;
}

async function safeLoad<T>(loader: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await loader();
  }
  catch (error) {
    console.error(error);
    return fallback;
  }
}

async function loadProfile() {
  if (!playerId.value)
    return;

  loading.value = true;
  try {
    const [
      detailsData,
      economyData,
      homesData,
      landClaimsData,
      vehiclesData,
      chatData,
      eventData,
      transactionData,
      teleportData,
      adminUsers,
      bans,
      mutes,
      whitelist,
    ] = await Promise.all([
      safeLoad(async () => (await gameServerGetPlayerDetails({ path: { playerId: playerId.value } })).data ?? null, null),
      safeLoad(async () => (await economyGetAccount({ path: { playerId: playerId.value } })).data ?? null, null),
      safeLoad(async () => (await teleportGetHomes({ query: { playerId: playerId.value } })).data ?? [], []),
      safeLoad(async () => (await gameServerGetLandClaims({ path: { playerId: playerId.value } })).data ?? null, null),
      safeLoad(async () => (await gameServerGetVehicleLocations()).data ?? [], []),
      safeLoad(async () => (await chatMessagesGet({ query: { playerId: playerId.value, pageNumber: 1, pageSize: 8, order: 'CreatedAt', desc: true } })).data?.items ?? [], []),
      safeLoad(async () => (await gameEventLogGetGameEventLogs({ query: { keyword: playerId.value, pageNumber: 1, pageSize: 8, order: 'CreatedAt', desc: true } })).data?.items ?? [], []),
      safeLoad(async () => (await economyTransactionsGetTransactions({ query: { playerId: playerId.value, pageNumber: 1, pageSize: 8, order: 'OccurredAt', desc: true } })).data?.items ?? [], []),
      safeLoad(async () => (await teleportGetLogs({ query: { playerId: playerId.value, pageIndex: 1, pageSize: 8 } })).data?.items ?? [], []),
      safeLoad(async () => (await gameServerGetAdminUsers()).data ?? [], []),
      safeLoad(async () => (await gameServerGetBans()).data ?? [], []),
      safeLoad(async () => (await chatGetMutes()).data ?? [], []),
      safeLoad(async () => (await gameServerGetWhitelistEntries()).data ?? [], []),
    ]);

    details.value = detailsData;
    economyAccount.value = economyData;
    homes.value = homesData;
    landClaims.value = landClaimsData;
    vehicles.value = vehiclesData.filter(vehicle => vehicle.ownerId === playerId.value);
    chatMessages.value = chatData;
    gameEvents.value = eventData.filter(event => event.playerId === playerId.value || event.targetPlayerId === playerId.value);
    economyTransactions.value = transactionData;
    teleportLogs.value = teleportData;
    adminEntry.value = adminUsers.find(item => item.playerId === playerId.value) ?? null;
    banEntry.value = bans.find(item => item.playerId === playerId.value) ?? null;
    muteEntry.value = mutes.find(item => item.playerId === playerId.value) ?? null;
    whitelistEntry.value = whitelist.find(item => item.playerId === playerId.value) ?? null;
    loadedAt.value = new Date();
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

onMounted(loadProfile);
watch(playerId, loadProfile);
</script>

<template>
  <el-card v-loading="loading" class="player-profile-page h-full min-h-0" shadow="never">
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

      <el-tabs class="player-profile-tabs">
        <el-tab-pane :label="t('views.playerProfile.tabs.overview')">
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
          </div>
        </el-tab-pane>

        <el-tab-pane :label="t('views.playerProfile.tabs.assets')">
          <div class="profile-panel-stack">
            <section class="profile-panel">
              <h3>{{ t('views.playerProfile.sections.homes') }}</h3>
              <el-table :data="homes" size="small" border>
                <el-table-column prop="homeName" :label="t('views.playerProfile.fields.homeName')" />
                <el-table-column :label="t('views.playerList.position')">
                  <template #default="{ row }">
                    {{ formatHomePosition(row) }}
                  </template>
                </el-table-column>
                <el-table-column :label="t('views.playerProfile.fields.createdAt')">
                  <template #default="{ row }">
                    {{ formatTime(row.createdAt) }}
                  </template>
                </el-table-column>
              </el-table>
            </section>

            <section class="profile-panel">
              <h3>{{ t('views.playerProfile.sections.vehicles') }}</h3>
              <el-table :data="vehicles" size="small" border>
                <el-table-column prop="localizedName" :label="t('views.map.vehicle')" />
                <el-table-column prop="entityId" :label="t('views.playerList.entityId')" width="110" />
                <el-table-column :label="t('views.playerList.position')">
                  <template #default="{ row }">
                    {{ formatPosition(row.position) }}
                  </template>
                </el-table-column>
                <el-table-column prop="storageItemCount" :label="t('views.map.storage')" width="120" />
              </el-table>
            </section>
          </div>
        </el-tab-pane>

        <el-tab-pane :label="t('views.playerProfile.tabs.activity')">
          <div class="profile-panel-stack">
            <section class="profile-panel">
              <h3>{{ t('views.playerProfile.sections.gameEvents') }}</h3>
              <el-table :data="gameEvents" size="small" border>
                <el-table-column :label="t('views.gameEventLogs.columns.createdAt')" width="170">
                  <template #default="{ row }">
                    {{ formatTime(row.createdAt) }}
                  </template>
                </el-table-column>
                <el-table-column prop="eventType" :label="t('views.gameEventLogs.columns.eventType')" />
                <el-table-column prop="playerName" :label="t('views.gameEventLogs.columns.playerName')" />
                <el-table-column prop="targetPlayerName" :label="t('views.gameEventLogs.columns.targetPlayerName')" />
              </el-table>
            </section>

            <section class="profile-panel">
              <h3>{{ t('views.playerProfile.sections.chat') }}</h3>
              <el-table :data="chatMessages" size="small" border>
                <el-table-column :label="t('views.gameChat.history.columns.createdAt')" width="170">
                  <template #default="{ row }">
                    {{ formatTime(row.createdAt) }}
                  </template>
                </el-table-column>
                <el-table-column prop="chatType" :label="t('views.gameChat.history.columns.chatType')" width="120" />
                <el-table-column prop="message" :label="t('views.gameChat.history.columns.message')" />
              </el-table>
            </section>
          </div>
        </el-tab-pane>

        <el-tab-pane :label="t('views.playerProfile.tabs.economy')">
          <section class="profile-panel">
            <h3>{{ t('views.playerProfile.sections.economyTransactions') }}</h3>
            <el-table :data="economyTransactions" size="small" border>
              <el-table-column :label="t('views.economy.transactions.columns.occurredAt')" width="170">
                <template #default="{ row }">
                  {{ formatTime(row.occurredAt) }}
                </template>
              </el-table-column>
              <el-table-column prop="type" :label="t('views.economy.transactions.columns.type')" />
              <el-table-column prop="amount" :label="t('views.economy.transactions.columns.amount')" />
              <el-table-column prop="balanceAfter" :label="t('views.economy.transactions.columns.balanceAfter')" />
              <el-table-column prop="source" :label="t('views.economy.transactions.columns.source')" />
            </el-table>
          </section>
        </el-tab-pane>

        <el-tab-pane :label="t('views.playerProfile.tabs.teleport')">
          <section class="profile-panel">
            <h3>{{ t('views.playerProfile.sections.teleportLogs') }}</h3>
            <el-table :data="teleportLogs" size="small" border>
              <el-table-column :label="t('views.teleport.logs.columns.timestamp')" width="170">
                <template #default="{ row }">
                  {{ formatTime(row.timestamp) }}
                </template>
              </el-table-column>
              <el-table-column prop="subSystem" :label="t('views.teleport.logs.columns.subSystem')" />
              <el-table-column :label="t('views.playerProfile.fields.from')">
                <template #default="{ row }">
                  {{ formatTeleportPosition(row, 'from') }}
                </template>
              </el-table-column>
              <el-table-column :label="t('views.playerProfile.fields.to')">
                <template #default="{ row }">
                  {{ formatTeleportPosition(row, 'to') }}
                </template>
              </el-table-column>
              <el-table-column prop="costPaid" :label="t('views.teleport.logs.columns.costPaid')" />
            </el-table>
          </section>
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
    height: 100%;
    min-height: 0;
    padding: 0;
  }
}

.player-profile-page__body {
  display: flex;
  flex-direction: column;
  gap: 16px;
  height: 100%;
  min-height: 0;
  padding: 18px;
  overflow: auto;
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

.player-profile-summary__item,
.profile-panel {
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

.player-profile-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.profile-panel-stack {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.profile-panel {
  min-width: 0;
  padding: 14px;
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

  .player-profile-summary,
  .player-profile-grid {
    grid-template-columns: 1fr;
  }
}
</style>
