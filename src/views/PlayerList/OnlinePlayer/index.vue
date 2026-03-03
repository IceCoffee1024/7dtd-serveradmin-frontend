<script setup lang="ts">
import type { MyTableFetchResult } from '~/composables/useMyTable';
import { useI18n } from 'vue-i18n';
import { getOnlinePlayers } from '~/api/gameServer';
import serverFavoriteImgUrl from '~/assets/images/server_favorite.png';
import { formatPosition } from '~/utils';

const tableRef = ref();
const { t } = useI18n();
const columns = computed(() => [
  { field: 'playerName', header: t('views.playerList.playerName'), sortable: true, frozen: true, class: 'min-w-40' },
  { field: 'entityId', header: t('views.playerList.entityId'), sortable: true, class: 'min-w-30' },
  { field: 'level', header: t('views.playerList.level'), sortable: true, class: 'min-w-30' },
  { field: 'gameStage', header: t('views.playerList.gameStage'), sortable: true, class: 'min-w-40' },
  { field: 'zombieKills', header: t('views.playerList.zombieKills'), sortable: true, class: 'min-w-40' },
  { field: 'playerKills', header: t('views.playerList.playerKills'), sortable: true, class: 'min-w-40' },
  { field: 'deaths', header: t('views.playerList.deaths'), sortable: true, class: 'min-w-30' },
  { field: 'ip', header: t('views.playerList.ip'), class: 'min-w-45' },
  { field: 'ping', header: t('views.playerList.ping'), sortable: true, class: 'min-w-30' },
  { field: 'position', header: t('views.playerList.position'), class: 'min-w-40' },
  { field: 'expToNextLevel', header: t('views.playerList.expToNextLevel'), class: 'min-w-40' },
  { field: 'skillPoints', header: t('views.playerList.skillPoints'), sortable: true, class: 'min-w-40' },
  { field: 'isTwitchEnabled', header: t('views.playerList.isTwitchEnabled'), class: 'min-w-40' },
  { field: 'playerId', header: t('views.playerList.playerId'), class: 'min-w-40' },
  { field: 'platformId', header: t('views.playerList.platformId'), class: 'min-w-40' },
  { field: 'permissionLevel', header: t('views.playerList.permissionLevel'), sortable: true, class: 'min-w-45' },
]);

const selectedRows = ref<API.GameServer.OnlinePlayer[]>([]);

async function fetchData(params: { pageNumber: number; pageSize: number; order: string | null; desc: boolean; keyword: string }) {
  const response = await getOnlinePlayers({
    ...params,
    order: (params.order ?? undefined) as API.GameServer.OnlinePlayerQuery['order'],
  });

  return {
    items: response.items as unknown as Array<Record<string, unknown>>,
    total: response.total,
  } as MyTableFetchResult<Record<string, unknown>>;
}

const batchMenuItems = ref([]);
const playerInventoryDialogRef = ref();
const playerSkillsDialogRef = ref();
const playerDetailsDialogRef = ref();

const contextMenuItems = computed(() => [
  {
    label: t('views.playerList.viewInventory'),
    command: (rowData?: Record<string, unknown>) => {
      const row = rowData as API.GameServer.OnlinePlayer | undefined;
      if (!row) {
        return;
      }
      playerInventoryDialogRef.value.show(row.playerId, row.playerName);
    },
  },
  {
    label: t('views.playerList.viewSkills'),
    command: (rowData?: Record<string, unknown>) => {
      const row = rowData as API.GameServer.OnlinePlayer | undefined;
      if (!row) {
        return;
      }
      playerSkillsDialogRef.value.show(row.playerId, row.playerName);
    },
  },
  {
    label: t('views.playerList.viewDetails'),
    command: (rowData?: Record<string, unknown>) => {
      const row = rowData as API.GameServer.OnlinePlayer | undefined;
      if (!row) {
        return;
      }
      playerDetailsDialogRef.value.show(row.playerId, row.playerName);
    },
  },
]);
</script>

<template>
  <div class="h-[calc(100vh-250px)]">
    <MyTable
      ref="tableRef"
      v-model:selection="selectedRows"
      data-key="playerId"
      :columns="columns"
      :fetch-data="fetchData"
      :batch-menu-items="batchMenuItems"
      :is-show-edit-btn="false"
      :is-show-delete-btn="false"
      :context-menu-items="contextMenuItems"
      :auto-refresh-interval="10"
      :is-show-add-btn="false"
    >
      <template #playerName-body="{ data }">
        <span class="flex items-center">
          {{ data.playerName }}
          <img v-if="data.isAdmin" :src="serverFavoriteImgUrl" width="20" :title="$t('views.playerList.admin')">
        </span>
      </template>
      <template #position-body="{ data }">
        {{ formatPosition(data.position) }}
      </template>
      <template #isTwitchEnabled-body="{ data }">
        {{ data.isTwitchEnabled ? $t('common.yes') : $t('common.no') }}
      </template>
    </MyTable>
    <PlayerInventoryDialog ref="playerInventoryDialogRef" />
    <PlayerSkillsDialog ref="playerSkillsDialogRef" />
    <PlayerDetailsDialog ref="playerDetailsDialogRef" />
  </div>
</template>
