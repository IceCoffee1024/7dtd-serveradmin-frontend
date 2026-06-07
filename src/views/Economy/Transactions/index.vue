<script setup lang="ts">
import type { MyTableColumn, MyTableFetchParams, MyTableFetchResult } from '~/composables/table';
import type {
  EconomyTransactionDto,
  EconomyTransactionQueryOrder,
  EconomyTransactionType,
} from '~/generated/api/types.gen';
import type { EconomyTransactionFilters } from '~/queries/economy';
import { useQueryCache } from '@pinia/colada';
import dayjs from 'dayjs';
import { useI18n } from 'vue-i18n';
import { usePlayerProfileNavigation, useRoutePlayerTableSearch } from '~/composables';
import { usePopup } from '~/composables/usePopup';
import { economyTransactionsGetTransactionsQuery } from '~/generated/api/@pinia/colada.gen';
import {

  exportEconomyTransactionsCsv,
} from '~/queries/economy';
import DetailDialog from './DetailDialog.vue';

defineOptions({ name: 'EconomyTransactionsPage' });

type TransactionRow = EconomyTransactionDto;

const { t } = useI18n();
const { toast } = usePopup();
const { viewPlayerProfile } = usePlayerProfileNavigation();
const queryCache = useQueryCache();
const tableRef = useTemplateRef('tableRef');
useRoutePlayerTableSearch(tableRef);
const detailDialogRef = useTemplateRef('detailDialogRef');
const detailRow = ref<TransactionRow | null>(null);

/** Mirrors the most-recently applied search filters so the export button can use the same criteria. */
const currentFilters = ref<EconomyTransactionFilters>({});
const exporting = ref(false);

const overviewItems = computed(() => [
  {
    label: t('views.economy.transactions.columns.type'),
    value: 6,
    tone: 'primary',
  },
  {
    label: t('views.economy.transactions.columns.occurredAt'),
    value: 'UTC',
    tone: 'info',
  },
  {
    label: t('views.economy.transactions.exportCsv'),
    value: 'CSV',
    tone: 'success',
  },
]);

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
    slot: 'playerId',
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
    slot: 'playerName',
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
    type: toOptionalTransactionType(params.search?.type),
    source: toOptionalString(params.search?.source),
    startTime: toOptionalString(params.search?.startTime),
    endTime: toOptionalString(params.search?.endTime),
  };

  const options = economyTransactionsGetTransactionsQuery({
    query: {
      ...currentFilters.value,
      pageNumber: params.pageNumber,
      pageSize: params.pageSize,
      order: toOrder(params.sortField),
      desc: params.sortOrder === 'descending',
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

async function onExport() {
  exporting.value = true;
  try {
    await exportEconomyTransactionsCsv(queryCache, currentFilters.value);
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

function toOptionalTransactionType(value: unknown): EconomyTransactionType | undefined {
  switch (value) {
    case 'AdminGrant':
    case 'AdminDeduct':
    case 'TransferOut':
    case 'TransferIn':
    case 'DailyReward':
    case 'Tax':
      return value;
    default:
      return undefined;
  }
}

function toOrder(sortField: string | undefined): EconomyTransactionQueryOrder | undefined {
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

function onViewPlayerProfile(row: TransactionRow) {
  viewPlayerProfile({ playerId: row.playerId, playerName: row.playerName });
}
</script>

<template>
  <div class="transactions-page">
    <div class="transactions-page__overview">
      <div
        v-for="item in overviewItems"
        :key="item.label"
        class="transactions-page__metric"
        :class="`transactions-page__metric--${item.tone}`"
      >
        <span class="transactions-page__metric-label">{{ item.label }}</span>
        <strong class="transactions-page__metric-value">{{ item.value }}</strong>
      </div>
    </div>

    <MyTable
      ref="tableRef"
      row-key="id"
      :columns="columns"
      :fetch-data="fetchData"
      :selectable="false"
      :show-add-btn="false"
      :auto-column-width="true"
      :search-collapsible="true"
      :operation-column-width="92"
      class="transactions-page__table"
    >
      <template #amount="{ row }">
        <span
          class="transactions-page__amount"
          :class="row.direction === 'Income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'"
        >
          {{ row.direction === 'Income' ? '+' : '-' }}{{ row.amount }}
        </span>
      </template>

      <template #playerId="{ row }">
        <el-button
          v-if="row.playerId"
          type="primary"
          link
          class="transactions-page__mono"
          @click="onViewPlayerProfile(row as TransactionRow)"
        >
          {{ row.playerId }}
        </el-button>
        <span v-else>--</span>
      </template>

      <template #playerName="{ row }">
        <el-button
          v-if="row.playerId"
          type="primary"
          link
          @click="onViewPlayerProfile(row as TransactionRow)"
        >
          {{ row.playerName || row.playerId }}
        </el-button>
        <span v-else>{{ row.playerName || '--' }}</span>
      </template>

      <template #occurredAt="{ row }">
        <span class="transactions-page__mono">{{ formatTimestamp(row.occurredAt) }}</span>
      </template>

      <template #toolbar-right>
        <IconButton
          :tooltip-content="t('views.economy.transactions.exportCsv')"
          :loading="exporting"
          button-size="small"
          round
          border
          @click="onExport"
        >
          <icon-mdi-download />
        </IconButton>
      </template>

      <template #operation="{ row }">
        <IconButton
          round
          border
          button-size="small"
          :tooltip-content="t('components.myTable.view')"
          @click="onView(row as TransactionRow)"
        >
          <icon-mdi-eye-outline />
        </IconButton>
      </template>
    </MyTable>

    <DetailDialog ref="detailDialogRef" :transaction="detailRow" />
  </div>
</template>

<style scoped lang="scss">
.transactions-page {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  height: 100%;
  min-height: 0;
}

.transactions-page__overview {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.9rem;
}

.transactions-page__metric {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  padding: 1rem 1.05rem;
  border: 1px solid color-mix(in srgb, var(--el-border-color-light) 70%, white 30%);
  border-radius: 24px;
  background:
    radial-gradient(circle at top right, color-mix(in srgb, currentColor 9%, transparent), transparent 36%),
    linear-gradient(180deg, color-mix(in srgb, var(--el-bg-color) 97%, white 3%), var(--el-bg-color));
  box-shadow: 0 14px 32px rgba(15, 23, 42, 0.05);
}

.transactions-page__metric--primary {
  color: var(--colors-primary);
}

.transactions-page__metric--info {
  color: #0369a1;
}

.transactions-page__metric--success {
  color: #0f766e;
}

.transactions-page__metric-label {
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.transactions-page__metric-value {
  font-size: 1.5rem;
  line-height: 1;
  color: var(--el-text-color-primary);
}

.transactions-page__table {
  flex: 1;
  min-height: 0;
}

.transactions-page__amount {
  font-weight: 700;
  letter-spacing: 0.01em;
}

.transactions-page__mono {
  font-family: var(--el-font-family-monospace, 'Cascadia Mono', 'Consolas', monospace);
  font-size: 0.76rem;
  color: var(--el-text-color-secondary);
}

@media (max-width: 900px) {
  .transactions-page__overview {
    grid-template-columns: 1fr;
  }
}
</style>
