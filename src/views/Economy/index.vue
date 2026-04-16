<script setup lang="ts">
import Accounts from './Accounts/index.vue';
import Settings from './Settings/index.vue';
import Transactions from './Transactions/index.vue';

defineOptions({ name: 'EconomyPage' });

const activeTab = ref('accounts');
</script>

<template>
  <el-card class="h-full" shadow="never">
    <el-tabs v-model="activeTab">
      <el-tab-pane :label="$t('views.economy.tabs.accounts')" name="accounts">
        <Accounts />
      </el-tab-pane>
      <el-tab-pane :label="$t('views.economy.tabs.transactions')" name="transactions">
        <Transactions />
      </el-tab-pane>
      <el-tab-pane :label="$t('views.economy.tabs.settings')" name="settings">
        <Settings />
      </el-tab-pane>
    </el-tabs>
  </el-card>
</template>
