<script setup lang="ts">
import dayjs from 'dayjs';
import type { MyTableColumn, MyTableFetchParams, MyTableFetchResult } from '~/composables/table';
import { useI18n } from 'vue-i18n';
import * as api from '~/api/economy';
import DetailDialog from './DetailDialog.vue';

defineOptions({ name: 'EconomyTransactionsPage' });

type TransactionRow = API.Economy.Transaction;

const { t } = useI18n();
const detailDialogRef = useTemplateRef('detailDialogRef');
const detailRow = ref<TransactionRow | null>(null);

const columns = computed<MyTableColumn<TransactionRow>[]>(() => [
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
    prop: 'playerId',
    label: t('views.economy.transactions.columns.playerId'),
    sortable: true,
    search: {
      el: 'el-input',
      props: { clearable: true },
      order: 1,
      span: 6,
    },
  },
  {
    prop: 'playerName',
    label: t('views.economy.transactions.columns.playerName'),
    sortable: true,
    search: {
      el: 'el-input',
      props: { clearable: true },
      order: 2,
      span: 6,
    },
  },
  {
    prop: 'type',
    label: t('views.economy.transactions.columns.type'),
    sortable: true,
    search: {
      el: 'el-input',
      props: { clearable: true },
      order: 3,
      span: 6,
    },
  },
  {
    prop: 'amount',
    label: t('views.economy.transactions.columns.amount'),
    slot: 'amount',
    sortable: true,
  },
  {
    prop: 'source',
    label: t('views.economy.transactions.columns.source'),
    search: {
      el: 'el-input',
      props: { clearable: true },
      order: 4,
      span: 6,
    },
  },
  {
    prop: 'occurredAt',
    label: t('views.economy.transactions.columns.occurredAt'),
    slot: 'occurredAt',
    sortable: true,
    search: {
      el: 'el-date-picker',
      props: {
        clearable: true,
        type: 'datetimerange',
        valueFormat: 'YYYY-MM-DDTHH:mm:ss[Z]',
        startPlaceholder: t('views.economy.transactions.placeholders.occurredAtRange'),
        endPlaceholder: t('views.economy.transactions.placeholders.occurredAtRange'),
      },
      order: 5,
      span: 12,
      transform: (value: string[] | undefined) => ({
        startTime: value?.[0],
        endTime: value?.[1],
      }),
    },
  },
  { prop: 'actions', label: t('components.myTable.operation'), slot: 'actions', exportable: false, className: 'text-center' },
]);

async function fetchData(params: MyTableFetchParams): Promise<MyTableFetchResult<TransactionRow>> {
  const response = await api.getTransactions({
    pageNumber: params.pageNumber,
    pageSize: params.pageSize,
    keyword: params.search?.keyword?.trim() || undefined,
    playerId: toOptionalString(params.search?.playerId),
    playerName: toOptionalString(params.search?.playerName),
    type: toOptionalString(params.search?.type),
    source: toOptionalString(params.search?.source),
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
  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmedValue = value.trim();
  return trimmedValue || undefined;
}

function toOrder(sortField: string | undefined): API.Economy.TransactionQueryOrder | undefined {
  switch (sortField) {
    case 'createdAt':
      return 'CreatedAt';
    case 'occurredAt':
      return 'OccurredAt';
    case 'playerId':
      return 'PlayerId';
    case 'playerName':
      return 'PlayerName';
    case 'amount':
      return 'Amount';
    case 'type':
      return 'Type';
    default:
      return undefined;
  }
}

function formatTimestamp(value: string | null | undefined): string {
  return value ? dayjs(value).format('YYYY-MM-DD HH:mm:ss') : '--';
}

async function onView(row: TransactionRow) {
  detailRow.value = await api.getTransaction(row.id);
  detailDialogRef.value?.show();
}
</script>

<template>
  <div class="flex h-full min-h-0 flex-col gap-4">
    <MyTable
      row-key="id"
      :columns="columns"
      :fetch-data="fetchData"
      :is-selectable="false"
      :show-add-btn="false"
      :show-edit-btn="false"
      :show-delete-btn="false"
      :show-operation-column="false"
      :auto-column-width="true"
      :search-collapsible="true"
      class="flex-1 min-h-0"
    >
      <template #amount="{ row }">
        <span
          class="font-semibold"
          :class="row.direction === 'Income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'"
        >
          {{ row.direction === 'Income' ? '+' : '-' }}{{ row.amount }}
        </span>
      </template>

      <template #occurredAt="{ row }">
        <span class="text-xs font-mono text-gray-700 dark:text-gray-200">{{ formatTimestamp(row.occurredAt) }}</span>
      </template>

      <template #actions="{ row }">
        <div class="flex justify-center">
          <el-button size="small" plain @click="onView(row)">
            {{ t('components.myTable.view') }}
          </el-button>
        </div>
      </template>
    </MyTable>

    <DetailDialog ref="detailDialogRef" :transaction="detailRow" />
  </div>
</template>