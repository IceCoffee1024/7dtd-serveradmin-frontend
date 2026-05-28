<script setup lang="ts">
import dayjs from 'dayjs';

defineOptions({ name: 'EconomyTransactionDetailDialog' });

defineProps<Props>();

interface Props {
  transaction: API.Economy.Transaction | null;
}

const dialogRef = useTemplateRef('dialogRef');

function show() {
  dialogRef.value?.open();
}

function formatTimestamp(value: string | null | undefined): string {
  return value ? dayjs(value).format('YYYY-MM-DD HH:mm:ss') : '--';
}

defineExpose({ show });
</script>

<template>
  <MyDialog ref="dialogRef" :title="$t('views.economy.transactions.detailDialog.title')" :show-footer="false" width="min(960px, 92vw)">
    <div class="gap-4 grid md:grid-cols-2">
      <div class="p-4 rounded-xl bg-gray-50 dark:bg-gray-900/60">
        <div class="text-sm text-gray-900 font-semibold mb-3 dark:text-gray-100">
          {{ $t('views.economy.transactions.detailDialog.sections.primary') }}
        </div>
        <div class="text-sm gap-3 grid md:grid-cols-[120px_minmax(0,1fr)]">
          <span class="text-gray-500 dark:text-gray-400">{{ $t('views.economy.transactions.columns.occurredAt') }}</span>
          <span class="text-gray-800 font-mono dark:text-gray-100">{{ formatTimestamp(transaction?.occurredAt) }}</span>

          <span class="text-gray-500 dark:text-gray-400">{{ $t('views.economy.transactions.columns.playerName') }}</span>
          <span class="text-gray-800 dark:text-gray-100">{{ transaction?.playerName || '--' }}</span>

          <span class="text-gray-500 dark:text-gray-400">{{ $t('views.economy.transactions.columns.playerId') }}</span>
          <span class="text-gray-800 font-mono dark:text-gray-100">{{ transaction?.playerId || '--' }}</span>

          <span class="text-gray-500 dark:text-gray-400">{{ $t('views.economy.transactions.columns.type') }}</span>
          <span class="text-gray-800 dark:text-gray-100">{{ transaction?.type || '--' }}</span>

          <span class="text-gray-500 dark:text-gray-400">{{ $t('views.economy.transactions.columns.direction') }}</span>
          <span class="text-gray-800 dark:text-gray-100">{{ transaction?.direction || '--' }}</span>

          <span class="text-gray-500 dark:text-gray-400">{{ $t('views.economy.transactions.columns.amount') }}</span>
          <span
            class="font-semibold"
            :class="transaction?.direction === 'Income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'"
          >
            {{ transaction ? (transaction.direction === 'Income' ? '+' : '-') + transaction.amount : '--' }}
          </span>
        </div>
      </div>

      <div class="p-4 rounded-xl bg-gray-50 dark:bg-gray-900/60">
        <div class="text-sm text-gray-900 font-semibold mb-3 dark:text-gray-100">
          {{ $t('views.economy.transactions.detailDialog.sections.metadata') }}
        </div>
        <div class="text-sm gap-3 grid md:grid-cols-[120px_minmax(0,1fr)]">
          <span class="text-gray-500 dark:text-gray-400">{{ $t('views.economy.transactions.columns.source') }}</span>
          <span class="text-gray-800 dark:text-gray-100">{{ transaction?.source || '--' }}</span>

          <span class="text-gray-500 dark:text-gray-400">{{ $t('views.economy.transactions.columns.referenceId') }}</span>
          <span class="text-gray-800 font-mono dark:text-gray-100">{{ transaction?.referenceId || '--' }}</span>

          <span class="text-gray-500 dark:text-gray-400">{{ $t('views.economy.transactions.columns.operatorName') }}</span>
          <span class="text-gray-800 dark:text-gray-100">{{ transaction?.operatorName || '--' }}</span>

          <span class="text-gray-500 dark:text-gray-400">{{ $t('views.economy.transactions.columns.operatorId') }}</span>
          <span class="text-gray-800 font-mono dark:text-gray-100">{{ transaction?.operatorId || '--' }}</span>

          <span class="text-gray-500 dark:text-gray-400">{{ $t('views.economy.transactions.columns.balanceBefore') }}</span>
          <span class="text-gray-800 dark:text-gray-100">{{ transaction?.balanceBefore ?? '--' }}</span>

          <span class="text-gray-500 dark:text-gray-400">{{ $t('views.economy.transactions.columns.balanceAfter') }}</span>
          <span class="text-gray-800 dark:text-gray-100">{{ transaction?.balanceAfter ?? '--' }}</span>
        </div>
      </div>
    </div>

    <div class="text-sm mt-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-900/60">
      <div class="text-sm text-gray-900 font-semibold mb-2 dark:text-gray-100">
        {{ $t('views.economy.transactions.columns.reason') }}
      </div>
      <div class="text-gray-800 leading-6 dark:text-gray-100">
        {{ transaction?.reason || '--' }}
      </div>
    </div>
  </MyDialog>
</template>
