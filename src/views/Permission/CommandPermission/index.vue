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
  { field: 'command', header: t('views.permission.command'), class: 'min-w-40' },
  { field: 'permissionLevel', header: t('views.permission.permissionLevel'), sortable: true, class: 'min-w-50' },
  { field: 'description', header: t('views.permission.description'), class: 'min-w-40' },
]);

const selectedRows = ref<any[]>([]);

async function fetchData(params: any) {
  const response = await api.getCommandPermissions(params);
  const transform = (list: any[]) => orderByField(searchByKeyword(list, params.keyword, ['command', 'description']), params.order, params.desc);

  if (response?.items && Array.isArray(response.items)) {
    const items = transform(response.items);
    return {
      items,
      total: response.total ?? items.length,
    };
  }

  if (response?.data && Array.isArray(response.data)) {
    const items = transform(response.data);
    return {
      items,
      total: response.total ?? items.length,
    };
  }

  const list = Array.isArray(response) ? response : [];
  const data = transform(list);
  return { items: data.slice((params.pageNumber - 1) * params.pageSize, params.pageNumber * params.pageSize), total: data.length };
}

const batchMenuItems = computed(() => [
  {
    icon: markIcon(() => import('~icons/mdi/delete-sweep')),
    label: t('common.batchDelete'),
    disabled: selectedRows.value.length === 0,
    command: async () => {
      if (await confirm()) {
        await api.deleteCommandPermissions(selectedRows.value.map(row => row.command));
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
  await api.deleteCommandPermissions([rowData.command]);
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
      data-key="command"
      :columns="columns"
      :fetch-data="fetchData"
      :batch-menu-items="batchMenuItems"
      is-show-index
      is-show-edit-btn
      is-show-add-btn
      @add="onAdd"
      @edit="onEdit"
      @delete="onDelete"
    />
    <AddOrEditDialog ref="addOrEditDialogRef" :edit-data="editData" @saved="onSaved" />
  </div>
</template>
