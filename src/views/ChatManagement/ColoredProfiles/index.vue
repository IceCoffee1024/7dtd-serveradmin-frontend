<script setup lang="ts">
import type { MyTableColumn, MyTableFetchParams, MyTableFetchResult } from '~/composables/table';
import { useI18n } from 'vue-i18n';
import * as api from '~/api/chat';
import { usePopup } from '~/composables';
import { markIcon } from '~/utils';
import { orderByField, searchByKeyword } from '~/utils/index';
import AddOrEditDialog from './AddOrEditDialog/index.vue';

type ColoredProfileRow = API.Chat.ColoredChatProfile;

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
  { prop: 'playerId', label: t('views.chatManagement.coloredProfiles.fields.playerId') },
  { prop: 'customName', label: t('views.chatManagement.coloredProfiles.fields.customName') },
  { prop: 'nameColor', label: t('views.chatManagement.coloredProfiles.fields.nameColor') },
  { prop: 'textColor', label: t('views.chatManagement.coloredProfiles.fields.textColor') },
  { prop: 'description', label: t('views.chatManagement.coloredProfiles.fields.description') },
  { prop: 'createdAt', label: t('views.chatManagement.coloredProfiles.fields.createdAt'), sortable: true },
]);

const selectedRows = ref<ColoredProfileRow[]>([]);

async function fetchData(params: MyTableFetchParams): Promise<MyTableFetchResult<ColoredProfileRow>> {
  let data = await api.getColoredChatProfiles();
  const keyword = params.search?.keyword?.trim() || params.searchQuery?.trim() || '';
  data = searchByKeyword(data, keyword, ['playerId', 'customName', 'description', 'nameColor', 'textColor']);
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
        await api.deleteColoredChatProfiles(selectedRows.value.map(row => row.playerId));
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
  await api.deleteColoredChatProfiles([rowData.playerId]);
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
