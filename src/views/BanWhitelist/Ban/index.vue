<script setup lang="ts">
import type { MyTableColumn, MyTableFetchParams, MyTableFetchResult } from '~/composables/useMyTable';
import dayjs from 'dayjs';
import { useI18n } from 'vue-i18n';
import * as api from '~/api/gameServer';
import { usePopup } from '~/composables';
import { markIcon } from '~/utils';
import { orderByField, searchByKeyword } from '~/utils/index';
import AddOrEditDialog from './AddOrEditDialog/index.vue';

type BanEntryRow = API.GameServer.BanEntry;

const tableRef = useTemplateRef('tableRef');
const addOrEditDialogRef = useTemplateRef('addOrEditDialogRef');
const { t } = useI18n();
const { confirm } = usePopup();
const editData = ref<BanEntryRow | null>(null);

const columns = computed<MyTableColumn<BanEntryRow>[]>(() => [
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
  { prop: 'playerId', label: t('views.banWhitelist.playerId') },
  { prop: 'displayName', label: t('views.banWhitelist.displayName'), sortable: true },
  { prop: 'bannedUntil', label: t('views.banWhitelist.bannedUntil'), slot: 'bannedUntil', sortable: true },
  { prop: 'reason', label: t('views.banWhitelist.reason') },
]);

const selectedRows = ref<BanEntryRow[]>([]);

async function fetchData(params: MyTableFetchParams): Promise<MyTableFetchResult<BanEntryRow>> {
  let data = await api.getBannedPlayers(params);
  const keyword = params.search?.keyword?.trim() || params.searchQuery?.trim() || '';
  data = searchByKeyword(data, keyword, ['playerId', 'displayName', 'reason']);
  data = orderByField(data, params.sortField ?? '', params.sortOrder === 'descending');
  return {
    list: data.slice((params.pageNumber - 1) * params.pageSize, params.pageNumber * params.pageSize),
    total: data.length,
  };
}

const batchMenuItems = computed(() => [
  {
    icon: markIcon(() => import('~icons/mdi/delete-sweep')),
    label: t('common.batchDelete'),
    disabled: selectedRows.value.length === 0,
    action: async () => {
      if (await confirm()) {
        await api.unbanPlayers(selectedRows.value.map(row => row.playerId));
        tableRef.value?.reload();
      }
    },
  },
]);

function onAdd() {
  editData.value = null;
  addOrEditDialogRef.value?.show();
}

function onEdit(rowData: BanEntryRow) {
  editData.value = rowData;
  addOrEditDialogRef.value?.show();
}

async function onDelete(rowData: BanEntryRow) {
  await api.unbanPlayers([rowData.playerId]);
  tableRef.value?.reload();
}

function onSaved() {
  tableRef.value?.reload();
  editData.value = null;
}
</script>

<template>
  <div class="h-[calc(100vh-250px)]">
    <MyTable
      ref="tableRef"
      v-model:selection="selectedRows"
      row-key="playerId"
      :columns="columns"
      :fetch-data="fetchData"
      :batch-menu-items="batchMenuItems"
      :is-show-index="true"
      :auto-column-width="true"
      @add="onAdd"
      @edit="onEdit"
      @delete="onDelete"
    >
      <template #bannedUntil="{ row }">
        {{ dayjs(row.bannedUntil).format('YYYY-MM-DD HH:mm:ss') }}
      </template>
    </MyTable>
    <AddOrEditDialog ref="addOrEditDialogRef" :edit-data="editData" @saved="onSaved" />
  </div>
</template>
