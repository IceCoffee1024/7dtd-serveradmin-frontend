<script setup lang="ts">
import { useIntervalFn } from '@vueuse/core';
import * as devicesApi from '~/api/devices';
import * as gameServerApi from '~/api/gameServer';
import Monitor from './Monitor/index.vue';
import Overview from './Overview/index.vue';
import QuickActions from './QuickActions/index.vue';
import RecentActivity from './RecentActivity/index.vue';
import Status from './Status/index.vue';
import SystemInfo from './SystemInfo/index.vue';

defineOptions({ name: 'Dashboard' });

const gameServerStats = ref<API.GameServer.Stats>();
const systemMetricsSnapshot = ref<API.Devices.SystemMetricsSnapshot>();
const systemPlatformInfo = ref<API.Devices.SystemPlatformInfo>();

devicesApi.getSystemPlatformInfo()
  .then((data) => {
    systemPlatformInfo.value = data;
  })
  .catch((_) => {});

const { pause, resume, isActive } = useIntervalFn(
  () => {
    gameServerApi
      .getStats()
      .then((data) => {
        gameServerStats.value = data;
      })
      .catch((_) => {});
    devicesApi
      .getSystemMetricsSnapshot()
      .then((data) => {
        systemMetricsSnapshot.value = data;
      })
      .catch((_) => {});
  },
  3000,
  { immediateCallback: true },
);

onActivated(() => {
  if (!isActive.value) {
    resume();
  }
});
onDeactivated(pause);
</script>

<template>
  <div class="size-full">
    <div class="gap-4 grid grid-cols-12">
      <div class="col-span-12 xl:col-span-8">
        <MyCard :header="$t('views.dashboard.headers.overview')">
          <Overview :model="gameServerStats" />
        </MyCard>
        <MyCard :header="$t('views.dashboard.headers.status')" class="mt-4">
          <Status :game-server-stats="gameServerStats" :system-metrics-snapshot="systemMetricsSnapshot" />
        </MyCard>
        <MyCard :header="$t('views.dashboard.headers.monitor')" class="mt-4">
          <Monitor :timestamp="systemMetricsSnapshot?.timestamp" :cpu-times="systemMetricsSnapshot?.cpuTimes" :memory-info="systemMetricsSnapshot?.memoryInfo" :network-infos="systemMetricsSnapshot?.networkInfos" />
        </MyCard>
      </div>
      <div class="col-span-12 xl:col-span-4">
        <MyCard :header="$t('views.dashboard.headers.quickActions')">
          <QuickActions />
        </MyCard>
        <MyCard :header="$t('views.dashboard.headers.recentActivity')" class="mt-4">
          <RecentActivity />
        </MyCard>
        <div class="mt-4 gap-4 grid grid-cols-6">
          <MyCard :header="$t('views.dashboard.headers.historyPlayers')" class="stats-content 3xl:whitespace-nowrap">
            <span>
              {{ gameServerStats?.historyPlayers ?? $t('common.unknown') }}
            </span>
          </MyCard>
          <MyCard :header="$t('views.dashboard.headers.entities')" class="stats-content">
            <span>
              {{ gameServerStats?.entities ?? $t('common.unknown') }}
            </span>
          </MyCard>
          <MyCard :header="$t('views.dashboard.headers.fps')" class="stats-content">
            <span>
              {{ gameServerStats?.fps?.toFixed(1) ?? $t('common.unknown') }}
            </span>
          </MyCard>
          <MyCard :header="$t('views.dashboard.headers.residentSetSize')" class="stats-content">
            <span>{{ gameServerStats?.residentSetSize?.toFixed() ?? $t('common.unknown') }} MB</span>
          </MyCard>
          <MyCard :header="$t('views.dashboard.headers.heap')" class="stats-content">
            <span>{{ gameServerStats?.heap?.toFixed() ?? $t('common.unknown') }} MB</span>
          </MyCard>
          <MyCard :header="$t('views.dashboard.headers.chunks')" class="stats-content">
            <span>
              {{ gameServerStats?.chunks ?? $t('common.unknown') }}
            </span>
          </MyCard>
        </div>
        <MyCard :header="$t('views.dashboard.headers.systemPlatformInfo')" class="mt-4">
          <SystemInfo :model="systemPlatformInfo" />
        </MyCard>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.stats-content {
  @apply: lg:col-span-2 xl:col-span-3 2xl:col-span-3 3xl:col-span-2;
  span {
    @apply: text-primary ms-2;
  }
}
</style>
