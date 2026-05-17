<script setup lang="ts">
import type { MyTableColumn, MyTableFetchParams, MyTableFetchResult } from '~/composables/table';
import dayjs from 'dayjs';
import { useI18n } from 'vue-i18n';
import { getGameEventLogs } from '~/api/gameEventLog';

defineOptions({ name: 'GameEventLogsPage' });

type LogRow = API.GameEventLog.Log;

const { t } = useI18n();

const EVENT_TYPES = ['PlayerJoined', 'PlayerLeft', 'PlayerDied', 'PlayerKilledZombie', 'PlayerKilledPlayer'] as const;

const eventTypeOptions = computed(() =>
  EVENT_TYPES.map(type => ({
    label: t(`views.gameEventLogs.eventTypes.${type}`),
    value: type,
  })),
);

const EVENT_TYPE_TAG_MAP: Record<string, 'success' | 'danger' | 'warning' | 'info' | undefined> = {
  PlayerJoined: 'success',
  PlayerLeft: 'info',
  PlayerDied: 'danger',
  PlayerKilledZombie: 'warning',
  PlayerKilledPlayer: 'danger',
};

const columns = computed<MyTableColumn<LogRow>[]>(() => [
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
    prop: 'eventType',
    label: t('views.gameEventLogs.filters.eventType'),
    slot: 'eventType',
    search: {
      el: 'el-select',
      props: {
        clearable: true,
        placeholder: t('views.gameEventLogs.placeholders.allEventTypes'),
      },
      options: eventTypeOptions,
      order: 1,
      span: 8,
    },
  },
  {
    prop: 'timeRange',
    label: t('views.gameEventLogs.filters.timeRange'),
    show: false,
    exportable: false,
    search: {
      el: 'el-date-picker',
      props: {
        clearable: true,
        type: 'datetimerange',
        valueFormat: 'YYYY-MM-DDTHH:mm:ss[Z]',
        startPlaceholder: t('views.gameEventLogs.placeholders.timeRange'),
        endPlaceholder: t('views.gameEventLogs.placeholders.timeRange'),
      },
      order: 2,
      span: 16,
      transform: (value: string[] | undefined) => ({
        startTime: value?.[0],
        endTime: value?.[1],
      }),
    },
  },
  { prop: 'createdAt', label: t('views.gameEventLogs.columns.createdAt'), slot: 'createdAt', sortable: true },
  { prop: 'playerName', label: t('views.gameEventLogs.columns.playerName'), sortable: true },
  { prop: 'targetPlayerName', label: t('views.gameEventLogs.columns.targetPlayerName') },
  { prop: 'entityType', label: t('views.gameEventLogs.columns.entityType') },
  { prop: 'details', label: 'Details' },
]);

async function fetchData(params: MyTableFetchParams): Promise<MyTableFetchResult<LogRow>> {
  const response = await getGameEventLogs({
    pageNumber: params.pageNumber,
    pageSize: params.pageSize,
    keyword: toOptionalString(params.search?.keyword),
    eventType: toOptionalString(params.search?.eventType),
    startTime: toOptionalString(params.search?.startTime),
    endTime: toOptionalString(params.search?.endTime),
    order: toOrder(params.sortField),
    desc: params.sortOrder === 'descending',
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

function toOrder(sortField: string | undefined): API.GameEventLog.Query['order'] {
  switch (sortField) {
    case 'createdAt':
      return 'CreatedAt';
    case 'eventType':
      return 'EventType';
    case 'playerName':
      return 'PlayerName';
    default:
      return undefined;
  }
}

function resolveEventTypeLabel(eventType: string): string {
  const key = `views.gameEventLogs.eventTypes.${eventType}`;
  const resolved = t(key);
  return resolved === key ? eventType : resolved;
}

function resolveEventTypeTag(eventType: string): 'success' | 'danger' | 'warning' | 'info' | undefined {
  return EVENT_TYPE_TAG_MAP[eventType];
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
      <template #createdAt="{ row }">
        <span class="text-sm text-gray-700 dark:text-gray-200">{{ formatTimestamp(row.createdAt) }}</span>
      </template>

      <template #eventType="{ row }">
        <el-tag :type="resolveEventTypeTag(row.eventType)">
          {{ resolveEventTypeLabel(row.eventType) }}
        </el-tag>
      </template>
    </MyTable>
  </div>
</template>
