<script setup lang="ts">
import type {
  AuditLogDto,
  PlayerProfileGovernanceSummaryDto,
  PlayerProfilePunishmentRecordDto,
  PlayerProfileTrendBucketDto,
} from '~/generated/api/types.gen';
import dayjs from 'dayjs';
import { useI18n } from 'vue-i18n';

const props = defineProps<{
  governanceSummary: PlayerProfileGovernanceSummaryDto | null;
  punishmentHistory: PlayerProfilePunishmentRecordDto[];
  auditLogs: AuditLogDto[];
  trendBuckets: PlayerProfileTrendBucketDto[];
  formatTime: (value: string | null | undefined) => string;
}>();

const emit = defineEmits<{
  viewPage: [name: string];
}>();

const { t, te } = useI18n();

const sortedTrendBuckets = computed(() => {
  return [...props.trendBuckets].sort((a, b) => dayjs(a.date).valueOf() - dayjs(b.date).valueOf());
});

const maxTrendTotal = computed(() => {
  return Math.max(
    1,
    ...props.trendBuckets.map(trendTotal),
  );
});

const trendSummary = computed(() => {
  const recentBuckets = sortedTrendBuckets.value.slice(-7);
  const peakBucket = sortedTrendBuckets.value.reduce<PlayerProfileTrendBucketDto | null>((current, item) => {
    if (current == null || trendTotal(item) > trendTotal(current))
      return item;
    return current;
  }, null);

  return {
    activeDays: props.trendBuckets.filter(item => trendTotal(item) > 0).length,
    recent7DayTotal: recentBuckets.reduce((sum, item) => sum + trendTotal(item), 0),
    peakDay: peakBucket == null || trendTotal(peakBucket) === 0
      ? '--'
      : `${formatTrendDate(peakBucket.date)} / ${trendTotal(peakBucket)}`,
    punishmentDays: props.trendBuckets.filter(item => (item.punishmentCount ?? 0) > 0).length,
  };
});

const trendInsightCards = computed(() => [
  {
    label: t('views.playerProfile.governance.activeDays'),
    value: trendSummary.value.activeDays,
  },
  {
    label: t('views.playerProfile.governance.recent7DayActivity'),
    value: trendSummary.value.recent7DayTotal,
  },
  {
    label: t('views.playerProfile.governance.peakDay'),
    value: trendSummary.value.peakDay,
  },
  {
    label: t('views.playerProfile.governance.punishmentDays'),
    value: trendSummary.value.punishmentDays,
  },
]);

const recentAdminTimeline = computed(() => props.auditLogs.slice(0, 6));

const summaryCards = computed(() => [
  {
    label: t('views.playerProfile.governance.auditCount'),
    value: props.governanceSummary?.auditCount ?? 0,
    type: 'primary',
  },
  {
    label: t('views.playerProfile.governance.failedAuditCount'),
    value: props.governanceSummary?.failedAuditCount ?? 0,
    type: (props.governanceSummary?.failedAuditCount ?? 0) > 0 ? 'danger' : 'success',
  },
  {
    label: t('views.playerProfile.governance.punishmentCount'),
    value: props.governanceSummary?.punishmentCount ?? 0,
    type: (props.governanceSummary?.punishmentCount ?? 0) > 0 ? 'warning' : 'info',
  },
  {
    label: t('views.playerProfile.governance.lastAdminActionAt'),
    value: props.formatTime(props.governanceSummary?.lastAdminActionAt),
    type: 'info',
  },
]);

function lowerFirst(value: string | null | undefined): string {
  if (!value)
    return '';

  return `${value.charAt(0).toLowerCase()}${value.slice(1)}`;
}

function translateAuditAction(value: string | null | undefined): string {
  const key = `views.auditLogs.actionTypes.${lowerFirst(value)}`;
  return value && te(key) ? t(key) : value || '--';
}

function translateAuditSource(value: string | null | undefined): string {
  const key = `views.auditLogs.sources.${lowerFirst(value)}`;
  return value && te(key) ? t(key) : value || '--';
}

function translatePunishmentType(value: string | null | undefined): string {
  const key = `views.playerProfile.punishmentTypes.${lowerFirst(value)}`;
  return value && te(key) ? t(key) : value || '--';
}

function resolvePunishmentTagType(value: string | null | undefined): 'danger' | 'warning' | 'info' | 'success' {
  switch (value) {
    case 'Ban':
    case 'Kick':
      return 'danger';
    case 'Mute':
      return 'warning';
    case 'Unban':
    case 'Unmute':
      return 'success';
    default:
      return 'info';
  }
}

function resolveAuditResultTagType(value: boolean | undefined): 'success' | 'danger' | 'info' {
  if (value === true)
    return 'success';
  if (value === false)
    return 'danger';
  return 'info';
}

function trendTotal(item: PlayerProfileTrendBucketDto): number {
  return (item.chatCount ?? 0)
    + (item.gameEventCount ?? 0)
    + (item.economyTransactionCount ?? 0)
    + (item.teleportCount ?? 0)
    + (item.auditCount ?? 0);
}

function formatTrendDate(value: string | null | undefined): string {
  return value == null ? '--' : dayjs(value).format('MM-DD');
}

function trendPercent(item: PlayerProfileTrendBucketDto): string {
  return `${Math.max(4, Math.round(trendTotal(item) / maxTrendTotal.value * 100))}%`;
}

function trendStripHeight(item: PlayerProfileTrendBucketDto): string {
  if (trendTotal(item) === 0)
    return '4px';

  return `${Math.max(8, Math.round(trendTotal(item) / maxTrendTotal.value * 54))}px`;
}
</script>

<template>
  <div class="profile-panel-stack">
    <section class="profile-governance-summary">
      <div
        v-for="item in summaryCards"
        :key="item.label"
        class="profile-governance-summary__item"
      >
        <span>{{ item.label }}</span>
        <strong>{{ item.value }}</strong>
      </div>
    </section>

    <section class="profile-panel">
      <div class="profile-panel__header">
        <h3>{{ t('views.playerProfile.sections.trends') }}</h3>
      </div>
      <div class="profile-trend-insights">
        <div
          v-for="item in trendInsightCards"
          :key="item.label"
          class="profile-trend-insights__item"
        >
          <span>{{ item.label }}</span>
          <strong>{{ item.value }}</strong>
        </div>
      </div>
      <div class="profile-trend-strip">
        <div
          v-for="item in sortedTrendBuckets"
          :key="item.date"
          class="profile-trend-strip__day"
          :title="`${formatTrendDate(item.date)}: ${trendTotal(item)}`"
        >
          <span :style="{ height: trendStripHeight(item) }" />
          <small>{{ formatTrendDate(item.date) }}</small>
        </div>
      </div>
      <el-table :data="sortedTrendBuckets" size="small" border>
        <el-table-column :label="t('views.playerProfile.governance.date')" width="120">
          <template #default="{ row }">
            {{ row.date ? row.date.slice(0, 10) : '--' }}
          </template>
        </el-table-column>
        <el-table-column :label="t('views.playerProfile.governance.activityTrend')" min-width="160">
          <template #default="{ row }">
            <div class="profile-trend-bar">
              <span :style="{ width: trendPercent(row) }" />
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="chatCount" :label="t('views.playerProfile.timeline.chat')" width="80" />
        <el-table-column prop="gameEventCount" :label="t('views.playerProfile.timeline.event')" width="80" />
        <el-table-column prop="economyTransactionCount" :label="t('views.playerProfile.timeline.economy')" width="80" />
        <el-table-column prop="teleportCount" :label="t('views.playerProfile.timeline.teleport')" width="80" />
        <el-table-column prop="auditCount" :label="t('views.playerProfile.timeline.audit')" width="80" />
        <el-table-column prop="punishmentCount" :label="t('views.playerProfile.governance.punishmentCount')" width="100" />
      </el-table>
    </section>

    <section class="profile-panel">
      <div class="profile-panel__header">
        <h3>{{ t('views.playerProfile.sections.punishmentHistory') }}</h3>
      </div>
      <el-table :data="punishmentHistory" size="small" border>
        <el-table-column :label="t('views.auditLogs.columns.createdAt')" width="170">
          <template #default="{ row }">
            {{ formatTime(row.occurredAt) }}
          </template>
        </el-table-column>
        <el-table-column :label="t('views.auditLogs.columns.actionType')" width="120">
          <template #default="{ row }">
            <el-tag :type="resolvePunishmentTagType(row.type)" effect="plain" size="small">
              {{ translatePunishmentType(row.type) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column :label="t('views.playerProfile.governance.expiresAt')" width="170">
          <template #default="{ row }">
            {{ formatTime(row.expiresAt) }}
          </template>
        </el-table-column>
        <el-table-column :label="t('views.auditLogs.columns.source')" width="120">
          <template #default="{ row }">
            {{ translateAuditSource(row.source) }}
          </template>
        </el-table-column>
        <el-table-column prop="operatorName" :label="t('views.auditLogs.columns.operatorName')" width="140" />
        <el-table-column :label="t('views.auditLogs.columns.succeeded')" width="90">
          <template #default="{ row }">
            <el-tag :type="resolveAuditResultTagType(row.succeeded)" effect="plain" size="small">
              {{ row.succeeded ? t('common.yes') : t('common.no') }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="reason" :label="t('views.auditLogs.columns.summary')" min-width="220" show-overflow-tooltip />
      </el-table>
    </section>

    <section class="profile-panel">
      <div class="profile-panel__header">
        <h3>{{ t('views.playerProfile.sections.auditLogs') }}</h3>
        <el-button type="primary" link @click="emit('viewPage', 'AuditLogs')">
          {{ t('components.myTable.view') }}
        </el-button>
      </div>
      <el-table :data="auditLogs" size="small" border>
        <el-table-column :label="t('views.auditLogs.columns.createdAt')" width="170">
          <template #default="{ row }">
            {{ formatTime(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column :label="t('views.auditLogs.columns.source')" width="120">
          <template #default="{ row }">
            {{ translateAuditSource(row.source) }}
          </template>
        </el-table-column>
        <el-table-column :label="t('views.auditLogs.columns.actionType')" width="110">
          <template #default="{ row }">
            {{ translateAuditAction(row.actionType) }}
          </template>
        </el-table-column>
        <el-table-column prop="operatorName" :label="t('views.auditLogs.columns.operatorName')" width="140" />
        <el-table-column prop="summary" :label="t('views.auditLogs.columns.summary')" min-width="220" show-overflow-tooltip />
        <el-table-column :label="t('views.auditLogs.columns.succeeded')" width="90">
          <template #default="{ row }">
            <el-tag :type="resolveAuditResultTagType(row.succeeded)" effect="plain" size="small">
              {{ row.succeeded ? t('common.yes') : t('common.no') }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>
    </section>

    <section class="profile-panel">
      <div class="profile-panel__header">
        <h3>{{ t('views.playerProfile.sections.adminActionTimeline') }}</h3>
        <el-button type="primary" link @click="emit('viewPage', 'AuditLogs')">
          {{ t('components.myTable.view') }}
        </el-button>
      </div>
      <div v-if="recentAdminTimeline.length > 0" class="profile-admin-timeline">
        <div
          v-for="item in recentAdminTimeline"
          :key="item.id ?? `${item.createdAt}:${item.summary}`"
          class="profile-admin-timeline__item"
        >
          <div class="profile-admin-timeline__marker">
            <span :class="{ 'is-failed': item.succeeded === false }" />
          </div>
          <div class="profile-admin-timeline__content">
            <div class="profile-admin-timeline__title">
              <strong>{{ translateAuditAction(item.actionType) }}</strong>
              <el-tag :type="resolveAuditResultTagType(item.succeeded)" effect="plain" size="small">
                {{ item.succeeded ? t('common.yes') : t('common.no') }}
              </el-tag>
            </div>
            <p>{{ item.summary }}</p>
            <small>
              {{ formatTime(item.createdAt) }}
              / {{ translateAuditSource(item.source) }}
              / {{ item.operatorName || '--' }}
            </small>
          </div>
        </div>
      </div>
      <el-empty v-else :description="t('views.playerProfile.governance.noAdminActions')" :image-size="72" />
    </section>
  </div>
</template>

<style scoped lang="scss">
.profile-panel-stack {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.profile-panel,
.profile-governance-summary__item {
  min-width: 0;
  border: 1px solid var(--el-border-color-light);
  border-radius: 8px;
  background: color-mix(in srgb, var(--el-bg-color) 96%, white 4%);
}

.profile-panel {
  padding: 14px;
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

.profile-governance-summary {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.profile-governance-summary__item {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 14px;
}

.profile-governance-summary__item span {
  color: var(--el-text-color-secondary);
  font-size: 13px;
}

.profile-governance-summary__item strong {
  min-width: 0;
  overflow-wrap: anywhere;
  color: var(--el-text-color-primary);
  font-size: 20px;
}

.profile-trend-bar {
  width: 100%;
  height: 8px;
  overflow: hidden;
  border-radius: 999px;
  background: var(--el-fill-color-light);
}

.profile-trend-bar span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: var(--el-color-primary);
}

.profile-trend-insights {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
  margin-bottom: 12px;
}

.profile-trend-insights__item {
  min-width: 0;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 6px;
  padding: 10px 12px;
  background: var(--el-fill-color-extra-light);

  span {
    display: block;
    color: var(--el-text-color-secondary);
    font-size: 12px;
    line-height: 18px;
  }

  strong {
    display: block;
    min-width: 0;
    margin-top: 4px;
    overflow: hidden;
    color: var(--el-text-color-primary);
    font-size: 16px;
    line-height: 22px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.profile-trend-strip {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(28px, 1fr));
  align-items: end;
  gap: 4px;
  min-height: 82px;
  margin-bottom: 12px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 6px;
  padding: 10px;
  background: var(--el-fill-color-extra-light);
}

.profile-trend-strip__day {
  display: flex;
  min-width: 0;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  gap: 4px;

  span {
    width: 100%;
    max-width: 18px;
    border-radius: 4px 4px 2px 2px;
    background: var(--el-color-primary);
  }

  small {
    max-width: 100%;
    overflow: hidden;
    color: var(--el-text-color-secondary);
    font-size: 10px;
    line-height: 14px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.profile-admin-timeline {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.profile-admin-timeline__item {
  display: grid;
  grid-template-columns: 18px minmax(0, 1fr);
  gap: 8px;
}

.profile-admin-timeline__marker {
  display: flex;
  justify-content: center;
  padding-top: 4px;

  span {
    width: 9px;
    height: 9px;
    border-radius: 50%;
    background: var(--el-color-success);
  }

  span.is-failed {
    background: var(--el-color-danger);
  }
}

.profile-admin-timeline__content {
  min-width: 0;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 6px;
  padding: 10px 12px;
  background: var(--el-fill-color-extra-light);

  p {
    margin: 6px 0;
    color: var(--el-text-color-primary);
    font-size: 13px;
    line-height: 20px;
    overflow-wrap: anywhere;
  }

  small {
    color: var(--el-text-color-secondary);
    font-size: 12px;
    line-height: 18px;
  }
}

.profile-admin-timeline__title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;

  strong {
    min-width: 0;
    overflow: hidden;
    color: var(--el-text-color-primary);
    font-size: 14px;
    line-height: 20px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

@media (max-width: 960px) {
  .profile-governance-summary {
    grid-template-columns: 1fr;
  }

  .profile-trend-insights {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .profile-panel__header {
    align-items: flex-start;
    flex-direction: column;
  }
}

@media (max-width: 560px) {
  .profile-trend-insights {
    grid-template-columns: 1fr;
  }
}
</style>
