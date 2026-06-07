<script setup lang="ts">
import type { FormRules } from 'element-plus';
import type { MyTableColumn, MyTableFetchParams, MyTableFetchResult } from '~/composables/table';
import type { MyFormField } from '~/composables/useMyForm';
import type {
  GameItemDto,
  GiveItemToPlayerRequestDto,
  OnlinePlayerDto,
  OnlinePlayerQueryOrder,
  PositionDto,
} from '~/generated/api/types.gen';
import type { ContextMenuOption } from '~/plugins/contextMenu';
import { useMutation, useQueryCache } from '@pinia/colada';
import dayjs from 'dayjs';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import serverFavoriteImgUrl from '~/assets/images/server_favorite.png';
import GameItemSelect from '~/components/GameItemSelect/index.vue';
import MyDialog from '~/components/MyDialog/index.vue';
import MyForm from '~/components/MyForm/index.vue';
import { usePopup } from '~/composables/usePopup';
import {
  chatAddOrUpdateMuteMutation,
  chatRemoveMutesMutation,
  gameServerCreateBanMutation,
  gameServerGetOnlinePlayersQuery,
  gameServerGiveItemToOnlinePlayerMutation,
  gameServerKickPlayerMutation,
} from '~/generated/api/@pinia/colada.gen';
import { client } from '~/generated/api/client.gen';
import v from '~/plugins/valibot';
import { invalidateGeneratedQueries } from '~/queries/generated';
import { formatPosition, generateElementRules, showCommandResult } from '~/utils';

type OnlinePlayerRow = OnlinePlayerDto;
type GiveItemMode = 'single' | 'allOnline';

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
const { confirm: confirmPopup, prompt, toast } = usePopup();
const queryCache = useQueryCache();
const kickPlayerMutation = useMutation({
  ...gameServerKickPlayerMutation(),
  async onSettled() {
    await invalidateGeneratedQueries('GameServer');
  },
});
const banPlayerMutation = useMutation({
  ...gameServerCreateBanMutation(),
  async onSettled() {
    await invalidateGeneratedQueries('GameServer');
  },
});
const addMuteMutation = useMutation({
  ...chatAddOrUpdateMuteMutation(),
  async onSettled() {
    await invalidateGeneratedQueries('Chat');
  },
});
const removeMuteMutation = useMutation({
  ...chatRemoveMutesMutation(),
  async onSettled() {
    await invalidateGeneratedQueries('Chat');
  },
});
const giveItemMutation = useMutation({
  ...gameServerGiveItemToOnlinePlayerMutation(),
});
const giveItemToAllOnlinePlayersMutation = useMutation({
  mutation: async (body: GiveItemToPlayerRequestDto) => {
    const { data } = await client.post<string[], unknown, true>({
      security: [{ scheme: 'basic', type: 'http' }, { name: 'Authorization', type: 'apiKey' }],
      url: '/api/GameServer/OnlinePlayers/Items',
      body,
      headers: {
        'Content-Type': 'application/json',
      },
      throwOnError: true,
    });
    return data;
  },
});
const isGivingItem = computed(() => giveItemMutation.isLoading.value || giveItemToAllOnlinePlayersMutation.isLoading.value);

const isAutoRefreshEnabled = ref(true);
const autoRefreshInterval = ref(10);

const resolvedAutoRefreshInterval = computed(() =>
  isAutoRefreshEnabled.value ? autoRefreshInterval.value : 0,
);

const columns = computed<MyTableColumn<OnlinePlayerRow>[]>(() => [
  {
    prop: 'keyword',
    label: t('components.myTable.keywordSearch'),
    show: false,
    exportable: false,
    search: {
      el: 'el-input',
      props: { clearable: true },
    },
  },
  { prop: 'playerName', label: t('views.playerList.playerName'), slot: 'playerName', sortable: true, fixed: 'left' },
  { prop: 'entityId', label: t('views.playerList.entityId'), sortable: true },
  { prop: 'level', label: t('views.playerList.level'), sortable: true },
  { prop: 'gameStage', label: t('views.playerList.gameStage'), sortable: true },
  { prop: 'zombieKills', label: t('views.playerList.zombieKills'), sortable: true },
  { prop: 'playerKills', label: t('views.playerList.playerKills'), sortable: true },
  { prop: 'deaths', label: t('views.playerList.deaths'), sortable: true },
  { prop: 'ip', label: t('views.playerList.ip') },
  { prop: 'ping', label: t('views.playerList.ping'), sortable: true },
  { prop: 'position', label: t('views.playerList.position'), slot: 'position', exportFormatter: value => formatPosition(value as PositionDto | null | undefined) },
  { prop: 'expToNextLevel', label: t('views.playerList.expToNextLevel') },
  { prop: 'skillPoints', label: t('views.playerList.skillPoints'), sortable: true },
  {
    prop: 'isTwitchEnabled',
    label: t('views.playerList.twitchEnabled'),
    slot: 'isTwitchEnabled',
    exportFormatter: value => (value ? t('common.yes') : t('common.no')),
  },
  { prop: 'playerId', label: t('views.playerList.playerId') },
  { prop: 'platformId', label: t('views.playerList.platformId') },
  { prop: 'permissionLevel', label: t('views.playerList.permissionLevel'), sortable: true },
]);

const playerInventoryDialogRef = useTemplateRef('playerInventoryDialogRef');
const playerSkillsDialogRef = useTemplateRef('playerSkillsDialogRef');
const playerDetailsDialogRef = useTemplateRef('playerDetailsDialogRef');
const giveItemDialogRef = useTemplateRef('giveItemDialogRef');
const giveItemFormRef = useTemplateRef<FormExpose>('giveItemFormRef');
const giveItemTarget = ref<OnlinePlayerRow | null>(null);
const giveItemMode = ref<GiveItemMode>('single');
const selectedGameItem = ref<GameItemDto | null>(null);
const onlinePlayerTotal = ref(0);
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

async function fetchData(params: MyTableFetchParams): Promise<MyTableFetchResult<OnlinePlayerRow>> {
  const options = gameServerGetOnlinePlayersQuery({
    query: {
      pageNumber: params.pageNumber,
      pageSize: params.pageSize,
      keyword: params.search?.keyword?.trim() || undefined,
      order: toOrder(params.sortField),
      desc: !params.sortOrder ? undefined : params.sortOrder === 'descending',
    },
  });
  const entry = queryCache.ensure(options);
  const state = await queryCache.fetch(entry);

  if (state.status === 'error') {
    throw state.error;
  }

  const response = state.data;
  onlinePlayerTotal.value = response?.total ?? 0;

  return {
    list: response?.items ?? [],
    total: response?.total ?? 0,
  };
}

function toOrder(sortField: string | undefined): OnlinePlayerQueryOrder | undefined {
  switch (sortField) {
    case 'entityId': return 'EntityId';
    case 'playerName': return 'PlayerName';
    case 'ping': return 'Ping';
    case 'permissionLevel': return 'PermissionLevel';
    case 'zombieKills': return 'ZombieKills';
    case 'playerKills': return 'PlayerKills';
    case 'deaths': return 'Deaths';
    case 'level': return 'Level';
    case 'expToNextLevel': return 'ExpToNextLevel';
    case 'skillPoints': return 'SkillPoints';
    case 'gameStage': return 'GameStage';
    default: return undefined;
  }
}

function openGiveItemDialog(row: OnlinePlayerRow) {
  giveItemMode.value = 'single';
  giveItemTarget.value = row;
  giveItemForm.itemName = '';
  giveItemForm.count = 1;
  giveItemForm.quality = 1;
  selectedGameItem.value = null;
  giveItemDialogRef.value?.open();
  nextTick(() => giveItemFormRef.value?.clearValidate());
}

function openGiveItemDialogForAllOnlinePlayers() {
  giveItemMode.value = 'allOnline';
  giveItemTarget.value = null;
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
  if (giveItemMode.value === 'single' && !giveItemTarget.value) {
    return false;
  }

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
    const result = giveItemMode.value === 'allOnline'
      ? await giveItemToAllOnlinePlayersMutation.mutateAsync(body)
      : await giveItemMutation.mutateAsync({
          path: { playerId: giveItemTarget.value!.playerId },
          body,
        });
    showCommandResult(result ?? undefined, t('views.playerList.giveItem.title'));
  }
  catch (error) {
    console.error(error);
    return false;
  }
}

const contextMenuItems = computed<ContextMenuOption<OnlinePlayerRow>[]>(() => [
  {
    label: t('views.playerList.viewProfile'),
    command: (row) => {
      if (!row)
        return;
      void router.push({
        name: 'PlayerProfile',
        params: { locale: route.params.locale, playerId: row.playerId },
        query: { playerName: row.playerName },
      });
    },
  },
  {
    label: t('views.playerList.viewInventory'),
    command: (row) => {
      if (!row)
        return;
      playerInventoryDialogRef.value?.open(row.playerId, row.playerName);
    },
  },
  {
    label: t('views.playerList.viewSkills'),
    command: (row) => {
      if (!row)
        return;
      playerSkillsDialogRef.value?.open(row.playerId, row.playerName);
    },
  },
  {
    label: t('views.playerList.viewDetails'),
    command: (row) => {
      if (!row)
        return;
      playerDetailsDialogRef.value?.open(row.playerId, row.playerName);
    },
  },
  {
    label: t('views.playerList.giveItem.title'),
    divided: true,
    command: (row) => {
      if (!row)
        return;
      openGiveItemDialog(row);
    },
  },
  {
    label: t('views.playerList.kick'),
    command: async (row) => {
      if (!row)
        return;
      const reason = await prompt({ text: t('views.playerList.kickReason') });
      if (reason === undefined)
        return;
      try {
        const result = await kickPlayerMutation.mutateAsync({
          body: { playerId: row.playerId, reason: reason || null },
        });
        showCommandResult(result ?? undefined, t('views.playerList.kick'));
      }
      catch (error) {
        console.error(error);
      }
    },
  },
  {
    label: t('views.playerList.ban'),
    command: async (row) => {
      if (!row)
        return;
      const minutesStr = await prompt({
        text: t('views.playerList.banDuration'),
        inputValidator: v => (Number(v) > 0) || t('views.playerList.banDuration'),
      });
      if (minutesStr === undefined)
        return;
      const reason = await prompt({ text: t('views.playerList.banReason') });
      if (reason === undefined)
        return;
      const confirmed = await confirmPopup({ text: t('views.playerList.ban'), type: 'warning' });
      if (!confirmed)
        return;
      try {
        const bannedUntil = dayjs().add(Number(minutesStr), 'minute').toISOString();
        const result = await banPlayerMutation.mutateAsync({
          body: {
            playerId: row.playerId,
            bannedUntil,
            displayName: row.playerName,
            reason: reason || null,
          },
        });
        showCommandResult(result ?? undefined, t('views.playerList.ban'));
      }
      catch (error) {
        console.error(error);
      }
    },
  },
  {
    label: t('views.playerList.mute'),
    disabled: row => !!row?.isMuted,
    command: async (row) => {
      if (!row)
        return;
      const minutesStr = await prompt({ text: t('views.playerList.muteDuration') });
      if (minutesStr === undefined)
        return;
      const reason = await prompt({ text: t('views.playerList.muteReason') });
      if (reason === undefined)
        return;
      try {
        const minutes = Number(minutesStr);
        const mutedUntil = minutes > 0 ? dayjs().add(minutes, 'minute').toISOString() : null;
        await addMuteMutation.mutateAsync({
          body: { playerId: row.playerId, playerName: row.playerName, mutedUntil, reason: reason || null },
        });
        toast({ type: 'success', title: t('views.playerList.mute') });
      }
      catch (error) {
        console.error(error);
      }
    },
  },
  {
    label: t('views.playerList.unmute'),
    disabled: row => !row?.isMuted,
    command: async (row) => {
      if (!row)
        return;
      try {
        await removeMuteMutation.mutateAsync({ body: [row.playerId] });
        toast({ type: 'success', title: t('views.playerList.unmute') });
      }
      catch (error) {
        console.error(error);
      }
    },
  },
]);
</script>

<template>
  <div class="h-full">
    <MyTable
      row-key="playerId"
      :columns="columns"
      :fetch-data="fetchData"
      :context-menu-items="contextMenuItems"
      :auto-refresh-interval="resolvedAutoRefreshInterval"
      :show-add-btn="false"
      :selectable="false"
      :operation-column-width="110"
      :auto-column-width="true"
    >
      <template #toolbar-right="{ tableSize }">
        <el-button
          type="primary"
          :size="tableSize"
          :loading="isGivingItem"
          @click="openGiveItemDialogForAllOnlinePlayers"
        >
          <icon-mdi:gift class="mr-1" />
          {{ t('views.playerList.giveItem.allOnline') }}
        </el-button>
      </template>
      <template #footer-left="{ tableSize }">
        <div class="footer-refresh-row">
          <el-checkbox v-model="isAutoRefreshEnabled" :size="tableSize">
            {{ t('components.myTable.autoRefresh') }}
          </el-checkbox>

          <div class="footer-refresh-row__interval">
            <span class="footer-refresh-row__label">
              {{ t('components.myTable.refreshInterval') }}
            </span>
            <el-input-number
              v-model="autoRefreshInterval"
              :disabled="!isAutoRefreshEnabled"
              :min="5"
              :max="300"
              :step="5"
              controls-position="right"
              :size="tableSize"
              class="footer-refresh-row__input"
            />
            <span class="footer-refresh-row__label">
              {{ t('components.myTable.secondsUnit') }}
            </span>
          </div>
        </div>
      </template>
      <template #playerName="{ row }">
        <span class="flex gap-1 items-center">
          <span>{{ row.playerName }}</span>
          <img v-if="row.isAdmin" :src="serverFavoriteImgUrl" width="20" :title="t('views.playerList.admin')">
        </span>
      </template>
      <template #position="{ row }">
        {{ formatPosition(row.position) }}
      </template>
      <template #isTwitchEnabled="{ row }">
        <el-tag :type="row.isTwitchEnabled ? 'success' : 'danger'">
          {{ row.isTwitchEnabled ? $t('common.yes') : $t('common.no') }}
        </el-tag>
      </template>
      <template #operation />
    </MyTable>
    <MyDialog
      ref="giveItemDialogRef"
      :title="t('views.playerList.giveItem.title')"
      :loading="isGivingItem"
      :on-confirm="onGiveItemConfirm"
    >
      <div class="text-sm mb-3 px-3 py-2 border border-gray-200 rounded bg-gray-50 dark:border-gray-700 dark:bg-gray-800/60">
        <span class="text-gray-500 dark:text-gray-400">{{ t('views.playerList.giveItem.target') }}</span>
        <template v-if="giveItemMode === 'allOnline'">
          <span class="font-semibold ml-2">{{ t('views.playerList.giveItem.allOnline') }}</span>
          <span class="text-gray-400 ml-2">{{ t('views.playerList.giveItem.onlineCount', [onlinePlayerTotal]) }}</span>
        </template>
        <template v-else-if="giveItemTarget">
          <span class="font-semibold ml-2">{{ giveItemTarget.playerName }}</span>
          <span class="text-gray-400 font-mono ml-2">{{ giveItemTarget.playerId }}</span>
        </template>
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
    <PlayerSkillsDialog ref="playerSkillsDialogRef" />
    <PlayerDetailsDialog ref="playerDetailsDialogRef" />
  </div>
</template>

<style scoped>
.footer-refresh-row {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  font-size: 14px;
}

.footer-refresh-row__interval {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.footer-refresh-row__label {
  color: var(--el-text-color-regular);
}

.footer-refresh-row__input {
  width: 112px;
}
</style>
