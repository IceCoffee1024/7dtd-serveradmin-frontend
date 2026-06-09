<script setup lang="ts">
import type { MyTableColumn, MyTableFetchParams, MyTableFetchResult } from '~/composables/table';
import type { TeleportLogDto } from '~/generated/api/types.gen';
import { useQueryCache } from '@pinia/colada';
import dayjs from 'dayjs';
import { useI18n } from 'vue-i18n';
import { usePlayerProfileNavigation, useRoutePlayerTableSearch } from '~/composables';
import { teleportGetLogsQuery } from '~/generated/api/@pinia/colada.gen';

defineOptions({ name: 'TeleportLogsPage' });

type LogRow = TeleportLogDto;

const { t } = useI18n();
const queryCache = useQueryCache();
const { viewPlayerProfile } = usePlayerProfileNavigation();
const tableRef = useTemplateRef('tableRef');
useRoutePlayerTableSearch(tableRef);

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
  { prop: 'playerName', label: t('views.teleport.logs.columns.playerName'), slot: 'playerName', sortable: true },
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
  const options = teleportGetLogsQuery({
    query: {
      pageIndex: params.pageNumber,
      pageSize: params.pageSize,
      playerId: toOptionalString(params.search?.playerId),
      from: toOptionalString(params.search?.startTime),
      to: toOptionalString(params.search?.endTime),
    },
  });
  const entry = queryCache.ensure(options);
  const state = await queryCache.fetch(entry);

  if (state.status === 'error') {
    throw state.error;
  }

  const response = state.data;

  return {
    list: response?.items ?? [],
    total: response?.total ?? 0,
  };
}

function toOptionalString(value: unknown): string | undefined {
  if (typeof value !== 'string')
    return undefined;
  const trimmed = value.trim();
  return trimmed || undefined;
}

function resolveSubSystemTag(subSystem: string | null | undefined): 'success' | 'danger' | 'warning' | 'info' | undefined {
  return subSystem ? SUB_SYSTEM_TAG_MAP[subSystem] : undefined;
}

function formatTimestamp(value: string | null | undefined): string {
  return value ? dayjs(value).format('YYYY-MM-DD HH:mm:ss') : '';
}

function onViewPlayerProfile(row: LogRow) {
  viewPlayerProfile({ playerId: row.playerId, playerName: row.playerName });
}
</script>

<template>
  <div class="flex flex-col gap-4 h-full min-h-0">
    <div class="flex flex-1 min-h-0">
      <MyTable
        ref="tableRef"
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

        <template #playerName="{ row }">
          <el-button
            v-if="row.playerId"
            type="primary"
            link
            @click="onViewPlayerProfile(row as LogRow)"
          >
            {{ row.playerName || row.playerId }}
          </el-button>
          <span v-else>{{ row.playerName || '--' }}</span>
        </template>

        <template #subSystem="{ row }">
          <el-tag :type="resolveSubSystemTag(row.subSystem)">
            {{ row.subSystem }}
          </el-tag>
        </template>
      </MyTable>
    </div>
  </div>
</template>
