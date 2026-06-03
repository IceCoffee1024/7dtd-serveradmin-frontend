<script setup lang="ts">
import type { MyTableColumn, MyTableFetchParams, MyTableFetchResult } from '~/composables/table';
import type { WhitelistEntryDto } from '~/generated/api/types.gen';
import { useMutation, useQueryCache } from '@pinia/colada';
import { useI18n } from 'vue-i18n';
import { usePopup } from '~/composables';
import {
  gameServerGetWhitelistEntriesQuery,
  gameServerRemoveWhitelistEntriesMutation,
} from '~/generated/api/@pinia/colada.gen';
import { invalidateGeneratedQueries } from '~/queries/generated';
import { markIcon } from '~/utils';
import { orderByField, searchByKeyword } from '~/utils/index';
import AddOrEditDialog from './AddOrEditDialog/index.vue';

type WhitelistEntryRow = WhitelistEntryDto;

const tableRef = useTemplateRef('tableRef');
const addOrEditDialogRef = useTemplateRef('addOrEditDialogRef');
const { t } = useI18n();
const { confirm } = usePopup();
const editData = ref<WhitelistEntryRow | null>(null);
const queryCache = useQueryCache();
const removeWhitelistEntriesMutation = useMutation({
  ...gameServerRemoveWhitelistEntriesMutation(),
  async onSettled() {
    await invalidateGeneratedQueries('GameServer');
  },
});

const columns = computed<MyTableColumn<WhitelistEntryRow>[]>(() => [
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
  { prop: 'playerId', label: t('views.banWhitelist.playerId') },
  { prop: 'displayName', label: t('views.banWhitelist.displayName'), sortable: true },
]);

const selectedRows = ref<WhitelistEntryRow[]>([]);

async function fetchData(params: MyTableFetchParams): Promise<MyTableFetchResult<WhitelistEntryRow>> {
  const options = gameServerGetWhitelistEntriesQuery();
  const entry = queryCache.ensure(options);
  const state = await queryCache.fetch(entry);

  if (state.status === 'error') {
    throw state.error;
  }

  let data = state.data ?? [];
  const keyword = params.search?.keyword?.trim() || '';
  data = searchByKeyword(data, keyword, ['playerId', 'displayName']);
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
        await removeWhitelistEntriesMutation.mutateAsync({ body: selectedRows.value.map(row => row.playerId) });
        tableRef.value?.reload();
      }
    },
  },
]);

function onAdd() {
  editData.value = null;
  addOrEditDialogRef.value?.show();
}

function onEdit(rowData: WhitelistEntryRow) {
  editData.value = rowData;
  addOrEditDialogRef.value?.show();
}

async function onDelete(rowData: WhitelistEntryRow) {
  await removeWhitelistEntriesMutation.mutateAsync({ body: [rowData.playerId] });
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
      :show-index="true"
      :auto-column-width="true"
      show-edit-btn
      show-delete-btn
      @add="onAdd"
      @edit="onEdit"
      @delete="onDelete"
    />
    <AddOrEditDialog ref="addOrEditDialogRef" :edit-data="editData" @saved="onSaved" />
  </div>
</template>
