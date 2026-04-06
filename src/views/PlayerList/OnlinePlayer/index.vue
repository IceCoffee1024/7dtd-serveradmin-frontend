<script setup lang="ts">
import type { MyTableColumn, MyTableFetchParams, MyTableFetchResult } from '~/composables/table';
import type { ContextMenuOption } from '~/plugins/contextMenu';
import { useI18n } from 'vue-i18n';
import { getOnlinePlayers } from '~/api/gameServer';
import serverFavoriteImgUrl from '~/assets/images/server_favorite.png';
import { formatPosition } from '~/utils';

type OnlinePlayerRow = API.GameServer.OnlinePlayer;

const { t } = useI18n();

const isAutoRefreshEnabled = ref(true);
const autoRefreshInterval = ref(10);

const resolvedAutoRefreshInterval = computed(() =>
  isAutoRefreshEnabled.value ? autoRefreshInterval.value : 0,
);

const columns = computed<MyTableColumn<OnlinePlayerRow>[]>(() => [
  {
    prop: 'keyword',
    label: t('components.myTable.keywordSearch'),
    isShow: false,
    exportable: false,
    search: {
      el: 'input',
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
  { prop: 'position', label: t('views.playerList.position'), slot: 'position', exportFormatter: value => formatPosition(value as API.GameServer.Position | null | undefined) },
  { prop: 'expToNextLevel', label: t('views.playerList.expToNextLevel') },
  { prop: 'skillPoints', label: t('views.playerList.skillPoints'), sortable: true },
  {
    prop: 'isTwitchEnabled',
    label: t('views.playerList.isTwitchEnabled'),
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

async function fetchData(params: MyTableFetchParams): Promise<MyTableFetchResult<OnlinePlayerRow>> {
  const response = await getOnlinePlayers({
    pageNumber: params.pageNumber,
    pageSize: params.pageSize,
    keyword: params.search?.keyword?.trim() || undefined,
    order: params.sortField as API.GameServer.OnlinePlayerQuery['order'],
    desc: !params.sortOrder ? undefined : params.sortOrder === 'descending',
  });

  return {
    list: response.items,
    total: response.total,
  };
}

const contextMenuItems = computed<ContextMenuOption<OnlinePlayerRow>[]>(() => [
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
]);
</script>

<template>
  <div class="h-[calc(100vh-250px)]">
    <MyTable
      row-key="playerId"
      :columns="columns"
      :fetch-data="fetchData"
      :context-menu-items="contextMenuItems"
      :auto-refresh-interval="resolvedAutoRefreshInterval"
      :is-show-add-btn="false"
      :is-selectable="false"
      :operation-column-width="110"
      :is-show-edit-btn="false"
      :is-show-delete-btn="false"
      :auto-column-width="true"
    >
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
