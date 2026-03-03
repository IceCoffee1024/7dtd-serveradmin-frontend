<script setup lang="ts">
import type { MyTableFetchResult } from '~/composables/useMyTable';
import dayjs from 'dayjs';
import { useI18n } from 'vue-i18n';
import { getHistoryPlayers } from '~/api/gameServer';
import serverFavoriteImgUrl from '~/assets/images/server_favorite.png';
import { formatPosition } from '~/utils';

const tableRef = ref(null);
const { t } = useI18n();
const columns = computed(() => [
  { field: 'playerName', header: t('views.playerList.playerName'), sortable: true, frozen: true, class: 'min-w-40' },
  { field: 'isOffline', header: t('views.playerList.status'), sortable: true, class: 'min-w-30' },
  // { field: 'entityId', header: t('views.playerList.entityId'), sortable: true, class: 'min-w-30' },
  { field: 'playGroup', header: t('views.playerList.playGroup'), sortable: true, class: 'min-w-35' },
  { field: 'lastLogin', header: t('views.playerList.lastLogin'), sortable: true, class: 'min-w-45' },
  { field: 'position', header: t('views.playerList.position'), class: 'min-w-40' },
  { field: 'playerId', header: t('views.playerList.playerId') },
  { field: 'platformId', header: t('views.playerList.platformId') },
  { field: 'permissionLevel', header: t('views.playerList.permissionLevel'), sortable: true, class: 'min-w-45' },
  { field: 'bedroll', header: t('views.playerList.bedroll'), class: 'min-w-40' },
]);

const selectedRows = ref<API.GameServer.HistoryPlayer[]>([]);

async function fetchData(params: { pageNumber: number; pageSize: number; order: string | null; desc: boolean; keyword: string }) {
  const response = await getHistoryPlayers({
    ...params,
    order: (params.order ?? undefined) as API.GameServer.HistoryPlayerQuery['order'],
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
      const row = rowData as API.GameServer.HistoryPlayer | undefined;
      if (!row) {
        return;
      }
      playerInventoryDialogRef.value.show(row.playerId, row.playerName);
    },
  },
  {
    label: t('views.playerList.viewSkills'),
    command: (rowData?: Record<string, unknown>) => {
      const row = rowData as API.GameServer.HistoryPlayer | undefined;
      if (!row) {
        return;
      }
      playerSkillsDialogRef.value.show(row.playerId, row.playerName);
    },
  },
  {
    label: t('views.playerList.viewDetails'),
    command: (rowData?: Record<string, unknown>) => {
      const row = rowData as API.GameServer.HistoryPlayer | undefined;
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
      :is-show-add-btn="false"
    >
      <template #playerName-body="{ data }">
        <span class="flex items-center">
          {{ data.playerName }}
          <img v-if="data.isAdmin" :src="serverFavoriteImgUrl" width="20" :title="$t('views.playerList.admin')">
        </span>
      </template>
      <template #lastLogin-body="{ data }">
        {{ dayjs(data.lastLogin).format() }}
      </template>
      <template #position-body="{ data }">
        {{ formatPosition(data.position) }}
      </template>
      <template #bedroll-body="{ data }">
        {{ formatPosition(data.bedroll) }}
      </template>
      <template #isOffline-body="{ data }">
        <el-tag :type="data.isOffline ? 'danger' : 'success'">
          {{ data.isOffline ? $t('common.offline') : $t('common.online') }}
        </el-tag>
      </template>
    </MyTable>
    <PlayerInventoryDialog ref="playerInventoryDialogRef" />
    <PlayerSkillsDialog ref="playerSkillsDialogRef" />
    <PlayerDetailsDialog ref="playerDetailsDialogRef" />
  </div>
</template>
