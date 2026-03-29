<script setup lang="ts">
import type { MyTableColumn, MyTableFetchParams, MyTableFetchResult } from '~/composables/useMyTable';
import type { ContextMenuOption } from '~/plugins/contextMenu';
import { useI18n } from 'vue-i18n';
import { getOnlinePlayers } from '~/api/gameServer';
import serverFavoriteImgUrl from '~/assets/images/server_favorite.png';
import { formatPosition } from '~/utils';

type OnlinePlayerRow = API.GameServer.OnlinePlayer;

const { t } = useI18n();

const columns = computed<MyTableColumn<OnlinePlayerRow>[]>(() => [
  { prop: 'playerName', label: t('views.playerList.playerName'), slot: 'playerName', sortable: true, fixed: 'left' },
  { prop: 'entityId', label: t('views.playerList.entityId'), sortable: true },
  { prop: 'level', label: t('views.playerList.level'), sortable: true },
  { prop: 'gameStage', label: t('views.playerList.gameStage'), sortable: true },
  { prop: 'zombieKills', label: t('views.playerList.zombieKills'), sortable: true },
  { prop: 'playerKills', label: t('views.playerList.playerKills'), sortable: true },
  { prop: 'deaths', label: t('views.playerList.deaths'), sortable: true },
  { prop: 'ip', label: t('views.playerList.ip') },
  { prop: 'ping', label: t('views.playerList.ping'), sortable: true },
  { prop: 'position', label: t('views.playerList.position'), slot: 'position' },
  { prop: 'expToNextLevel', label: t('views.playerList.expToNextLevel') },
  { prop: 'skillPoints', label: t('views.playerList.skillPoints'), sortable: true },
  { prop: 'isTwitchEnabled', label: t('views.playerList.isTwitchEnabled'), slot: 'isTwitchEnabled' },
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
    keyword: params.searchQuery?.trim() || undefined,
    order: params.sortField as API.GameServer.OnlinePlayerQuery['order'],
    desc: params.sortOrder === 'descending',
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
      playerInventoryDialogRef.value?.show(row.playerId, row.playerName);
    },
  },
  {
    label: t('views.playerList.viewSkills'),
    command: (row) => {
      if (!row)
        return;
      playerSkillsDialogRef.value?.show(row.playerId, row.playerName);
    },
  },
  {
    label: t('views.playerList.viewDetails'),
    command: (row) => {
      if (!row)
        return;
      playerDetailsDialogRef.value?.show(row.playerId, row.playerName);
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
      :auto-refresh-interval="10"
      :is-show-add-btn="false"
      :is-selectable="false"
      :operation-column-width="110"
      :is-show-edit-btn="false"
      :is-show-delete-btn="false"
      :auto-column-width="true"
    >
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
