<script setup lang="ts">
import type {
  StatsDto,
  SystemMetricsSnapshotDto,
  SystemPlatformInfoDto,
} from '~/generated/api/types.gen';
import { useQueryCache } from '@pinia/colada';
import { useIntervalFn } from '@vueuse/core';
import { useI18n } from 'vue-i18n';
import {
  devicesGetSystemMetricsSnapshotQuery,
  devicesGetSystemPlatformInfoQuery,
  gameServerGetStatisticsQuery,
  restartGetSettingsQuery,
} from '~/generated/api/@pinia/colada.gen';
import dayjs from '~/plugins/dayjs';
import { formatUtcTimestamp } from '~/utils/time';
import Monitor from './Monitor/index.vue';
import Overview from './Overview/index.vue';
import QuickActions from './QuickActions/index.vue';
import RecentActivity from './RecentActivity/index.vue';
import Status from './Status/index.vue';
import SystemInfo from './SystemInfo/index.vue';

defineOptions({ name: 'Dashboard' });

const { t } = useI18n();
const queryCache = useQueryCache();
const gameServerStats = ref<StatsDto>();
const systemMetricsSnapshot = ref<SystemMetricsSnapshotDto>();
const systemPlatformInfo = ref<SystemPlatformInfoDto>();
const nextRestartAt = ref<string | null>(null);

const serverHealthTone = computed(() => {
  const fps = gameServerStats.value?.fps ?? 0;
  if (!gameServerStats.value) {
    return 'offline';
  }
  if (fps >= 18) {
    return 'healthy';
  }
  if (fps >= 10) {
    return 'degraded';
  }
  return 'critical';
});

const serverStatusLabel = computed(() => {
  return gameServerStats.value ? t('common.online') : t('common.offline');
});

const snapshotLabel = computed(() => {
  return systemMetricsSnapshot.value?.timestamp
    ? dayjs(systemMetricsSnapshot.value.timestamp).format('HH:mm:ss')
    : '--:--:--';
});

const heroSignalItems = computed(() => [
  {
    key: 'onlinePlayers',
    label: t('views.dashboard.status.onlinePlayers'),
    value: gameServerStats.value
      ? `${gameServerStats.value.onlinePlayers ?? 0} / ${gameServerStats.value.maxOnlinePlayers ?? 0}`
      : t('common.unknown'),
    tone: 'primary',
    icon: 'players',
  },
  {
    key: 'fps',
    label: t('views.dashboard.headers.fps'),
    value: formatNumber(gameServerStats.value?.fps, 1),
    tone: serverHealthTone.value === 'healthy'
      ? 'success'
      : serverHealthTone.value === 'degraded'
        ? 'warning'
        : 'danger',
    icon: 'fps',
  },
  {
    key: 'memory',
    label: t('views.dashboard.headers.residentSetSize'),
    value: formatMemory(gameServerStats.value?.residentSetSize),
    tone: 'warning',
    icon: 'memory',
  },
]);

const metricCards = computed(() => [
  {
    key: 'players',
    label: t('views.dashboard.status.onlinePlayers'),
    value: gameServerStats.value
      ? `${gameServerStats.value.onlinePlayers ?? 0} / ${gameServerStats.value.maxOnlinePlayers ?? 0}`
      : t('common.unknown'),
    detail: `${t('views.dashboard.headers.historyPlayers')}: ${formatNumber(gameServerStats.value?.historyPlayers)}`,
    icon: 'players',
    tone: 'primary',
  },
  {
    key: 'fps',
    label: t('views.dashboard.headers.fps'),
    value: formatNumber(gameServerStats.value?.fps, 1),
    detail: `${t('views.dashboard.quickActions.nextRestart')}: ${formatCompactDate(nextRestartAt.value)}`,
    icon: 'fps',
    tone: serverHealthTone.value === 'healthy'
      ? 'success'
      : serverHealthTone.value === 'degraded'
        ? 'warning'
        : 'danger',
  },
  {
    key: 'residentSetSize',
    label: t('views.dashboard.headers.residentSetSize'),
    value: formatMemory(gameServerStats.value?.residentSetSize),
    detail: `${t('views.dashboard.headers.heap')}: ${formatMemory(gameServerStats.value?.heap)}`,
    icon: 'memory',
    tone: 'warning',
  },
  {
    key: 'zombies',
    label: t('views.dashboard.status.zombies'),
    value: gameServerStats.value
      ? `${gameServerStats.value.zombies ?? 0} / ${gameServerStats.value.maxZombies ?? 0}`
      : t('common.unknown'),
    detail: `${t('views.dashboard.status.animals')}: ${gameServerStats.value ? `${gameServerStats.value.animals ?? 0} / ${gameServerStats.value.maxAnimals ?? 0}` : t('common.unknown')}`,
    icon: 'zombies',
    tone: 'danger',
  },
  {
    key: 'chunks',
    label: t('views.dashboard.headers.chunks'),
    value: formatNumber(gameServerStats.value?.chunks),
    detail: `CGO: ${formatNumber(gameServerStats.value?.chunkGameObjects)}`,
    icon: 'chunks',
    tone: 'info',
  },
  {
    key: 'entities',
    label: t('views.dashboard.headers.entities'),
    value: formatNumber(gameServerStats.value?.entities),
    detail: `${t('views.dashboard.headers.items')}: ${formatNumber(gameServerStats.value?.items)}`,
    icon: 'entities',
    tone: 'success',
  },
]);

const miniMetricItems = computed(() => [
  {
    key: 'historyPlayers',
    header: t('views.dashboard.headers.historyPlayers'),
    value: formatNumber(gameServerStats.value?.historyPlayers),
    caption: t('views.dashboard.headers.historyPlayers'),
    tone: 'primary',
  },
  {
    key: 'heap',
    header: t('views.dashboard.headers.heap'),
    value: formatMemory(gameServerStats.value?.heap),
    caption: t('views.dashboard.headers.heap'),
    tone: 'warning',
  },
  {
    key: 'chunkGameObjects',
    header: t('views.dashboard.headers.chunks'),
    value: formatNumber(gameServerStats.value?.chunkGameObjects),
    caption: 'CGO',
    tone: 'info',
  },
  {
    key: 'items',
    header: t('views.dashboard.headers.items'),
    value: formatNumber(gameServerStats.value?.items),
    caption: t('views.dashboard.headers.items'),
    tone: 'success',
  },
]);

const overviewSummary = computed(() => {
  const stats = gameServerStats.value;
  if (!stats) {
    return t('common.unknown');
  }

  return [stats.region, stats.language, stats.serverVersion].filter(Boolean).join(' / ');
});

function formatCompactDate(value?: string | null): string {
  return formatUtcTimestamp(value, t('common.unknown'), 'MM-DD HH:mm');
}

function formatNumber(value: number | null | undefined, digits = 0): string {
  return value === undefined || value === null ? t('common.unknown') : value.toFixed(digits);
}

function formatMemory(value: number | null | undefined): string {
  return value === undefined || value === null ? t('common.unknown') : `${value.toFixed(0)} MB`;
}

function formatUptimeCompact(value: number | null | undefined): string {
  if (value === undefined || value === null) {
    return t('common.unknown');
  }

  const duration = dayjs.duration(value, 'seconds');
  const days = Math.floor(duration.asDays());
  const hours = duration.hours();
  const minutes = duration.minutes();

  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m`;
  }

  return `${hours}h ${minutes}m`;
}

function formatGameTimeCompact(stats?: StatsDto): string {
  if (!stats?.gameTime) {
    return t('common.unknown');
  }

  const days = stats.gameTime.days ?? 0;
  const hours = stats.gameTime.hours ?? 0;
  const minutes = stats.gameTime.minutes ?? 0;
  return `${days}d ${hours}h ${minutes}m`;
}

fetchSystemPlatformInfo()
  .then((data) => {
    systemPlatformInfo.value = data ?? undefined;
  })
  .catch((_) => {});

fetchNextRestartAt()
  .then((data) => {
    nextRestartAt.value = data;
  })
  .catch((_) => {});

const { pause, resume, isActive } = useIntervalFn(
  () => {
    fetchGameServerStats()
      .then((data) => {
        gameServerStats.value = data ?? undefined;
      })
      .catch((_) => {});
    fetchSystemMetricsSnapshot()
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

async function fetchSystemPlatformInfo() {
  const entry = queryCache.ensure(devicesGetSystemPlatformInfoQuery());
  const state = await queryCache.fetch(entry);

  if (state.status === 'error') {
    throw state.error;
  }

  return state.data;
}

async function fetchNextRestartAt(): Promise<string | null> {
  const entry = queryCache.ensure(restartGetSettingsQuery());
  const state = await queryCache.fetch(entry);

  if (state.status === 'error') {
    throw state.error;
  }

  return state.data?.nextRunAt ?? null;
}

async function fetchGameServerStats() {
  const entry = queryCache.ensure(gameServerGetStatisticsQuery());
  const state = await queryCache.fetch(entry);

  if (state.status === 'error') {
    throw state.error;
  }

  return state.data;
}

async function fetchSystemMetricsSnapshot(): Promise<SystemMetricsSnapshotDto> {
  const entry = queryCache.ensure(devicesGetSystemMetricsSnapshotQuery());
  const state = await queryCache.fetch(entry);

  if (state.status === 'error') {
    throw state.error;
  }

  if (!state.data) {
    throw new Error('System metrics snapshot response is empty.');
  }

  return state.data;
}
</script>

<template>
  <div class="dashboard-page">
    <section class="dashboard-hero">
      <div class="dashboard-hero__content">
        <div class="dashboard-hero__status" :class="`is-${serverHealthTone}`">
          <span class="dashboard-hero__status-dot" />
          {{ serverStatusLabel }}
        </div>
        <h1 class="dashboard-hero__title">
          {{ gameServerStats?.serverName || $t('common.projectName') }}
        </h1>
        <p class="dashboard-hero__summary">
          {{ overviewSummary }}
        </p>

        <div class="dashboard-hero__signals">
          <div
            v-for="item in heroSignalItems"
            :key="item.key"
            class="dashboard-signal"
            :class="`dashboard-signal--${item.tone}`"
          >
            <span class="dashboard-signal__icon">
              <icon-mdi-account-group-outline v-if="item.icon === 'players'" />
              <icon-mdi-speedometer v-else-if="item.icon === 'fps'" />
              <icon-mdi-memory v-else />
            </span>
            <span class="dashboard-signal__content">
              <small>{{ item.label }}</small>
              <strong>{{ item.value }}</strong>
            </span>
          </div>
        </div>

        <div class="dashboard-hero__chips">
          <div class="dashboard-chip">
            <icon-mdi-ip-network-outline class="dashboard-chip__icon" />
            <span>{{ gameServerStats?.serverIp || $t('common.unknown') }}</span>
          </div>
          <div class="dashboard-chip">
            <icon-mdi-map-marker-outline class="dashboard-chip__icon" />
            <span>{{ gameServerStats?.region || $t('common.unknown') }}</span>
          </div>
          <div class="dashboard-chip">
            <icon-mdi-translate class="dashboard-chip__icon" />
            <span>{{ gameServerStats?.language || $t('common.unknown') }}</span>
          </div>
          <div class="dashboard-chip">
            <icon-mdi-gamepad-variant-outline class="dashboard-chip__icon" />
            <span>{{ gameServerStats?.gameMode || $t('common.unknown') }}</span>
          </div>
        </div>
      </div>

      <div class="dashboard-hero__stats">
        <div class="hero-stat-card">
          <div class="hero-stat-card__icon text-sky-500">
            <icon-mdi-timer-sand />
          </div>
          <div class="hero-stat-card__meta">
            <span>{{ $t('views.dashboard.overview.uptime') }}</span>
            <strong>{{ formatUptimeCompact(gameServerStats?.uptime) }}</strong>
          </div>
        </div>
        <div class="hero-stat-card">
          <div class="hero-stat-card__icon text-amber-500">
            <icon-mdi-weather-night />
          </div>
          <div class="hero-stat-card__meta">
            <span>{{ $t('views.dashboard.overview.gameTime') }}</span>
            <strong>{{ formatGameTimeCompact(gameServerStats) }}</strong>
          </div>
        </div>
        <div class="hero-stat-card">
          <div class="hero-stat-card__icon text-emerald-500">
            <icon-mdi-clock-outline />
          </div>
          <div class="hero-stat-card__meta">
            <span>{{ $t('views.dashboard.quickActions.nextRestart') }}</span>
            <strong>{{ formatCompactDate(nextRestartAt) }}</strong>
          </div>
        </div>
      </div>
    </section>

    <section class="dashboard-metrics">
      <div
        v-for="item in metricCards"
        :key="item.key"
        class="metric-card"
        :class="`metric-card--${item.tone}`"
      >
        <div class="metric-card__header">
          <div class="metric-card__label">
            <icon-mdi-account-group-outline v-if="item.icon === 'players'" />
            <icon-mdi-speedometer v-else-if="item.icon === 'fps'" />
            <icon-mdi-memory v-else-if="item.icon === 'memory'" />
            <icon-mdi-ghost-outline v-else-if="item.icon === 'zombies'" />
            <icon-mdi-cube-outline v-else-if="item.icon === 'chunks'" />
            <icon-mdi-chart-timeline-variant v-else />
            {{ item.label }}
          </div>
          <span class="metric-card__tone-dot" />
        </div>
        <div class="metric-card__value">
          {{ item.value }}
        </div>
        <div class="metric-card__detail">
          {{ item.detail }}
        </div>
      </div>
    </section>

    <div class="dashboard-grid">
      <div class="dashboard-grid__main">
        <MyCard :header="$t('views.dashboard.headers.status')">
          <template #extra>
            <span class="section-pill" :class="`section-pill--${serverHealthTone}`">
              <span class="section-pill__dot" />
              {{ serverStatusLabel }}
            </span>
          </template>
          <Status :game-server-stats="gameServerStats" :system-metrics-snapshot="systemMetricsSnapshot" />
        </MyCard>

        <MyCard :header="$t('views.dashboard.headers.monitor')" class="mt-4">
          <template #extra>
            <span class="section-pill">
              <icon-mdi-radar class="text-primary" />
              {{ snapshotLabel }}
            </span>
          </template>
          <Monitor :timestamp="systemMetricsSnapshot?.timestamp" :cpu-times="systemMetricsSnapshot?.cpuTimes" :memory-info="systemMetricsSnapshot?.memoryInfo" :network-infos="systemMetricsSnapshot?.networkInfos" />
        </MyCard>

        <MyCard :header="$t('views.dashboard.headers.overview')" class="mt-4">
          <Overview :model="gameServerStats" />
        </MyCard>
      </div>

      <div class="dashboard-grid__side">
        <MyCard :header="$t('views.dashboard.headers.quickActions')">
          <template #extra>
            <span class="section-pill">
              <icon-mdi-clock-outline class="text-primary" />
              {{ formatCompactDate(nextRestartAt) }}
            </span>
          </template>
          <QuickActions :next-restart-at="nextRestartAt" />
        </MyCard>

        <MyCard :header="$t('views.dashboard.headers.recentActivity')" class="mt-4">
          <RecentActivity />
        </MyCard>

        <div class="dashboard-mini-grid mt-4">
          <MyCard
            v-for="item in miniMetricItems"
            :key="item.key"
            :header="item.header"
            compact
            class="dashboard-mini-card"
            :class="`dashboard-mini-card--${item.tone}`"
          >
            <div class="mini-metric">
              <strong>{{ item.value }}</strong>
              <span>{{ item.caption }}</span>
            </div>
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
.dashboard-page {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.dashboard-hero {
  display: grid;
  grid-template-columns: minmax(0, 1.7fr) minmax(300px, 0.9fr);
  gap: 1rem;
  padding: 1.5rem;
  border: 1px solid color-mix(in srgb, var(--el-border-color-light) 72%, white 28%);
  border-radius: 30px;
  background:
    radial-gradient(circle at top left, color-mix(in srgb, var(--colors-primary) 12%, transparent), transparent 34%),
    radial-gradient(circle at bottom right, color-mix(in srgb, var(--el-color-info) 14%, transparent), transparent 30%),
    linear-gradient(180deg, color-mix(in srgb, var(--el-bg-color) 94%, white 6%), var(--el-bg-color));
  box-shadow:
    0 24px 80px color-mix(in srgb, var(--colors-primary) 10%, transparent),
    0 8px 20px rgba(15, 23, 42, 0.05);
}

.dashboard-hero__content {
  min-width: 0;
}

.dashboard-hero__status {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.45rem 0.85rem;
  border-radius: 999px;
  font-size: 0.82rem;
  font-weight: 700;
  letter-spacing: 0.02em;
}

.dashboard-hero__status.is-healthy {
  color: var(--el-color-success);
  background: color-mix(in srgb, var(--el-color-success) 14%, transparent);
}

.dashboard-hero__status.is-degraded {
  color: var(--el-color-warning);
  background: color-mix(in srgb, var(--el-color-warning) 14%, transparent);
}

.dashboard-hero__status.is-critical,
.dashboard-hero__status.is-offline {
  color: var(--el-color-danger);
  background: color-mix(in srgb, var(--el-color-danger) 14%, transparent);
}

.dashboard-hero__status-dot {
  width: 0.55rem;
  height: 0.55rem;
  border-radius: 999px;
  background: currentColor;
  box-shadow: 0 0 0 6px color-mix(in srgb, currentColor 14%, transparent);
}

.dashboard-hero__title {
  margin: 1rem 0 0;
  font-size: clamp(1.9rem, 2.5vw, 2.8rem);
  line-height: 1.1;
  font-weight: 800;
}

.dashboard-hero__summary {
  margin: 0.75rem 0 0;
  max-width: 56ch;
  color: var(--el-text-color-secondary);
  line-height: 1.65;
}

.dashboard-hero__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-top: 1.25rem;
}

.dashboard-hero__signals {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.85rem;
  margin-top: 1.15rem;
}

.dashboard-signal {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  min-width: 0;
  padding: 0.82rem 0.9rem;
  border: 1px solid color-mix(in srgb, var(--el-border-color-light) 68%, white 32%);
  border-radius: 22px;
  background: color-mix(in srgb, var(--el-bg-color) 88%, white 12%);
}

.dashboard-signal--primary {
  color: var(--colors-primary);
}

.dashboard-signal--success {
  color: #0f766e;
}

.dashboard-signal--warning {
  color: #b45309;
}

.dashboard-signal--danger {
  color: #be123c;
}

.dashboard-signal__icon {
  display: grid;
  place-items: center;
  width: 2.35rem;
  height: 2.35rem;
  border-radius: 16px;
  background: color-mix(in srgb, currentColor 12%, transparent);
  font-size: 1rem;
  flex-shrink: 0;
}

.dashboard-signal__content {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.dashboard-signal__content small {
  color: var(--el-text-color-secondary);
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.dashboard-signal__content strong {
  color: var(--el-text-color-primary);
  font-size: 1rem;
  line-height: 1.2;
}

.dashboard-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.65rem 0.9rem;
  border-radius: 999px;
  background: color-mix(in srgb, var(--el-bg-color) 76%, white 24%);
  border: 1px solid color-mix(in srgb, var(--el-border-color-light) 66%, white 34%);
  color: var(--el-text-color-secondary);
  font-size: 0.85rem;
}

.dashboard-chip__icon {
  color: var(--colors-primary);
  font-size: 1rem;
}

.dashboard-hero__stats {
  display: grid;
  gap: 0.9rem;
}

.hero-stat-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  min-height: 88px;
  padding: 1rem 1.1rem;
  border-radius: 24px;
  background: color-mix(in srgb, var(--el-bg-color) 88%, white 12%);
  border: 1px solid color-mix(in srgb, var(--el-border-color-light) 70%, white 30%);
}

.hero-stat-card__icon {
  display: grid;
  place-items: center;
  width: 2.9rem;
  height: 2.9rem;
  border-radius: 18px;
  background: color-mix(in srgb, currentColor 12%, transparent);
  font-size: 1.25rem;
}

.hero-stat-card__meta {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.hero-stat-card__meta span {
  color: var(--el-text-color-secondary);
  font-size: 0.82rem;
}

.hero-stat-card__meta strong {
  margin-top: 0.15rem;
  font-size: 1.25rem;
  line-height: 1.2;
}

.dashboard-metrics {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 1rem;
}

.metric-card {
  padding: 0.95rem 1.05rem;
  border-radius: 24px;
  border: 1px solid color-mix(in srgb, var(--el-border-color-light) 70%, white 30%);
  background:
    linear-gradient(180deg, color-mix(in srgb, var(--el-bg-color) 96%, white 4%), var(--el-bg-color)),
    radial-gradient(circle at top right, color-mix(in srgb, var(--colors-primary) 8%, transparent), transparent 40%);
  box-shadow: 0 8px 20px rgba(15, 23, 42, 0.05);
}

.metric-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.metric-card__label {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  color: var(--el-text-color-secondary);
  font-size: 0.85rem;
}

.metric-card__tone-dot {
  width: 0.6rem;
  height: 0.6rem;
  border-radius: 999px;
  background: currentColor;
  opacity: 0.9;
  box-shadow: 0 0 0 6px color-mix(in srgb, currentColor 12%, transparent);
}

.metric-card__value {
  margin-top: 0.6rem;
  font-size: 1.42rem;
  font-weight: 800;
  line-height: 1.1;
}

.metric-card__detail {
  margin-top: 0.4rem;
  color: var(--el-text-color-secondary);
  font-size: 0.78rem;
  line-height: 1.5;
}

.metric-card--primary {
  color: var(--colors-primary);
}

.metric-card--success {
  color: #0f766e;
}

.metric-card--warning {
  color: #b45309;
}

.metric-card--danger {
  color: #be123c;
}

.metric-card--info {
  color: #0369a1;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.6fr) minmax(320px, 0.9fr);
  gap: 1rem;
}

.dashboard-grid__main,
.dashboard-grid__side {
  min-width: 0;
}

.dashboard-mini-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
}

.mini-metric {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.dashboard-mini-card {
  position: relative;
  overflow: hidden;
}

.dashboard-mini-card::after {
  position: absolute;
  inset: auto 0 0;
  height: 3px;
  content: '';
  background: color-mix(in srgb, currentColor 22%, transparent);
}

.dashboard-mini-card--primary {
  color: var(--colors-primary);
}

.dashboard-mini-card--warning {
  color: #b45309;
}

.dashboard-mini-card--info {
  color: #0369a1;
}

.dashboard-mini-card--success {
  color: #0f766e;
}

.mini-metric strong {
  font-size: 1.3rem;
  line-height: 1.1;
  color: var(--el-text-color-primary);
}

.mini-metric span {
  color: var(--el-text-color-secondary);
  font-size: 0.82rem;
}

.section-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.45rem 0.7rem;
  border-radius: 999px;
  background: color-mix(in srgb, var(--colors-primary) 10%, transparent);
  color: var(--el-text-color-secondary);
  font-size: 0.82rem;
}

.section-pill--healthy,
.section-pill--success {
  color: var(--el-color-success);
  background: color-mix(in srgb, var(--el-color-success) 10%, transparent);
}

.section-pill--degraded,
.section-pill--warning {
  color: var(--el-color-warning);
  background: color-mix(in srgb, var(--el-color-warning) 10%, transparent);
}

.section-pill--critical,
.section-pill--offline,
.section-pill--danger {
  color: var(--el-color-danger);
  background: color-mix(in srgb, var(--el-color-danger) 10%, transparent);
}

.section-pill__dot {
  width: 0.45rem;
  height: 0.45rem;
  border-radius: 999px;
  background: currentColor;
}

@media (max-width: 1536px) {
  .dashboard-metrics {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 1280px) {
  .dashboard-hero,
  .dashboard-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 960px) {
  .dashboard-hero__signals,
  .dashboard-metrics {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .dashboard-mini-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .dashboard-hero {
    padding: 1.1rem;
    border-radius: 24px;
  }

  .dashboard-hero__signals,
  .dashboard-metrics {
    grid-template-columns: 1fr;
  }
}
</style>
