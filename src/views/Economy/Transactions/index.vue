<script setup lang="ts">
import type { MyTableColumn, MyTableFetchParams, MyTableFetchResult } from '~/composables/table';
import dayjs from 'dayjs';
import { useI18n } from 'vue-i18n';
import * as api from '~/api/economy';
import { usePopup } from '~/composables/usePopup';
import DetailDialog from './DetailDialog.vue';

defineOptions({ name: 'EconomyTransactionsPage' });

type TransactionRow = API.Economy.Transaction;

const { t } = useI18n();
const { toast } = usePopup();
const detailDialogRef = useTemplateRef('detailDialogRef');
const detailRow = ref<TransactionRow | null>(null);

/** Mirrors the most-recently applied search filters so the export button can use the same criteria. */
const currentFilters = ref<Omit<API.Economy.TransactionQuery, 'pageNumber' | 'pageSize' | 'order' | 'desc'>>({});
const exporting = ref(false);

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
      el: 'el-select',
      options: [
        { label: t('views.economy.transactions.typeOptions.adminGrant'), value: 'AdminGrant' },
        { label: t('views.economy.transactions.typeOptions.adminDeduct'), value: 'AdminDeduct' },
        { label: t('views.economy.transactions.typeOptions.transferOut'), value: 'TransferOut' },
        { label: t('views.economy.transactions.typeOptions.transferIn'), value: 'TransferIn' },
        { label: t('views.economy.transactions.typeOptions.dailyReward'), value: 'DailyReward' },
        { label: t('views.economy.transactions.typeOptions.tax'), value: 'Tax' },
      ],
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
]);

async function fetchData(params: MyTableFetchParams): Promise<MyTableFetchResult<TransactionRow>> {
  // Snapshot current filters for the CSV export action.
  currentFilters.value = {
    keyword: params.search?.keyword?.trim() || undefined,
    playerId: toOptionalString(params.search?.playerId),
    playerName: toOptionalString(params.search?.playerName),
    type: toOptionalString(params.search?.type) as API.Economy.TransactionType | undefined,
    source: toOptionalString(params.search?.source),
    startTime: toOptionalString(params.search?.startTime),
    endTime: toOptionalString(params.search?.endTime),
  };

  const response = await api.getTransactions({
    ...currentFilters.value,
    pageNumber: params.pageNumber,
    pageSize: params.pageSize,
    order: toOrder(params.sortField),
    desc: params.sortOrder === 'descending',
  });

  return {
    list: response.items,
    total: response.total,
  };
}

async function onExport() {
  exporting.value = true;
  try {
    const blob = await api.exportTransactions(currentFilters.value);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions_${dayjs().format('YYYYMMDD_HHmmss')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ type: 'success', text: t('views.economy.transactions.messages.exportSuccess') });
  }
  catch {
    toast({ type: 'error', text: t('views.economy.transactions.messages.exportError') });
  }
  finally {
    exporting.value = false;
  }
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
  detailRow.value = row;
  detailDialogRef.value?.show();
}
</script>

<template>
  <div class="flex flex-col gap-4 h-full min-h-0">
    <MyTable
      row-key="id"
      :columns="columns"
      :fetch-data="fetchData"
      :is-selectable="false"
      :show-add-btn="false"
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
        <span class="text-xs text-gray-700 font-mono dark:text-gray-200">{{ formatTimestamp(row.occurredAt) }}</span>
      </template>

      <template #toolbar-right>
        <IconButton
          :tooltip-content="t('views.economy.transactions.exportCsv')"
          :loading="exporting"
          button-size="small"
          plain
          @click="onExport"
        >
          <icon-mdi-download />
        </IconButton>
      </template>

      <template #operation="{ row }">
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
