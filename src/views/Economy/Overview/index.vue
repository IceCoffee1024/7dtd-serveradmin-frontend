<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import * as api from '~/api/economy';

defineOptions({ name: 'EconomyOverviewPage' });

const { t } = useI18n();

const loading = ref(false);
const settings = ref<API.Economy.Settings | null>(null);
const overview = ref<API.Economy.Overview | null>(null);

const currencySymbol = computed(() => settings.value?.currencySymbol ?? '');

async function fetchData() {
  loading.value = true;
  try {
    const [s, o] = await Promise.all([api.getSettings(), api.getOverview()]);
    settings.value = s;
    overview.value = o;
  }
  finally {
    loading.value = false;
  }
}

onMounted(fetchData);

const leaderboardWithRank = computed(() =>
  (overview.value?.leaderboard ?? []).map((item, index) => ({
    ...item,
    rank: index + 1,
  })),
);
</script>

<template>
  <div v-loading="loading" class="flex flex-col gap-6">
    <!-- Stat Cards -->
    <div class="gap-4 grid grid-cols-2 lg:grid-cols-3">
      <!-- Total Accounts -->
      <el-card shadow="never" class="dark:bg-gray-800">
        <el-statistic
          :title="t('views.economy.overview.totalAccounts')"
          :value="overview?.totalAccounts ?? 0"
        >
          <template #suffix>
            <span class="text-xs text-gray-400 ml-2 dark:text-gray-500">
              +{{ overview?.todayNewAccounts ?? 0 }} {{ t('views.economy.overview.todayNewAccounts') }}
            </span>
          </template>
        </el-statistic>
      </el-card>

      <!-- Total Circulation -->
      <el-card shadow="never" class="dark:bg-gray-800">
        <el-statistic
          :title="t('views.economy.overview.totalCirculation')"
          :value="overview?.totalCirculation ?? 0"
          :prefix="currencySymbol"
        />
      </el-card>

      <!-- Today Transactions -->
      <el-card shadow="never" class="dark:bg-gray-800">
        <el-statistic
          :title="t('views.economy.overview.todayTransactionCount')"
          :value="overview?.todayTransactionCount ?? 0"
        />
      </el-card>

      <!-- Today Rewards -->
      <el-card shadow="never" class="dark:bg-gray-800">
        <el-statistic
          :title="t('views.economy.overview.todayRewardsAmount')"
          :value="overview?.todayRewardsAmount ?? 0"
          :prefix="currencySymbol"
        />
      </el-card>

      <!-- Today Daily Claims -->
      <el-card shadow="never" class="dark:bg-gray-800">
        <el-statistic
          :title="t('views.economy.overview.todayDailyClaimCount')"
          :value="overview?.todayDailyClaimCount ?? 0"
        />
      </el-card>

      <!-- Today Tax Collected -->
      <el-card shadow="never" class="dark:bg-gray-800">
        <el-statistic
          :title="t('views.economy.overview.todayTaxCollected')"
          :value="overview?.todayTaxCollected ?? 0"
          :prefix="currencySymbol"
        />
      </el-card>
    </div>

    <!-- Leaderboard -->
    <el-card shadow="never" class="dark:bg-gray-800">
      <template #header>
        <span class="text-gray-700 font-semibold dark:text-gray-200">
          {{ t('views.economy.overview.leaderboard') }}
        </span>
      </template>

      <el-table
        :data="leaderboardWithRank"
        size="small"
        stripe
        class="w-full"
      >
        <el-table-column
          :label="t('views.economy.overview.leaderboardRank')"
          width="80"
          align="center"
        >
          <template #default="{ row }">
            <el-tag
              :type="row.rank === 1 ? 'warning' : row.rank === 2 ? 'info' : row.rank === 3 ? 'danger' : undefined"
              size="small"
              effect="plain"
            >
              #{{ row.rank }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column
          prop="playerName"
          :label="t('views.economy.accounts.columns.playerName')"
        />

        <el-table-column
          prop="playerId"
          :label="t('views.economy.accounts.columns.playerId')"
          show-overflow-tooltip
        />

        <el-table-column
          prop="balance"
          :label="t('views.economy.accounts.columns.balance')"
          align="right"
        >
          <template #default="{ row }">
            {{ currencySymbol }}{{ row.balance.toLocaleString() }}
          </template>
        </el-table-column>
      </el-table>

      <el-empty
        v-if="!loading && leaderboardWithRank.length === 0"
        :description="t('views.economy.overview.empty')"
      />
    </el-card>
  </div>
</template>
