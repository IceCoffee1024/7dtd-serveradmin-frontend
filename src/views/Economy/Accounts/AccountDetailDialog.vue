<script setup lang="ts">
import type { EconomyAccountDetailDto, EconomyTransactionDto } from '~/generated/api/types.gen';
import { useMutation, useQueryCache } from '@pinia/colada';
import dayjs from 'dayjs';
import { useI18n } from 'vue-i18n';
import { usePopup } from '~/composables';
import {
  economyFreezeAccountMutation,
  economyGetAccountQuery,
  economyTransactionsGetTransactionsQuery,
} from '~/generated/api/@pinia/colada.gen';
import { invalidateEconomyAndTransactionsQueries } from '~/queries/economy';
import AdjustBalanceDialog from './AdjustBalanceDialog.vue';

defineOptions({ name: 'EconomyAccountDetailDialog' });

const props = defineProps<Props>();

const emit = defineEmits<{ updated: [] }>();

interface Props {
  playerId: string;
}

const { t } = useI18n();
const { toast } = usePopup();
const queryCache = useQueryCache();

const dialogRef = useTemplateRef('dialogRef');
const adjustDialogRef = useTemplateRef('adjustDialogRef');
const isLoading = ref(false);
const freezeAccountMutation = useMutation({
  ...economyFreezeAccountMutation(),
  async onSettled() {
    await invalidateEconomyAndTransactionsQueries();
  },
});
const isUpdating = computed(() => freezeAccountMutation.isLoading.value);
const detail = ref<EconomyAccountDetailDto | null>(null);
const recentTransactions = ref<EconomyTransactionDto[]>([]);

async function loadRecentTransactions(playerId: string) {
  try {
    const options = economyTransactionsGetTransactionsQuery({
      query: {
        pageNumber: 1,
        pageSize: 5,
        playerId,
        order: 'OccurredAt',
        desc: true,
      },
    });
    const entry = queryCache.ensure(options);
    const state = await queryCache.fetch(entry);

    if (state.status === 'error') {
      throw state.error;
    }

    recentTransactions.value = state.data?.items ?? [];
  }
  catch (error) {
    console.error(error);
    recentTransactions.value = [];
  }
}

function formatTimestamp(value: string | null | undefined): string {
  return value ? dayjs(value).format('YYYY-MM-DD HH:mm:ss') : '--';
}

async function fetchAccount(playerId: string): Promise<EconomyAccountDetailDto> {
  const options = economyGetAccountQuery({ path: { playerId } });
  const entry = queryCache.ensure(options);
  const state = await queryCache.fetch(entry);

  if (state.status === 'error') {
    throw state.error;
  }

  if (state.data == null) {
    throw new Error('Empty economy account response');
  }

  return state.data;
}

async function loadDetail(playerId: string) {
  isLoading.value = true;
  detail.value = null;
  recentTransactions.value = [];
  try {
    const [detailResponse] = await Promise.all([
      fetchAccount(playerId),
      loadRecentTransactions(playerId),
    ]);
    detail.value = detailResponse;
  }
  catch (error) {
    console.error(error);
    recentTransactions.value = [];
    toast({
      type: 'error',
      text: t('views.economy.accounts.detailDialog.messages.loadFailed'),
    });
  }
  finally {
    isLoading.value = false;
  }
}

async function onToggleFrozen() {
  if (!detail.value) {
    return;
  }

  try {
    await freezeAccountMutation.mutateAsync({
      path: { playerId: detail.value.playerId },
      body: { isFrozen: !detail.value.isFrozen },
    });
    await loadDetail(detail.value.playerId);
    emit('updated');
    toast({
      type: 'success',
      text: t('views.economy.accounts.detailDialog.messages.freezeSuccess'),
    });
  }
  catch (error) {
    console.error(error);
  }
}

async function show(playerId?: string) {
  const targetPlayerId = playerId || props.playerId;
  dialogRef.value?.open();
  await loadDetail(targetPlayerId);
}

function onAdjust() {
  adjustDialogRef.value?.show();
}

async function onAdjusted() {
  if (!detail.value) {
    return;
  }

  await loadDetail(detail.value.playerId);
  emit('updated');
}

function formatTransactionAmount(transaction: EconomyTransactionDto): string {
  return `${transaction.direction === 'Income' ? '+' : '-'}${transaction.amount ?? 0}`;
}

defineExpose({ show });
</script>

<template>
  <MyDialog
    ref="dialogRef"
    :title="t('views.economy.accounts.detailDialog.title')"
    width="min(920px, 92vw)"
    :show-footer="false"
  >
    <div v-loading="isLoading" class="flex flex-col gap-4 min-h-52">
      <template v-if="detail">
        <div class="account-detail-dialog__actions">
          <el-button size="small" class="app-pill-button" @click="onAdjust">
            <el-icon><icon-mdi-pencil-outline /></el-icon>
            {{ t('views.economy.accounts.actions.adjust') }}
          </el-button>
          <el-button size="small" class="app-pill-button" :loading="isUpdating" @click="onToggleFrozen">
            <el-icon><icon-mdi-snowflake /></el-icon>
            {{ detail.isFrozen ? t('views.economy.accounts.actions.unfreeze') : t('views.economy.accounts.actions.freeze') }}
          </el-button>
        </div>

        <div class="gap-4 grid md:grid-cols-2">
          <div class="p-4 rounded-xl bg-gray-50 dark:bg-gray-900/60">
            <div class="text-sm text-gray-900 font-semibold mb-3 dark:text-gray-100">
              {{ t('views.economy.accounts.detailDialog.sections.overview') }}
            </div>
            <div class="text-sm gap-3 grid md:grid-cols-[120px_minmax(0,1fr)]">
              <span class="text-gray-500 dark:text-gray-400">{{ t('views.economy.accounts.columns.playerName') }}</span>
              <span class="text-gray-800 dark:text-gray-100">{{ detail.playerName || '--' }}</span>

              <span class="text-gray-500 dark:text-gray-400">{{ t('views.economy.accounts.columns.playerId') }}</span>
              <span class="text-gray-800 font-mono dark:text-gray-100">{{ detail.playerId }}</span>

              <span class="text-gray-500 dark:text-gray-400">{{ t('views.economy.accounts.columns.balance') }}</span>
              <span class="text-amber-600 font-semibold dark:text-amber-400">{{ detail.balance }}</span>

              <span class="text-gray-500 dark:text-gray-400">{{ t('views.economy.accounts.columns.isFrozen') }}</span>
              <div>
                <el-tag :type="detail.isFrozen ? 'danger' : 'success'">
                  {{ detail.isFrozen ? t('common.yes') : t('common.no') }}
                </el-tag>
              </div>

              <span class="text-gray-500 dark:text-gray-400">{{ t('views.economy.accounts.detailDialog.fields.createdAt') }}</span>
              <span class="text-gray-800 font-mono dark:text-gray-100">{{ formatTimestamp(detail.createdAt) }}</span>

              <span class="text-gray-500 dark:text-gray-400">{{ t('views.economy.accounts.detailDialog.fields.updatedAt') }}</span>
              <span class="text-gray-800 font-mono dark:text-gray-100">{{ formatTimestamp(detail.updatedAt) }}</span>
            </div>
          </div>

          <div class="p-4 rounded-xl bg-gray-50 dark:bg-gray-900/60">
            <div class="text-sm text-gray-900 font-semibold mb-3 dark:text-gray-100">
              {{ t('views.economy.accounts.detailDialog.sections.activity') }}
            </div>
            <div class="text-sm gap-3 grid md:grid-cols-[140px_minmax(0,1fr)]">
              <span class="text-gray-500 dark:text-gray-400">{{ t('views.economy.accounts.columns.lastTransactionAt') }}</span>
              <span class="text-gray-800 font-mono dark:text-gray-100">{{ formatTimestamp(detail.lastTransactionAt) }}</span>

              <span class="text-gray-500 dark:text-gray-400">{{ t('views.economy.accounts.detailDialog.fields.lastDailyClaimAt') }}</span>
              <span class="text-gray-800 font-mono dark:text-gray-100">{{ formatTimestamp(detail.lastDailyClaimAt) }}</span>

              <span class="text-gray-500 dark:text-gray-400">{{ t('views.economy.accounts.detailDialog.fields.dailyStreak') }}</span>
              <span class="text-gray-800 dark:text-gray-100">{{ detail.dailyStreak }}</span>

              <span class="text-gray-500 dark:text-gray-400">{{ t('views.economy.accounts.detailDialog.fields.longestStreak') }}</span>
              <span class="text-gray-800 dark:text-gray-100">{{ detail.longestStreak }}</span>
            </div>
          </div>
        </div>

        <div class="p-4 rounded-xl bg-gray-50 dark:bg-gray-900/60">
          <div class="mb-3 flex gap-3 items-center justify-between">
            <div class="text-sm text-gray-900 font-semibold dark:text-gray-100">
              {{ t('views.economy.accounts.detailDialog.sections.recentTransactions') }}
            </div>
            <div class="text-xs text-gray-500 dark:text-gray-400">
              {{ t('views.economy.accounts.detailDialog.hints.recentTransactions') }}
            </div>
          </div>

          <div v-if="recentTransactions.length === 0" class="app-empty-state account-detail-dialog__empty">
            <div class="app-empty-state__icon">
              <icon-mdi-cash-clock />
            </div>
            <div class="app-empty-state__title">
              {{ t('views.economy.accounts.detailDialog.sections.recentTransactions') }}
            </div>
            <div class="app-empty-state__description">
              {{ t('views.economy.accounts.detailDialog.empty.recentTransactions') }}
            </div>
          </div>
          <div v-else class="flex flex-col gap-2">
            <div
              v-for="transaction in recentTransactions"
              :key="transaction.id"
              class="px-3 py-3 rounded-lg bg-white flex gap-3 items-center justify-between dark:bg-gray-800/70"
            >
              <div class="flex-1 min-w-0">
                <div class="flex flex-wrap gap-x-3 gap-y-1 items-center">
                  <span class="text-sm text-gray-900 font-semibold dark:text-gray-100">{{ transaction.type }}</span>
                  <span class="text-xs text-gray-500 dark:text-gray-400">{{ transaction.source }}</span>
                </div>
                <div class="text-xs text-gray-500 font-mono mt-1 dark:text-gray-400">
                  {{ formatTimestamp(transaction.occurredAt) }}
                </div>
                <div class="text-sm text-gray-700 mt-1 dark:text-gray-200">
                  {{ transaction.reason || t('views.economy.accounts.detailDialog.empty.reason') }}
                </div>
              </div>
              <div class="text-right shrink-0">
                <div
                  class="text-sm font-semibold"
                  :class="transaction.direction === 'Income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'"
                >
                  {{ formatTransactionAmount(transaction) }}
                </div>
                <div class="text-xs text-gray-500 mt-1 dark:text-gray-400">
                  {{ t('views.economy.transactions.columns.balanceAfter') }}: {{ transaction.balanceAfter }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>
    </div>

    <AdjustBalanceDialog
      v-if="detail"
      ref="adjustDialogRef"
      :player-id="detail.playerId"
      :player-name="detail.playerName"
      @saved="onAdjusted"
    />
  </MyDialog>
</template>

<style scoped lang="scss">
.account-detail-dialog__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  justify-content: flex-end;
}

.account-detail-dialog__empty {
  min-height: 160px;
}
</style>
