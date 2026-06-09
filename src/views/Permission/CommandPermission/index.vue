<script setup lang="ts">
import type { MyTableColumn, MyTableFetchParams, MyTableFetchResult } from '~/composables/table';
import type { CommandPermissionDto } from '~/generated/api/types.gen';
import { useMutation, useQueryCache } from '@pinia/colada';
import { useI18n } from 'vue-i18n';
import { usePopup } from '~/composables';
import {
  gameServerGetCommandPermissionsQuery,
  gameServerRemoveCommandPermissionsMutation,
} from '~/generated/api/@pinia/colada.gen';
import { invalidateGeneratedQueries } from '~/queries/generated';
import { markIcon } from '~/utils';
import { orderByField, searchByKeyword } from '~/utils/index';
import AddOrEditDialog from './AddOrEditDialog/index.vue';

type CommandPermissionRow = CommandPermissionDto;

const tableRef = useTemplateRef('tableRef');
const addOrEditDialogRef = useTemplateRef('addOrEditDialogRef');
const { t } = useI18n();
const { confirm } = usePopup();
const editData = ref<CommandPermissionRow | null>(null);
const queryCache = useQueryCache();
const removeCommandPermissionsMutation = useMutation({
  ...gameServerRemoveCommandPermissionsMutation(),
  async onSettled() {
    await invalidateGeneratedQueries('GameServer');
  },
});

const columns = computed<MyTableColumn<CommandPermissionRow>[]>(() => [
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
  { prop: 'command', label: t('views.permission.command') },
  { prop: 'permissionLevel', label: t('views.permission.permissionLevel'), sortable: true },
  { prop: 'description', label: t('views.permission.description') },
]);

const selectedRows = ref<CommandPermissionRow[]>([]);

async function fetchData(params: MyTableFetchParams): Promise<MyTableFetchResult<CommandPermissionRow>> {
  const options = gameServerGetCommandPermissionsQuery();
  const entry = queryCache.ensure(options);
  const state = await queryCache.fetch(entry);

  if (state.status === 'error') {
    throw state.error;
  }

  const response = state.data ?? [];
  const keyword = params.search?.keyword?.trim() || '';
  const filteredList = searchByKeyword(response, keyword, ['command', 'description']);
  const data = orderByField(
    filteredList,
    params.sortField ?? '',
    params.sortOrder === 'descending',
  );
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
        await removeCommandPermissionsMutation.mutateAsync({ body: selectedRows.value.map(row => row.command) });
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
  await removeCommandPermissionsMutation.mutateAsync({ body: [rowData.command] });
  tableRef.value?.reload();
}

function onSaved() {
  tableRef.value?.reload();
  editData.value = null;
}
</script>

<template>
  <div class="flex flex-col h-full min-h-0">
    <div class="flex flex-1 min-h-0">
      <MyTable
        ref="tableRef"
        v-model:selection="selectedRows"
        row-key="command"
        :columns="columns"
        :fetch-data="fetchData"
        :batch-menu-items="batchMenuItems"
        :show-index="true"
        :auto-column-width="true"
        show-edit-btn
        show-delete-btn
        @add="onAdd"
        @edit="onEdit"
        @delete="onDelete"
      />
    </div>
    <AddOrEditDialog ref="addOrEditDialogRef" :edit-data="editData" @saved="onSaved" />
  </div>
</template>
