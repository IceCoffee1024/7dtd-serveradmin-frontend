<script setup lang="ts">
import type { MyTableColumn, MyTableFetchParams, MyTableFetchResult } from '~/composables/table';
import type {
  EconomyAccountDto,
  EconomyAccountQueryOrder,
} from '~/generated/api/types.gen';
import type { EconomyLeaderboardRow } from '~/queries/economy';
import { useMutation, useQuery, useQueryCache } from '@pinia/colada';
import dayjs from 'dayjs';
import { useI18n } from 'vue-i18n';
import { usePlayerProfileNavigation, usePopup, useRoutePlayerTableSearch } from '~/composables';
import {
  economyDeleteAccountMutation,
  economyFreezeAccountMutation,
  economyGetAccountsQuery,
  economyGetLeaderboardQuery,
} from '~/generated/api/@pinia/colada.gen';
import {
  invalidateEconomyAndTransactionsQueries,
  toEconomyLeaderboardRows,
} from '~/queries/economy';
import AccountDetailDialog from './AccountDetailDialog.vue';
import AdjustBalanceDialog from './AdjustBalanceDialog.vue';
import BatchAdjustDialog from './BatchAdjustDialog.vue';

defineOptions({ name: 'EconomyAccountsPage' });

type AccountRow = EconomyAccountDto;

const { t } = useI18n();
const { confirm } = usePopup();
const { viewPlayerProfile } = usePlayerProfileNavigation();
const queryCache = useQueryCache();
const tableRef = useTemplateRef('tableRef');
useRoutePlayerTableSearch(tableRef);
const adjustDialogRef = useTemplateRef('adjustDialogRef');
const detailDialogRef = useTemplateRef('detailDialogRef');
const batchAdjustDialogRef = useTemplateRef('batchAdjustDialogRef');
const currentRow = ref<AccountRow | null>(null);
const detailPlayerId = ref('');
const visibleAccounts = ref<AccountRow[]>([]);
const leaderboardQuery = useQuery(economyGetLeaderboardQuery());
const deleteAccountMutation = useMutation({
  ...economyDeleteAccountMutation(),
  async onSettled() {
    await invalidateEconomyAndTransactionsQueries();
  },
});
const freezeAccountMutation = useMutation({
  ...economyFreezeAccountMutation(),
  async onSettled() {
    await invalidateEconomyAndTransactionsQueries();
  },
});
const leaderboard = computed<EconomyLeaderboardRow[]>(() =>
  toEconomyLeaderboardRows(leaderboardQuery.data.value ?? []),
);
const visibleBalance = computed(() =>
  visibleAccounts.value.reduce((sum, item) => sum + Number(item.balance ?? 0), 0),
);
const visibleFrozenCount = computed(() =>
  visibleAccounts.value.filter(item => item.isFrozen).length,
);
const overviewItems = computed(() => [
  {
    label: t('views.economy.accounts.columns.balance'),
    value: visibleBalance.value.toLocaleString(),
    tone: 'primary',
  },
  {
    label: t('views.economy.accounts.columns.isFrozen'),
    value: `${visibleFrozenCount.value}/${visibleAccounts.value.length}`,
    tone: 'danger',
  },
  {
    label: t('views.economy.accounts.leaderboard.title'),
    value: leaderboard.value[0]?.playerName ?? '--',
    tone: 'warning',
  },
]);

const columns = computed<MyTableColumn<AccountRow>[]>(() => [
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
    label: t('views.economy.accounts.columns.playerId'),
    slot: 'playerId',
    sortable: true,
    search: {
      el: 'el-input',
      props: { clearable: true },
      order: 1,
      span: 8,
    },
  },
  {
    prop: 'playerName',
    label: t('views.economy.accounts.columns.playerName'),
    slot: 'playerName',
    sortable: true,
    search: {
      el: 'el-input',
      props: { clearable: true },
      order: 2,
      span: 8,
    },
  },
  {
    prop: 'balance',
    label: t('views.economy.accounts.columns.balance'),
    slot: 'balance',
    sortable: true,
  },
  {
    prop: 'isFrozen',
    label: t('views.economy.accounts.columns.isFrozen'),
    slot: 'isFrozen',
    search: {
      el: 'el-select',
      options: [
        { label: t('common.yes'), value: true },
        { label: t('common.no'), value: false },
      ],
      props: { clearable: true },
      order: 3,
      span: 8,
    },
  },
  {
    prop: 'lastTransactionAt',
    label: t('views.economy.accounts.columns.lastTransactionAt'),
    slot: 'lastTransactionAt',
    sortable: true,
  },
]);

async function fetchData(params: MyTableFetchParams): Promise<MyTableFetchResult<AccountRow>> {
  const options = economyGetAccountsQuery({
    query: {
      pageNumber: params.pageNumber,
      pageSize: params.pageSize,
      keyword: params.search?.keyword?.trim() || undefined,
      playerId: toOptionalString(params.search?.playerId),
      playerName: toOptionalString(params.search?.playerName),
      isFrozen: typeof params.search?.isFrozen === 'boolean' ? params.search.isFrozen : undefined,
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
  visibleAccounts.value = response?.items ?? [];

  return {
    list: response?.items ?? [],
    total: response?.total ?? 0,
  };
}

async function refreshLeaderboard() {
  try {
    const state = await leaderboardQuery.refetch(true);
    if (state.status === 'error') {
      throw state.error;
    }
  }
  catch (error) {
    console.error(error);
  }
}

function toOptionalString(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmedValue = value.trim();
  return trimmedValue || undefined;
}

function toOrder(sortField: string | undefined): EconomyAccountQueryOrder | undefined {
  switch (sortField) {
    case 'playerId':
      return 'PlayerId';
    case 'playerName':
      return 'PlayerName';
    case 'balance':
      return 'Balance';
    case 'lastTransactionAt':
      return 'LastTransactionAt';
    case 'createdAt':
      return 'CreatedAt';
    default:
      return undefined;
  }
}

function formatTimestamp(value: string | null | undefined): string {
  return value ? dayjs(value).format('YYYY-MM-DD HH:mm:ss') : '--';
}

function onBatchAdjust() {
  batchAdjustDialogRef.value?.show();
}

async function onDelete(row: AccountRow) {
  const ok = await confirm({
    type: 'warning',
    text: t('views.economy.accounts.deleteConfirm', { playerName: row.playerName }),
  });
  if (!ok) {
    return;
  }

  try {
    await deleteAccountMutation.mutateAsync({ path: { playerId: row.playerId } });
    tableRef.value?.reload();
    await refreshLeaderboard();
  }
  catch (error) {
    console.error(error);
  }
}

function onAdjust(row: AccountRow) {
  currentRow.value = row;
  adjustDialogRef.value?.show();
}

function onView(row: AccountRow) {
  detailPlayerId.value = row.playerId;
  detailDialogRef.value?.show(row.playerId);
}

function onViewPlayerProfile(row: AccountRow) {
  viewPlayerProfile({ playerId: row.playerId, playerName: row.playerName });
}

async function onToggleFrozen(row: AccountRow) {
  try {
    await freezeAccountMutation.mutateAsync({
      path: { playerId: row.playerId },
      body: { isFrozen: !row.isFrozen },
    });
    tableRef.value?.reload();
    await refreshLeaderboard();
  }
  catch (error) {
    console.error(error);
  }
}

async function onSaved() {
  tableRef.value?.reload();
  await refreshLeaderboard();
}
</script>

<template>
  <div class="accounts-page">
    <div class="accounts-page__overview">
      <div
        v-for="item in overviewItems"
        :key="item.label"
        class="accounts-page__metric"
        :class="`accounts-page__metric--${item.tone}`"
      >
        <span class="accounts-page__metric-label">{{ item.label }}</span>
        <strong class="accounts-page__metric-value">{{ item.value }}</strong>
      </div>
    </div>

    <div class="accounts-page__grid">
      <MyTable
        ref="tableRef"
        row-key="playerId"
        :columns="columns"
        :fetch-data="fetchData"
        :selectable="false"
        :show-add-btn="false"
        :operation-column-width="270"
        :auto-column-width="true"
        :search-collapsible="true"
        class="accounts-page__table"
      >
        <template #toolbar-left>
          <el-button type="primary" class="accounts-page__batch-btn" @click="onBatchAdjust">
            {{ t('views.economy.accounts.actions.batchAdjust') }}
          </el-button>
        </template>

        <template #balance="{ row }">
          <span class="accounts-page__balance">{{ row.balance }}</span>
        </template>

        <template #playerId="{ row }">
          <el-button
            type="primary"
            link
            class="accounts-page__mono"
            @click="onViewPlayerProfile(row as AccountRow)"
          >
            {{ row.playerId }}
          </el-button>
        </template>

        <template #playerName="{ row }">
          <el-button
            type="primary"
            link
            @click="onViewPlayerProfile(row as AccountRow)"
          >
            {{ row.playerName || row.playerId }}
          </el-button>
        </template>

        <template #isFrozen="{ row }">
          <el-tag :type="row.isFrozen ? 'danger' : 'success'" effect="light" round>
            {{ row.isFrozen ? t('common.yes') : t('common.no') }}
          </el-tag>
        </template>

        <template #lastTransactionAt="{ row }">
          <span class="accounts-page__mono">{{ formatTimestamp(row.lastTransactionAt) }}</span>
        </template>

        <template #operation="{ row }">
          <div class="accounts-page__actions">
            <IconButton
              round
              border
              button-size="small"
              :tooltip-content="t('components.myTable.view')"
              @click="onView(row as AccountRow)"
            >
              <icon-mdi-eye-outline />
            </IconButton>
            <IconButton
              round
              border
              button-size="small"
              :tooltip-content="t('views.economy.accounts.actions.adjust')"
              @click="onAdjust(row as AccountRow)"
            >
              <icon-mdi-pencil-outline />
            </IconButton>
            <IconButton
              round
              border
              button-size="small"
              :tooltip-content="row.isFrozen ? t('views.economy.accounts.actions.unfreeze') : t('views.economy.accounts.actions.freeze')"
              @click="onToggleFrozen(row as AccountRow)"
            >
              <icon-mdi-snowflake />
            </IconButton>
            <IconButton
              round
              border
              button-size="small"
              type="danger"
              :tooltip-content="t('views.economy.accounts.actions.delete')"
              @click="onDelete(row as AccountRow)"
            >
              <icon-mdi-delete-outline />
            </IconButton>
          </div>
        </template>
      </MyTable>

      <MyCard
        :header="t('views.economy.accounts.leaderboard.title')"
        compact
        class="accounts-page__leaderboard"
      >
        <template #extra>
          <IconButton
            round
            border
            button-size="small"
            :loading="leaderboardQuery.isPending.value"
            :tooltip-content="t('components.myTable.refresh')"
            @click="refreshLeaderboard"
          >
            <icon-mdi-refresh />
          </IconButton>
        </template>

        <div v-if="leaderboard.length === 0" class="accounts-page__leaderboard-empty">
          {{ t('views.economy.accounts.leaderboard.empty') }}
        </div>
        <div v-else class="accounts-page__leaderboard-list">
          <div
            v-for="item in leaderboard"
            :key="item.playerId"
            class="accounts-page__leaderboard-item"
          >
            <div class="accounts-page__leaderboard-main">
              <div class="accounts-page__leaderboard-rank">
                #{{ item.rank }}
              </div>
              <div class="accounts-page__leaderboard-name">
                <el-button
                  type="primary"
                  link
                  @click="viewPlayerProfile({ playerId: item.playerId, playerName: item.playerName })"
                >
                  {{ item.playerName || item.playerId }}
                </el-button>
              </div>
              <div class="accounts-page__leaderboard-id">
                {{ item.playerId }}
              </div>
            </div>
            <div class="accounts-page__leaderboard-balance">
              {{ item.balance }}
            </div>
          </div>
        </div>
      </MyCard>
    </div>

    <AdjustBalanceDialog
      v-if="currentRow"
      ref="adjustDialogRef"
      :player-id="currentRow.playerId"
      :player-name="currentRow.playerName"
      @saved="onSaved"
    />

    <AccountDetailDialog
      v-if="detailPlayerId"
      ref="detailDialogRef"
      :player-id="detailPlayerId"
      @updated="onSaved"
    />

    <BatchAdjustDialog
      ref="batchAdjustDialogRef"
      @saved="onSaved"
    />
  </div>
</template>

<style scoped lang="scss">
.accounts-page {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  height: 100%;
  min-height: 0;
}

.accounts-page__overview {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.9rem;
}

.accounts-page__metric {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  padding: 1rem 1.05rem;
  border: 1px solid color-mix(in srgb, var(--el-border-color-light) 70%, white 30%);
  border-radius: 24px;
  background:
    radial-gradient(circle at top right, color-mix(in srgb, currentColor 10%, transparent), transparent 36%),
    linear-gradient(180deg, color-mix(in srgb, var(--el-bg-color) 97%, white 3%), var(--el-bg-color));
  box-shadow: 0 14px 32px rgba(15, 23, 42, 0.05);
}

.accounts-page__metric--primary {
  color: var(--colors-primary);
}

.accounts-page__metric--danger {
  color: #be123c;
}

.accounts-page__metric--warning {
  color: #b45309;
}

.accounts-page__metric-label {
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.accounts-page__metric-value {
  font-size: 1.4rem;
  line-height: 1.1;
  color: var(--el-text-color-primary);
}

.accounts-page__grid {
  display: grid;
  flex: 1 1 auto;
  grid-template-columns: minmax(0, 1fr) 320px;
  gap: 1rem;
  min-height: 0;
}

.accounts-page__table {
  height: 100%;
  min-height: 0;
}

.accounts-page__batch-btn {
  border-radius: 999px;
  padding-inline: 1rem;
  box-shadow: 0 10px 22px color-mix(in srgb, var(--colors-primary) 16%, transparent);
}

.accounts-page__balance {
  color: #d97706;
  font-weight: 700;
}

.accounts-page__mono {
  font-family: var(--el-font-family-monospace, 'Cascadia Mono', 'Consolas', monospace);
  font-size: 0.76rem;
  color: var(--el-text-color-secondary);
}

.accounts-page__actions {
  display: inline-flex;
  gap: 0.35rem;
  justify-content: center;
}

.accounts-page__leaderboard {
  align-self: start;
}

.accounts-page__leaderboard-empty {
  color: var(--el-text-color-secondary);
  font-size: 0.9rem;
}

.accounts-page__leaderboard-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.accounts-page__leaderboard-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.9rem;
  padding: 0.85rem 0.95rem;
  border: 1px solid color-mix(in srgb, var(--el-border-color-light) 68%, white 32%);
  border-radius: 20px;
  background:
    linear-gradient(180deg, color-mix(in srgb, var(--el-bg-color) 98%, white 2%), var(--el-bg-color)),
    radial-gradient(circle at top right, color-mix(in srgb, var(--el-color-warning) 10%, transparent), transparent 38%);
}

.accounts-page__leaderboard-main {
  min-width: 0;
}

.accounts-page__leaderboard-rank {
  font-size: 0.7rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--el-text-color-placeholder);
}

.accounts-page__leaderboard-name {
  overflow: hidden;
  color: var(--el-text-color-primary);
  font-size: 0.95rem;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.accounts-page__leaderboard-id {
  overflow: hidden;
  color: var(--el-text-color-secondary);
  font-family: var(--el-font-family-monospace, 'Cascadia Mono', 'Consolas', monospace);
  font-size: 0.75rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.accounts-page__leaderboard-balance {
  color: #d97706;
  font-size: 1rem;
  font-weight: 700;
}

@media (max-width: 1100px) {
  .accounts-page__grid {
    grid-template-columns: 1fr;
    overflow: auto;
  }

  .accounts-page__table {
    min-height: 460px;
  }
}

@media (max-width: 900px) {
  .accounts-page__overview {
    grid-template-columns: 1fr;
  }
}
</style>
