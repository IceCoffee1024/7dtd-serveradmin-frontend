<script setup lang="ts">
import type { MyTableColumn, MyTableFetchParams, MyTableFetchResult } from '~/composables/useMyTable';
import { useI18n } from 'vue-i18n';
import * as api from '~/api/gameServer';
import { usePopup } from '~/composables';
import { markIcon } from '~/utils';
import { orderByField, searchByKeyword } from '~/utils/index';
import AddOrEditDialog from './AddOrEditDialog/index.vue';

type CommandPermissionRow = API.GameServer.CommandPermission;

const tableRef = useTemplateRef('tableRef');
const addOrEditDialogRef = useTemplateRef('addOrEditDialogRef');
const { t } = useI18n();
const { confirm } = usePopup();
const editData = ref<CommandPermissionRow | null>(null);

const columns = computed<MyTableColumn<CommandPermissionRow>[]>(() => [
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
  { prop: 'command', label: t('views.permission.command') },
  { prop: 'permissionLevel', label: t('views.permission.permissionLevel'), sortable: true },
  { prop: 'description', label: t('views.permission.description') },
]);

const selectedRows = ref<CommandPermissionRow[]>([]);

async function fetchData(params: MyTableFetchParams): Promise<MyTableFetchResult<CommandPermissionRow>> {
  const response = await api.getCommandPermissions(params);
  const keyword = params.search?.keyword?.trim() || params.searchQuery?.trim() || '';
  const transform = (list: CommandPermissionRow[]) => orderByField(
    searchByKeyword(list, keyword, ['command', 'description']),
    params.sortField ?? '',
    params.sortOrder === 'descending',
  );

  if (response?.items && Array.isArray(response.items)) {
    const items = transform(response.items);
    return {
      list: items,
      total: response.total ?? items.length,
    };
  }

  if (response?.data && Array.isArray(response.data)) {
    const items = transform(response.data);
    return {
      list: items,
      total: response.total ?? items.length,
    };
  }

  const list = Array.isArray(response) ? response : [];
  const data = transform(list);
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
        await api.deleteCommandPermissions(selectedRows.value.map(row => row.command));
        tableRef.value?.reload();
      }
    },
  },
]);

function onAdd() {
  editData.value = null;
  addOrEditDialogRef.value?.show();
}

function onEdit(rowData: CommandPermissionRow) {
  editData.value = rowData;
  addOrEditDialogRef.value?.show();
}

async function onDelete(rowData: CommandPermissionRow) {
  await api.deleteCommandPermissions([rowData.command]);
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
      row-key="command"
      :columns="columns"
      :fetch-data="fetchData"
      :batch-menu-items="batchMenuItems"
      :is-show-index="true"
      :auto-column-width="true"
      @add="onAdd"
      @edit="onEdit"
      @delete="onDelete"
    />
    <AddOrEditDialog ref="addOrEditDialogRef" :edit-data="editData" @saved="onSaved" />
  </div>
</template>
