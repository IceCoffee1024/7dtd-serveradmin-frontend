<script setup lang="ts">
import type {
  AuditLogDto,
  PlayerProfileGovernanceSummaryDto,
  PlayerProfilePunishmentRecordDto,
  PlayerProfileTrendBucketDto,
} from '~/generated/api/types.gen';
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

const maxTrendTotal = computed(() => {
  return Math.max(
    1,
    ...props.trendBuckets.map(item =>
      (item.chatCount ?? 0)
      + (item.gameEventCount ?? 0)
      + (item.economyTransactionCount ?? 0)
      + (item.teleportCount ?? 0)
      + (item.auditCount ?? 0),
    ),
  );
});

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

function trendPercent(item: PlayerProfileTrendBucketDto): string {
  return `${Math.max(4, Math.round(trendTotal(item) / maxTrendTotal.value * 100))}%`;
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
      <el-table :data="trendBuckets" size="small" border>
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
        <el-table-column prop="operatorName" :label="t('views.auditLogs.columns.operatorName')" width="140" />
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

@media (max-width: 960px) {
  .profile-governance-summary {
    grid-template-columns: 1fr;
  }

  .profile-panel__header {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
