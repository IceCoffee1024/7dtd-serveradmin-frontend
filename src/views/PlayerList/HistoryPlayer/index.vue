<script setup lang="ts">
import type { MyTableColumn, MyTableFetchParams, MyTableFetchResult } from '~/composables/table';
import type {
  HistoryPlayerDto,
  HistoryPlayerQueryOrder,
  PositionDto,
} from '~/generated/api/types.gen';
import type { ContextMenuOption } from '~/plugins/contextMenu';
import { useQueryCache } from '@pinia/colada';
import dayjs from 'dayjs';
import { useI18n } from 'vue-i18n';
import serverFavoriteImgUrl from '~/assets/images/server_favorite.png';
import { gameServerGetHistoryPlayersQuery } from '~/generated/api/@pinia/colada.gen';
import { formatPosition } from '~/utils';

type HistoryPlayerRow = HistoryPlayerDto;

const { t } = useI18n();
const queryCache = useQueryCache();

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
  { prop: 'position', label: t('views.playerList.position'), slot: 'position', exportFormatter: value => formatPosition(value as PositionDto | null | undefined) },
  { prop: 'permissionLevel', label: t('views.playerList.permissionLevel'), sortable: true },
  { prop: 'bedroll', label: t('views.playerList.bedroll'), slot: 'bedroll', exportFormatter: value => formatPosition(value as PositionDto | null | undefined) },
  { prop: 'playerId', label: t('views.playerList.playerId') },
  { prop: 'platformId', label: t('views.playerList.platformId') },
  { prop: 'playGroup', label: t('views.playerList.playGroup'), sortable: true },
]);

const playerInventoryDialogRef = useTemplateRef('playerInventoryDialogRef');
const playerSkillsDialogRef = useTemplateRef('playerSkillsDialogRef');
const playerDetailsDialogRef = useTemplateRef('playerDetailsDialogRef');

async function fetchData(params: MyTableFetchParams): Promise<MyTableFetchResult<HistoryPlayerRow>> {
  const options = gameServerGetHistoryPlayersQuery({
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

  return {
    list: response?.items ?? [],
    total: response?.total ?? 0,
  };
}

function toOrder(sortField: string | undefined): HistoryPlayerQueryOrder | undefined {
  switch (sortField) {
    case 'entityId': return 'EntityId';
    case 'playerName': return 'PlayerName';
    case 'permissionLevel': return 'PermissionLevel';
    case 'isOffline': return 'IsOffline';
    case 'playGroup': return 'PlayGroup';
    case 'lastLogin': return 'LastLogin';
    default: return undefined;
  }
}

function formatTimestamp(value: string | null | undefined): string {
  return value ? dayjs(value).format('YYYY-MM-DD HH:mm:ss') : '--';
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
  <div class="h-full">
    <MyTable
      row-key="playerId"
      :columns="columns"
      :fetch-data="fetchData"
      :context-menu-items="contextMenuItems"
      :show-add-btn="false"
      :selectable="false"
      :operation-column-width="110"
      :auto-column-width="true"
    >
      <template #playerName="{ row }">
        <span class="flex gap-1 items-center">
          <span>{{ row.playerName }}</span>
          <img v-if="row.isAdmin" :src="serverFavoriteImgUrl" width="20" :title="t('views.playerList.admin')">
        </span>
      </template>
      <template #lastLogin="{ row }">
        {{ formatTimestamp(row.lastLogin) }}
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
