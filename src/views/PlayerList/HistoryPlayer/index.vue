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
import { usePlayerProfileNavigation } from '~/composables';
import { gameServerGetHistoryPlayersQuery } from '~/generated/api/@pinia/colada.gen';
import { formatPosition } from '~/utils';

type HistoryPlayerRow = HistoryPlayerDto;

const { t } = useI18n();
const { viewPlayerProfile } = usePlayerProfileNavigation();
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
    prop: 'isOnline',
    label: t('views.playerList.status'),
    slot: 'isOffline',
    sortable: true,
    exportFormatter: value => (value ? t('common.online') : t('common.offline')),
  },
  {
    prop: 'lastLogin',
    label: t('views.playerList.lastLogin'),
    slot: 'lastLogin',
    sortable: true,
    exportFormatter: value => (value ? dayjs(String(value)).format('YYYY-MM-DD HH:mm:ss') : ''),
  },
  {
    prop: 'lastSeenAt',
    label: t('views.playerProfile.tracking.lastSeenAt'),
    slot: 'lastSeenAt',
    sortable: true,
    exportFormatter: value => (value ? dayjs(String(value)).format('YYYY-MM-DD HH:mm:ss') : ''),
  },
  { prop: 'level', label: t('views.playerList.level'), sortable: true },
  { prop: 'gameStage', label: t('views.playerList.gameStage'), sortable: true },
  { prop: 'zombieKills', label: t('views.playerList.zombieKills'), sortable: true },
  { prop: 'playerKills', label: t('views.playerList.playerKills'), sortable: true },
  { prop: 'deaths', label: t('views.playerList.deaths'), sortable: true },
  {
    prop: 'totalTimePlayed',
    label: t('views.playerList.totalTimePlayed'),
    slot: 'totalTimePlayed',
    sortable: true,
    exportFormatter: value => formatPlayTime(Number(value ?? 0)),
  },
  { prop: 'expToNextLevel', label: t('views.playerList.expToNextLevel'), sortable: true },
  { prop: 'skillPoints', label: t('views.playerList.skillPoints'), sortable: true },
  { prop: 'lastKnownIp', label: t('views.playerList.ip'), sortable: true },
  { prop: 'position', label: t('views.playerList.position'), slot: 'position', exportFormatter: value => formatPosition(value as PositionDto | null | undefined) },
  { prop: 'permissionLevel', label: t('views.playerList.permissionLevel'), sortable: true },
  { prop: 'bedroll', label: t('views.playerList.bedroll'), slot: 'bedroll', exportFormatter: value => formatPosition(value as PositionDto | null | undefined) },
  { prop: 'playerId', label: t('views.playerList.playerId') },
  { prop: 'platformId', label: t('views.playerList.platformId') },
  { prop: 'playGroup', label: t('views.playerList.playGroup'), sortable: true },
  {
    prop: 'updatedAt',
    label: t('views.featureModules.state.updatedAt'),
    slot: 'updatedAt',
    sortable: true,
    exportFormatter: value => (value ? dayjs(String(value)).format('YYYY-MM-DD HH:mm:ss') : ''),
  },
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
    case 'isOnline': return 'IsOnline';
    case 'playGroup': return 'PlayGroup';
    case 'lastLogin': return 'LastLogin';
    case 'lastSeenAt': return 'LastSeenAt';
    case 'level': return 'Level';
    case 'gameStage': return 'GameStage';
    case 'zombieKills': return 'ZombieKills';
    case 'playerKills': return 'PlayerKills';
    case 'deaths': return 'Deaths';
    case 'totalTimePlayed': return 'TotalTimePlayed';
    case 'expToNextLevel': return 'ExpToNextLevel';
    case 'skillPoints': return 'SkillPoints';
    case 'lastKnownIp': return 'LastKnownIp';
    case 'updatedAt': return 'UpdatedAt';
    default: return undefined;
  }
}

function formatTimestamp(value: string | null | undefined): string {
  return value ? dayjs(value).format('YYYY-MM-DD HH:mm:ss') : '--';
}

function formatPlayTime(seconds: number | null | undefined): string {
  const value = Math.max(0, Math.floor(seconds ?? 0));
  const days = Math.floor(value / 86400);
  const hours = Math.floor((value % 86400) / 3600);
  const minutes = Math.floor((value % 3600) / 60);

  if (days > 0)
    return `${days}d ${hours}h`;
  if (hours > 0)
    return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

const contextMenuItems = computed<ContextMenuOption<HistoryPlayerRow>[]>(() => [
  {
    label: t('views.playerList.viewProfile'),
    command: (row) => {
      if (!row)
        return;
      viewPlayerProfile({ playerId: row.playerId, playerName: row.playerName });
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
      <template #lastSeenAt="{ row }">
        {{ formatTimestamp(row.lastSeenAt) }}
      </template>
      <template #updatedAt="{ row }">
        {{ formatTimestamp(row.updatedAt) }}
      </template>
      <template #totalTimePlayed="{ row }">
        {{ formatPlayTime(row.totalTimePlayed) }}
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
