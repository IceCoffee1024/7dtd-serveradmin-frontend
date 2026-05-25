<script setup lang="ts">
import type { MyTableColumn, MyTableFetchParams, MyTableFetchResult } from '~/composables/table';
import dayjs from 'dayjs';
import { useI18n } from 'vue-i18n';
import * as api from '~/api/achievement';
import { usePopup } from '~/composables';

defineOptions({ name: 'AchievementRecordsPage' });

type RecordRow = API.Achievement.RecordDto;

const { t } = useI18n();
const { toast, confirm } = usePopup();

const tableRef = useTemplateRef('tableRef');

const columns = computed<MyTableColumn<RecordRow>[]>(() => [
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
  {
    prop: 'achievementName',
    label: t('views.achievement.records.columns.achievementName'),
    sortable: true,
    minWidth: 140,
    search: {
      el: 'el-input',
      props: { clearable: true },
      order: 1,
      span: 6,
    },
  },
  {
    prop: 'playerName',
    label: t('views.achievement.records.columns.playerName'),
    sortable: true,
    minWidth: 120,
    search: {
      el: 'el-input',
      props: { clearable: true },
      order: 2,
      span: 6,
    },
  },
  {
    prop: 'playerId',
    label: t('views.achievement.records.columns.playerId'),
    sortable: true,
    minWidth: 160,
    search: {
      el: 'el-input',
      props: { clearable: true },
      order: 3,
      span: 6,
    },
  },
  {
    prop: 'economyRewarded',
    label: t('views.achievement.records.columns.economyRewarded'),
    slot: 'economyRewarded',
    sortable: true,
    width: 130,
    align: 'right',
  },
  {
    prop: 'createdAt',
    label: t('views.achievement.records.columns.createdAt'),
    slot: 'createdAt',
    sortable: true,
    width: 160,
  },
]);

type RecordQueryOrder = 'AchievementName' | 'PlayerName' | 'PlayerId' | 'EconomyRewarded' | 'CreatedAt';

function toOrder(sortField: string | undefined): RecordQueryOrder | undefined {
  switch (sortField) {
    case 'achievementName': return 'AchievementName';
    case 'playerName': return 'PlayerName';
    case 'playerId': return 'PlayerId';
    case 'economyRewarded': return 'EconomyRewarded';
    case 'createdAt': return 'CreatedAt';
    default: return undefined;
  }
}

async function fetchData(params: MyTableFetchParams): Promise<MyTableFetchResult<RecordRow>> {
  const response = await api.getRecords({
    pageNumber: params.pageNumber,
    pageSize: params.pageSize,
    keyword: params.search?.keyword?.trim() || undefined,
    playerId: typeof params.search?.playerId === 'string' ? params.search.playerId.trim() || undefined : undefined,
    order: toOrder(params.sortField),
    desc: params.sortOrder === 'descending',
  });
  return { list: response.items, total: response.total };
}

async function onDelete(row: RecordRow) {
  const confirmed = await confirm({
    text: t('views.achievement.records.actions.deleteConfirm'),
    type: 'warning',
  });
  if (!confirmed) {
    return;
  }

  try {
    await api.deleteRecord(row.id);
    toast({ type: 'success', text: t('views.achievement.records.messages.deleteSuccess') });
    tableRef.value?.reload();
  }
  catch (error) {
    console.error(error);
  }
}
</script>

<template>
  <div>
    <MyTable
      ref="tableRef"
      row-key="id"
      :columns="columns"
      :fetch-data="fetchData"
      :selectable="false"
      :operation-column-width="100"
      :auto-column-width="true"
      :search-collapsible="true"
      :show-add-btn="false"
    >
      <template #economyRewarded="{ row }">
        <span class="text-amber-600 font-semibold dark:text-amber-400">{{ row.economyRewarded }}</span>
      </template>

      <template #createdAt="{ row }">
        {{ dayjs(row.createdAt).format('YYYY-MM-DD HH:mm:ss') }}
      </template>

      <template #operation="{ row }">
        <el-button size="small" plain type="danger" @click="onDelete(row)">
          {{ t('common.delete') }}
        </el-button>
      </template>
    </MyTable>
  </div>
</template>
