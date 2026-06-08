<script setup lang="ts">
import type { EconomyTransactionDto } from '~/generated/api/types.gen';
import { useI18n } from 'vue-i18n';

defineProps<{
  economyTransactions: EconomyTransactionDto[];
  formatTime: (value: string | null | undefined) => string;
}>();

const emit = defineEmits<{
  viewPage: [name: string];
}>();

const { t } = useI18n();
</script>

<template>
  <section class="profile-panel">
    <div class="profile-panel__header">
      <h3>{{ t('views.playerProfile.sections.economyTransactions') }}</h3>
      <el-button type="primary" link @click="emit('viewPage', 'EconomyTransactions')">
        {{ t('components.myTable.view') }}
      </el-button>
    </div>
    <el-table :data="economyTransactions" size="small" border>
      <el-table-column :label="t('views.economy.transactions.columns.occurredAt')" width="170">
        <template #default="{ row }">
          {{ formatTime(row.occurredAt) }}
        </template>
      </el-table-column>
      <el-table-column prop="type" :label="t('views.economy.transactions.columns.type')" />
      <el-table-column prop="amount" :label="t('views.economy.transactions.columns.amount')" />
      <el-table-column prop="balanceAfter" :label="t('views.economy.transactions.columns.balanceAfter')" />
      <el-table-column prop="source" :label="t('views.economy.transactions.columns.source')" />
    </el-table>
  </section>
</template>

<style scoped lang="scss">
.profile-panel {
  min-width: 0;
  padding: 14px;
  border: 1px solid var(--el-border-color-light);
  border-radius: 8px;
  background: color-mix(in srgb, var(--el-bg-color) 96%, white 4%);
}

.profile-panel h3 {
  margin: 0 0 12px;
  font-size: 15px;
  font-weight: 700;
}

.profile-panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.profile-panel__header h3 {
  margin: 0;
}
</style>
