<script setup lang="ts">
import type { MyTableColumn, MyTableFetchParams, MyTableFetchResult } from '~/composables/table';
import { useI18n } from 'vue-i18n';
import * as api from '~/api/coloredChat';
import { usePopup } from '~/composables';
import { markIcon } from '~/utils';
import AddOrEditDialog from './AddOrEditDialog.vue';

defineOptions({ name: 'ColoredProfilesPage' });

type ColoredProfileRow = API.ColoredChat.Profile;

const tableRef = useTemplateRef('tableRef');
const addOrEditDialogRef = useTemplateRef('addOrEditDialogRef');
const { t } = useI18n();
const { confirm } = usePopup();
const editData = ref<ColoredProfileRow | null>(null);

const columns = computed<MyTableColumn<ColoredProfileRow>[]>(() => [
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
  { prop: 'playerId', label: t('views.coloredChat.profiles.fields.playerId'), sortable: true },
  { prop: 'customName', label: t('views.coloredChat.profiles.fields.customName'), sortable: true },
  { prop: 'nameColor', label: t('views.coloredChat.profiles.fields.nameColor') },
  { prop: 'textColor', label: t('views.coloredChat.profiles.fields.textColor') },
  { prop: 'description', label: t('views.coloredChat.profiles.fields.description') },
  { prop: 'createdAt', label: t('views.coloredChat.profiles.fields.createdAt'), sortable: true },
]);

const selectedRows = ref<ColoredProfileRow[]>([]);

async function fetchData(params: MyTableFetchParams): Promise<MyTableFetchResult<ColoredProfileRow>> {
  const response = await api.getProfiles({
    pageNumber: params.pageNumber,
    pageSize: params.pageSize,
    keyword: params.search?.keyword?.trim() || params.searchQuery?.trim() || undefined,
    order: params.sortField === 'createdAt'
      ? 'CreatedAt'
      : params.sortField === 'playerId'
        ? 'PlayerId'
        : params.sortField === 'customName'
          ? 'CustomName'
          : undefined,
    desc: params.sortOrder === 'descending',
  });

  return {
    list: response.items,
    total: response.total,
  };
}

const batchMenuItems = computed(() => [
  {
    icon: markIcon(() => import('~icons/mdi/delete-sweep')),
    label: t('common.batchDelete'),
    disabled: selectedRows.value.length === 0,
    action: async () => {
      if (await confirm()) {
        await api.deleteProfiles(selectedRows.value.map(row => row.playerId));
        tableRef.value?.reload();
      }
    },
  },
]);

function onAdd() {
  editData.value = null;
  addOrEditDialogRef.value?.show();
}

function onEdit(rowData: ColoredProfileRow) {
  editData.value = rowData;
  addOrEditDialogRef.value?.show();
}

async function onDelete(rowData: ColoredProfileRow) {
  await api.deleteProfiles([rowData.playerId]);
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
    />
    <AddOrEditDialog ref="addOrEditDialogRef" :edit-data="editData" @saved="onSaved" />
  </div>
</template>
