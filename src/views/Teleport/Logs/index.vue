<script setup lang="ts">
import type { MyTableColumn, MyTableFetchParams, MyTableFetchResult } from '~/composables/table';
import dayjs from 'dayjs';
import { useI18n } from 'vue-i18n';
import { getLogs } from '~/api/teleport';

defineOptions({ name: 'TeleportLogsPage' });

type LogRow = API.Teleport.TeleportLog;

const { t } = useI18n();

const SUB_SYSTEM_TAG_MAP: Record<string, 'success' | 'danger' | 'warning' | 'info' | undefined> = {
  Home: 'success',
  City: 'info',
  Friend: 'warning',
  Back: undefined,
};

const columns = computed<MyTableColumn<LogRow>[]>(() => [
  {
    prop: 'playerId',
    label: t('views.teleport.logs.filters.playerId'),
    show: false,
    exportable: false,
    search: {
      el: 'el-input',
      props: { clearable: true, placeholder: t('views.teleport.logs.placeholders.playerId') },
      order: 1,
      span: 8,
    },
  },
  {
    prop: 'timeRange',
    label: t('views.teleport.logs.filters.timeRange'),
    show: false,
    exportable: false,
    search: {
      el: 'el-date-picker',
      props: {
        clearable: true,
        type: 'datetimerange',
        valueFormat: 'YYYY-MM-DDTHH:mm:ss[Z]',
        startPlaceholder: t('views.teleport.logs.placeholders.timeRange'),
        endPlaceholder: t('views.teleport.logs.placeholders.timeRange'),
      },
      order: 2,
      span: 16,
      transform: (value: string[] | undefined) => ({
        startTime: value?.[0],
        endTime: value?.[1],
      }),
    },
  },
  { prop: 'timestamp', label: t('views.teleport.logs.columns.timestamp'), slot: 'timestamp', sortable: true },
  { prop: 'playerName', label: t('views.teleport.logs.columns.playerName'), sortable: true },
  { prop: 'subSystem', label: t('views.teleport.logs.columns.subSystem'), slot: 'subSystem' },
  { prop: 'fromX', label: t('views.teleport.logs.columns.fromX'), width: 70, align: 'right' },
  { prop: 'fromY', label: t('views.teleport.logs.columns.fromY'), width: 70, align: 'right' },
  { prop: 'fromZ', label: t('views.teleport.logs.columns.fromZ'), width: 70, align: 'right' },
  { prop: 'toX', label: t('views.teleport.logs.columns.toX'), width: 70, align: 'right' },
  { prop: 'toY', label: t('views.teleport.logs.columns.toY'), width: 70, align: 'right' },
  { prop: 'toZ', label: t('views.teleport.logs.columns.toZ'), width: 70, align: 'right' },
  { prop: 'costPaid', label: t('views.teleport.logs.columns.costPaid'), width: 90, align: 'right' },
  { prop: 'remark', label: t('views.teleport.logs.columns.remark'), show: true, showOverflowTooltip: true },
]);

async function fetchData(params: MyTableFetchParams): Promise<MyTableFetchResult<LogRow>> {
  const response = await getLogs({
    pageNumber: params.pageNumber,
    pageSize: params.pageSize,
    playerId: toOptionalString(params.search?.playerId),
    startTime: toOptionalString(params.search?.startTime),
    endTime: toOptionalString(params.search?.endTime),
  });

  return {
    list: response.items,
    total: response.total,
  };
}

function toOptionalString(value: unknown): string | undefined {
  if (typeof value !== 'string')
    return undefined;
  const trimmed = value.trim();
  return trimmed || undefined;
}

function resolveSubSystemTag(subSystem: string): 'success' | 'danger' | 'warning' | 'info' | undefined {
  return SUB_SYSTEM_TAG_MAP[subSystem];
}

function formatTimestamp(value: string): string {
  return dayjs(value).format('YYYY-MM-DD HH:mm:ss');
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <MyTable
      row-key="id"
      :columns="columns"
      :fetch-data="fetchData"
      :show-index="true"
      :show-add-btn="false"
      :auto-column-width="true"
      :search-collapsible="true"
    >
      <template #timestamp="{ row }">
        <span class="text-sm text-gray-700 dark:text-gray-200">{{ formatTimestamp(row.timestamp) }}</span>
      </template>

      <template #subSystem="{ row }">
        <el-tag :type="resolveSubSystemTag(row.subSystem)">
          {{ row.subSystem }}
        </el-tag>
      </template>
    </MyTable>
  </div>
</template>
