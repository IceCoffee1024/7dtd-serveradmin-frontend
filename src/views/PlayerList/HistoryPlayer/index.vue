<script setup lang="ts">
import type { MyTableColumn, MyTableFetchParams, MyTableFetchResult } from '~/composables/table';
import type { ContextMenuOption } from '~/plugins/contextMenu';
import dayjs from 'dayjs';
import { useI18n } from 'vue-i18n';
import { getHistoryPlayers } from '~/api/gameServer';
import serverFavoriteImgUrl from '~/assets/images/server_favorite.png';
import { formatPosition } from '~/utils';

type HistoryPlayerRow = API.GameServer.HistoryPlayer;

const { t } = useI18n();

const columns = computed<MyTableColumn<HistoryPlayerRow>[]>(() => [
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
  {
    prop: 'isOffline',
    label: t('views.playerList.status'),
    slot: 'isOffline',
    sortable: true,
    exportFormatter: value => (value ? t('common.offline') : t('common.online')),
  },
  {
    prop: 'lastLogin',
    label: t('views.playerList.lastLogin'),
    slot: 'lastLogin',
    sortable: true,
    exportFormatter: value => (value ? dayjs(String(value)).format('YYYY-MM-DD HH:mm:ss') : ''),
  },
  { prop: 'position', label: t('views.playerList.position'), slot: 'position', exportFormatter: value => formatPosition(value as API.GameServer.Position | null | undefined) },
  { prop: 'permissionLevel', label: t('views.playerList.permissionLevel'), sortable: true },
  { prop: 'bedroll', label: t('views.playerList.bedroll'), slot: 'bedroll', exportFormatter: value => formatPosition(value as API.GameServer.Position | null | undefined) },
  { prop: 'playerId', label: t('views.playerList.playerId') },
  { prop: 'platformId', label: t('views.playerList.platformId') },
  { prop: 'playGroup', label: t('views.playerList.playGroup'), sortable: true },
]);

const playerInventoryDialogRef = useTemplateRef('playerInventoryDialogRef');
const playerSkillsDialogRef = useTemplateRef('playerSkillsDialogRef');
const playerDetailsDialogRef = useTemplateRef('playerDetailsDialogRef');

async function fetchData(params: MyTableFetchParams): Promise<MyTableFetchResult<HistoryPlayerRow>> {
  const response = await getHistoryPlayers({
    pageNumber: params.pageNumber,
    pageSize: params.pageSize,
    keyword: params.search?.keyword?.trim() || undefined,
    order: params.sortField as API.GameServer.HistoryPlayerQuery['order'],
    desc: !params.sortOrder ? undefined : params.sortOrder === 'descending',
  });

  return {
    list: response.items,
    total: response.total,
  };
}

const contextMenuItems = computed<ContextMenuOption<HistoryPlayerRow>[]>(() => [
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
      :show-add-btn="false"
      :is-selectable="false"
      :operation-column-width="110"
      :show-edit-btn="false"
      :show-delete-btn="false"
      :auto-column-width="true"
    >
      <template #playerName="{ row }">
        <span class="flex gap-1 items-center">
          <span>{{ row.playerName }}</span>
          <img v-if="row.isAdmin" :src="serverFavoriteImgUrl" width="20" :title="t('views.playerList.admin')">
        </span>
      </template>
      <template #lastLogin="{ row }">
        {{ dayjs(row.lastLogin).format('YYYY-MM-DD HH:mm:ss') }}
      </template>
      <template #position="{ row }">
        {{ formatPosition(row.position) }}
      </template>
      <template #bedroll="{ row }">
        {{ formatPosition(row.bedroll) }}
      </template>
      <template #isOffline="{ row }">
        <el-tag :type="row.isOffline ? 'danger' : 'success'">
          {{ row.isOffline ? $t('common.offline') : $t('common.online') }}
        </el-tag>
      </template>
      <template #operation />
    </MyTable>
    <PlayerInventoryDialog ref="playerInventoryDialogRef" />
    <PlayerSkillsDialog ref="playerSkillsDialogRef" />
    <PlayerDetailsDialog ref="playerDetailsDialogRef" />
  </div>
</template>
