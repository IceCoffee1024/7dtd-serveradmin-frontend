<script setup lang="ts">
import type { FormRules } from 'element-plus';
import type { MyFormField } from '~/composables/useMyForm';
import type {
  AdminUserDto,
  BanEntryDto,
  ChatMessageDto,
  ClaimOwnerDto,
  EconomyAccountDetailDto,
  EconomyTransactionDto,
  GameEventLogDto,
  GameItemDto,
  GiveItemToPlayerRequestDto,
  HomeLocationDto,
  MuteEntryDto,
  PlayerDetailsDto,
  TeleportLogDto,
  VehicleLocationDto,
  WhitelistEntryDto,
} from '~/generated/api/types.gen';
import { useMutation } from '@pinia/colada';
import dayjs from 'dayjs';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import GameItemSelect from '~/components/GameItemSelect/index.vue';
import MyDialog from '~/components/MyDialog/index.vue';
import MyForm from '~/components/MyForm/index.vue';
import { usePopup } from '~/composables';
import {
  chatAddOrUpdateMuteMutation,
  chatRemoveMutesMutation,
  gameServerCreateBanMutation,
  gameServerGiveItemToOnlinePlayerMutation,
  gameServerKickPlayerMutation,
  gameServerRemoveBansMutation,
} from '~/generated/api/@pinia/colada.gen';
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
import v from '~/plugins/valibot';
import { invalidateGeneratedQueries } from '~/queries/generated';
import { formatPosition, generateElementRules, showCommandResult } from '~/utils';

defineOptions({ name: 'PlayerProfilePage' });

interface ProfileStatus {
  isAdmin: boolean;
  isBanned: boolean;
  isMuted: boolean;
  isWhitelisted: boolean;
}

interface FormExpose {
  validate: () => Promise<boolean | undefined>;
  clearValidate: (props?: string | string[]) => void;
}

interface GiveItemFormModel {
  itemName: string;
  count: number;
  quality: number;
}

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const { confirm, prompt, toast } = usePopup();

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
const playerInventoryDialogRef = useTemplateRef('playerInventoryDialogRef');
const giveItemDialogRef = useTemplateRef('giveItemDialogRef');
const giveItemFormRef = useTemplateRef<FormExpose>('giveItemFormRef');
const selectedGameItem = ref<GameItemDto | null>(null);
const giveItemForm = reactive<GiveItemFormModel>({
  itemName: '',
  count: 1,
  quality: 1,
});
const selectedItemAcceptsQuality = computed(() => selectedGameItem.value?.hasQuality === true);
const giveItemSchema = v.object({
  itemName: v.pipe(v.string(), v.minLength(1)),
  count: v.pipe(v.number(), v.minValue(1), v.maxValue(999999)),
  quality: v.pipe(v.number(), v.minValue(1), v.maxValue(6)),
});
const giveItemRules: FormRules = generateElementRules(giveItemSchema);
const giveItemFields = computed<MyFormField<GiveItemFormModel>[]>(() => [
  {
    prop: 'itemName',
    label: t('views.playerList.giveItem.fields.itemName'),
    el: 'custom',
    span: { xs: 24 },
  },
  {
    prop: 'count',
    label: t('views.playerList.giveItem.fields.count'),
    el: 'el-input-number',
    props: { min: 1, max: 999999, precision: 0, class: 'w-full' },
    span: { xs: 24, md: 12 },
  },
  {
    prop: 'quality',
    label: t('views.playerList.giveItem.fields.quality'),
    el: 'el-input-number',
    props: { min: 1, max: 6, precision: 0, class: 'w-full' },
    disabled: () => !selectedItemAcceptsQuality.value,
    tooltip: t('views.playerList.giveItem.qualityHint'),
    span: { xs: 24, md: 12 },
  },
]);
const kickPlayerMutation = useMutation({
  ...gameServerKickPlayerMutation(),
});
const banPlayerMutation = useMutation({
  ...gameServerCreateBanMutation(),
});
const removeBanMutation = useMutation({
  ...gameServerRemoveBansMutation(),
});
const addMuteMutation = useMutation({
  ...chatAddOrUpdateMuteMutation(),
});
const removeMuteMutation = useMutation({
  ...chatRemoveMutesMutation(),
});
const giveItemMutation = useMutation({
  ...gameServerGiveItemToOnlinePlayerMutation(),
});
const isGivingItem = computed(() => giveItemMutation.isLoading.value);

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

function openInventory() {
  playerInventoryDialogRef.value?.open(playerId.value, displayName.value);
}

function openGiveItemDialog() {
  giveItemForm.itemName = '';
  giveItemForm.count = 1;
  giveItemForm.quality = 1;
  selectedGameItem.value = null;
  giveItemDialogRef.value?.open();
  nextTick(() => giveItemFormRef.value?.clearValidate());
}

function onSelectedGameItemChange(item: GameItemDto | null) {
  selectedGameItem.value = item;
  if (item?.hasQuality !== true) {
    giveItemForm.quality = 1;
  }
}

async function onGiveItemConfirm(): Promise<boolean | void> {
  const valid = await giveItemFormRef.value?.validate().catch(() => false);
  if (!valid) {
    return false;
  }

  const body: GiveItemToPlayerRequestDto = {
    itemName: giveItemForm.itemName.trim(),
    count: Number(giveItemForm.count),
    quality: selectedItemAcceptsQuality.value ? Number(giveItemForm.quality) : null,
  };

  try {
    const result = await giveItemMutation.mutateAsync({
      path: { playerId: playerId.value },
      body,
    });
    showCommandResult(result ?? undefined, t('views.playerList.giveItem.title'));
  }
  catch (error) {
    console.error(error);
    return false;
  }
}

async function onKickPlayer() {
  if (!isOnline.value) {
    return;
  }

  const reason = await prompt({ text: t('views.playerList.kickReason') });
  if (reason === undefined) {
    return;
  }

  try {
    const result = await kickPlayerMutation.mutateAsync({
      body: { playerId: playerId.value, reason: reason || null },
    });
    showCommandResult(result ?? undefined, t('views.playerList.kick'));
    await loadProfile();
  }
  catch (error) {
    console.error(error);
  }
}

async function onBanPlayer() {
  const minutesStr = await prompt({
    text: t('views.playerList.banDuration'),
    inputValidator: value => (Number(value) > 0) || t('views.playerList.banDuration'),
  });
  if (minutesStr === undefined) {
    return;
  }

  const reason = await prompt({ text: t('views.playerList.banReason') });
  if (reason === undefined) {
    return;
  }

  const confirmed = await confirm({ text: t('views.playerList.ban'), type: 'warning' });
  if (!confirmed) {
    return;
  }

  try {
    const result = await banPlayerMutation.mutateAsync({
      body: {
        playerId: playerId.value,
        bannedUntil: dayjs().add(Number(minutesStr), 'minute').toISOString(),
        displayName: displayName.value,
        reason: reason || null,
      },
    });
    showCommandResult(result ?? undefined, t('views.playerList.ban'));
    await invalidateGeneratedQueries('GameServer');
    await loadProfile();
  }
  catch (error) {
    console.error(error);
  }
}

async function onRemoveBan() {
  const confirmed = await confirm({ text: t('views.playerProfile.flags.banned'), type: 'warning' });
  if (!confirmed) {
    return;
  }

  try {
    const result = await removeBanMutation.mutateAsync({ body: [playerId.value] });
    showCommandResult(result ?? undefined, t('views.playerProfile.flags.banned'));
    await invalidateGeneratedQueries('GameServer');
    await loadProfile();
  }
  catch (error) {
    console.error(error);
  }
}

async function onMutePlayer() {
  const minutesStr = await prompt({ text: t('views.playerList.muteDuration') });
  if (minutesStr === undefined) {
    return;
  }

  const reason = await prompt({ text: t('views.playerList.muteReason') });
  if (reason === undefined) {
    return;
  }

  try {
    const minutes = Number(minutesStr);
    const mutedUntil = minutes > 0 ? dayjs().add(minutes, 'minute').toISOString() : null;
    await addMuteMutation.mutateAsync({
      body: {
        playerId: playerId.value,
        playerName: displayName.value,
        mutedUntil,
        reason: reason || null,
      },
    });
    toast({ type: 'success', title: t('views.playerList.mute') });
    await invalidateGeneratedQueries('Chat');
    await loadProfile();
  }
  catch (error) {
    console.error(error);
  }
}

async function onRemoveMute() {
  try {
    await removeMuteMutation.mutateAsync({ body: [playerId.value] });
    toast({ type: 'success', title: t('views.playerList.unmute') });
    await invalidateGeneratedQueries('Chat');
    await loadProfile();
  }
  catch (error) {
    console.error(error);
  }
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

      <section class="profile-panel player-profile-actions">
        <div class="profile-panel__header">
          <h3>{{ t('components.myTable.operation') }}</h3>
          <el-tag :type="isOnline ? 'success' : 'info'" effect="plain">
            {{ isOnline ? t('common.online') : t('common.offline') }}
          </el-tag>
        </div>
        <div class="player-profile-actions__list">
          <el-button :disabled="!playerId" @click="openInventory">
            <icon-mdi:bag-personal-outline class="mr-1" />
            {{ t('views.map.viewPlayerInventory') }}
          </el-button>
          <el-button type="primary" :disabled="!isOnline" :loading="isGivingItem" @click="openGiveItemDialog">
            <icon-mdi:gift-outline class="mr-1" />
            {{ t('views.playerList.giveItem.title') }}
          </el-button>
          <el-button :disabled="!isOnline" :loading="kickPlayerMutation.isLoading.value" @click="onKickPlayer">
            <icon-mdi:logout class="mr-1" />
            {{ t('views.playerList.kick') }}
          </el-button>
          <el-button
            v-if="status.isMuted"
            type="success"
            :loading="removeMuteMutation.isLoading.value"
            @click="onRemoveMute"
          >
            <icon-mdi:microphone-outline class="mr-1" />
            {{ t('views.playerList.unmute') }}
          </el-button>
          <el-button
            v-else
            type="warning"
            :loading="addMuteMutation.isLoading.value"
            @click="onMutePlayer"
          >
            <icon-mdi:microphone-off class="mr-1" />
            {{ t('views.playerList.mute') }}
          </el-button>
          <el-button
            v-if="status.isBanned"
            type="success"
            :loading="removeBanMutation.isLoading.value"
            @click="onRemoveBan"
          >
            <icon-mdi:account-check-outline class="mr-1" />
            {{ t('views.playerProfile.actions.unban') }}
          </el-button>
          <el-button
            v-else
            type="danger"
            :loading="banPlayerMutation.isLoading.value"
            @click="onBanPlayer"
          >
            <icon-mdi:account-cancel-outline class="mr-1" />
            {{ t('views.playerList.ban') }}
          </el-button>
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
              <div class="profile-panel__header">
                <h3>{{ t('views.playerProfile.sections.homes') }}</h3>
                <el-button type="primary" link @click="goToPlayerFilteredPage('TeleportHomes')">
                  {{ t('components.myTable.view') }}
                </el-button>
              </div>
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
              <div class="profile-panel__header">
                <h3>{{ t('views.playerProfile.sections.gameEvents') }}</h3>
                <el-button type="primary" link @click="goToPlayerFilteredPage('GameEventLogs')">
                  {{ t('components.myTable.view') }}
                </el-button>
              </div>
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
              <div class="profile-panel__header">
                <h3>{{ t('views.playerProfile.sections.chat') }}</h3>
                <el-button type="primary" link @click="goToPlayerFilteredPage('ChatHistory')">
                  {{ t('components.myTable.view') }}
                </el-button>
              </div>
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
            <div class="profile-panel__header">
              <h3>{{ t('views.playerProfile.sections.economyTransactions') }}</h3>
              <el-button type="primary" link @click="goToPlayerFilteredPage('EconomyTransactions')">
                {{ t('components.myTable.view') }}
              </el-button>
            </div>
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
            <div class="profile-panel__header">
              <h3>{{ t('views.playerProfile.sections.teleportLogs') }}</h3>
              <el-button type="primary" link @click="goToPlayerFilteredPage('TeleportLogs')">
                {{ t('components.myTable.view') }}
              </el-button>
            </div>
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

      <MyDialog
        ref="giveItemDialogRef"
        :title="t('views.playerList.giveItem.title')"
        :loading="isGivingItem"
        :on-confirm="onGiveItemConfirm"
      >
        <div class="text-sm mb-3 px-3 py-2 border border-gray-200 rounded bg-gray-50 dark:border-gray-700 dark:bg-gray-800/60">
          <span class="text-gray-500 dark:text-gray-400">{{ t('views.playerList.giveItem.target') }}</span>
          <span class="font-semibold ml-2">{{ displayName }}</span>
          <span class="text-gray-400 font-mono ml-2">{{ playerId }}</span>
        </div>
        <MyForm
          ref="giveItemFormRef"
          v-model="giveItemForm"
          :fields="giveItemFields"
          :rules="giveItemRules"
          label-position="top"
          label-width="auto"
          :gutter="16"
        >
          <template #itemName>
            <GameItemSelect
              v-model="giveItemForm.itemName"
              include-blocks
              :placeholder="t('views.playerList.giveItem.fields.itemName')"
              @selected-change="onSelectedGameItemChange"
            />
          </template>
        </MyForm>
      </MyDialog>

      <PlayerInventoryDialog ref="playerInventoryDialogRef" />
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

.player-profile-actions {
  padding: 14px;
}

.player-profile-actions__list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.player-profile-actions__list :deep(.el-button) {
  margin-left: 0;
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

.profile-panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.profile-panel__header h3 {
  margin: 0;
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
