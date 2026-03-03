<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import * as api from '~/api/gameServer';
import { usePopup } from '~/composables';
import { markIcon } from '~/utils';
import { orderByField, searchByKeyword } from '~/utils/index';
import AddOrEditDialog from './AddOrEditDialog/index.vue';

const tableRef = ref();
const addOrEditDialogRef = ref();
const { t } = useI18n();
const { confirm } = usePopup();
const editData = ref<any>(null);

const columns = computed(() => [
  { field: 'playerId', header: t('views.banWhitelist.playerId'), class: 'min-w-40' },
  { field: 'displayName', header: t('views.banWhitelist.displayName'), sortable: true, class: 'min-w-40' },
]);

const selectedRows = ref<any[]>([]);

async function fetchData(params: any) {
  let data = await api.getWhitelistedPlayers(params);
  data = searchByKeyword(data, params.keyword, ['playerId', 'displayName']);
  data = orderByField(data, params.order, params.desc);
  return { items: data.slice((params.pageNumber - 1) * params.pageSize, params.pageNumber * params.pageSize), total: data.length };
}

const batchMenuItems = computed(() => [
  {
    icon: markIcon(() => import('~icons/mdi/delete-sweep')),
    label: t('common.batchDelete'),
    disabled: selectedRows.value.length === 0,
    command: async () => {
      if (await confirm()) {
        await api.removePlayerFromWhitelist(selectedRows.value.map(row => row.playerId));
        tableRef.value.reload();
      }
    },
  },
]);

function onAdd() {
  editData.value = null;
  addOrEditDialogRef.value.show();
}

function onEdit(rowData: any) {
  editData.value = rowData;
  addOrEditDialogRef.value.show();
}

async function onDelete(rowData: any) {
  await api.removePlayerFromWhitelist([rowData.playerId]);
  tableRef.value.reload();
}

function onSaved() {
  tableRef.value.reload();
  editData.value = null;
}
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
      is-show-index
      is-show-edit-btn
      @add="onAdd"
      @edit="onEdit"
      @delete="onDelete"
    />
    <AddOrEditDialog ref="addOrEditDialogRef" :edit-data="editData" @saved="onSaved" />
  </div>
</template>
