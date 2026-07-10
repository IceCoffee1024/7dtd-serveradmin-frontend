<script setup lang="ts">
import type {
  PlayerTrackingCleanupResultDto,
  PlayerTrackingFeatureSettingsDto,
  PlayerTrackingStatusDto,
} from '~/generated/api/types.gen';
import dayjs from 'dayjs';
import { isEqual } from 'es-toolkit';
import { useI18n } from 'vue-i18n';
import { onBeforeRouteLeave } from 'vue-router';
import { usePopup } from '~/composables';
import {
  playerTrackingCleanup,
  playerTrackingGetSettings,
  playerTrackingGetStatus,
  playerTrackingResetSettings,
  playerTrackingUpdateSettings,
} from '~/generated/api/sdk.gen';

defineOptions({ name: 'PlayerTrackingSettingsPage' });

interface FormModel {
  isEnabled: boolean;
  trackSessions: boolean;
  trackActivityLogs: boolean;
  trackChatActivity: boolean;
  trackLocations: boolean;
  trackInventorySnapshots: boolean;
  trackItemAcquisitions: boolean;
  trackDailySummaries: boolean;
  locationSampleIntervalSeconds: number;
  locationMovementThresholdMeters: number;
  inventorySnapshotIntervalMinutes: number;
  inventorySnapshotOnJoin: boolean;
  inventorySnapshotOnLeave: boolean;
  retentionDays: number;
  locationRetentionDays: number;
  inventorySnapshotRetentionDays: number;
  itemAcquisitionRetentionDays: number;
  dailySummaryRetentionDays: number;
  maxActivityLogsPerPlayer: number;
  excludeAdmins: boolean;
  excludedPlayerIdsText: string;
}

type PlayerTrackingSettingsCompat = PlayerTrackingFeatureSettingsDto & {
  trackItemAcquisitions?: boolean;
  itemAcquisitionRetentionDays?: number;
};

const { t } = useI18n();
const { toast, confirm } = usePopup();

const isLoading = ref(false);
const isSubmitting = ref(false);
const isCleaning = ref(false);
const initialValues = ref<FormModel>(buildDefaults());
const form = reactive<FormModel>(buildDefaults());
const status = ref<PlayerTrackingStatusDto | null>(null);
const cleanupResult = ref<PlayerTrackingCleanupResultDto | null>(null);
const isDirty = computed(() => !isEqual(form, initialValues.value));

const statusCards = computed(() => [
  {
    label: t('views.playerTracking.settings.status.activeSessions'),
    value: status.value?.activeSessionCount ?? 0,
  },
  {
    label: t('views.playerTracking.settings.status.sessions'),
    value: status.value?.sessionCount ?? 0,
  },
  {
    label: t('views.playerTracking.settings.status.activities'),
    value: status.value?.activityCount ?? 0,
  },
  {
    label: t('views.playerTracking.settings.status.inventorySnapshots'),
    value: status.value?.inventorySnapshotCount ?? 0,
  },
]);

const strategySummary = computed(() => {
  if (!form.isEnabled)
    return t('views.playerTracking.settings.summaries.disabled');

  const enabled: string[] = [];
  if (form.trackSessions)
    enabled.push(t('views.playerTracking.settings.summaryParts.sessions'));
  if (form.trackActivityLogs)
    enabled.push(t('views.playerTracking.settings.summaryParts.activity'));
  if (form.trackLocations)
    enabled.push(t('views.playerTracking.settings.summaryParts.locations'));
  if (form.trackInventorySnapshots)
    enabled.push(t('views.playerTracking.settings.summaryParts.inventory'));
  if (form.trackItemAcquisitions)
    enabled.push('物品获得');
  if (form.trackDailySummaries)
    enabled.push(t('views.playerTracking.settings.summaryParts.daily'));

  return enabled.length === 0
    ? t('views.playerTracking.settings.summaries.enabledNoSources')
    : t('views.playerTracking.settings.summaries.enabled', { sources: enabled.join(', ') });
});

function buildDefaults(): FormModel {
  return {
    isEnabled: true,
    trackSessions: true,
    trackActivityLogs: true,
    trackChatActivity: true,
    trackLocations: false,
    trackInventorySnapshots: false,
    trackItemAcquisitions: false,
    trackDailySummaries: true,
    locationSampleIntervalSeconds: 120,
    locationMovementThresholdMeters: 25,
    inventorySnapshotIntervalMinutes: 30,
    inventorySnapshotOnJoin: false,
    inventorySnapshotOnLeave: true,
    retentionDays: 30,
    locationRetentionDays: 14,
    inventorySnapshotRetentionDays: 30,
    itemAcquisitionRetentionDays: 90,
    dailySummaryRetentionDays: 180,
    maxActivityLogsPerPlayer: 5000,
    excludeAdmins: false,
    excludedPlayerIdsText: '',
  };
}

function toTextList(value: string): string[] {
  return Array.from(new Set(
    value
      .split(/[\n,]/)
      .map(item => item.trim())
      .filter(Boolean),
  ));
}

function toFormModel(data?: PlayerTrackingFeatureSettingsDto | null): FormModel {
  const defaults = buildDefaults();
  const compatible = data as PlayerTrackingSettingsCompat | null | undefined;
  return {
    isEnabled: data?.isEnabled ?? defaults.isEnabled,
    trackSessions: data?.trackSessions ?? defaults.trackSessions,
    trackActivityLogs: data?.trackActivityLogs ?? defaults.trackActivityLogs,
    trackChatActivity: data?.trackChatActivity ?? defaults.trackChatActivity,
    trackLocations: data?.trackLocations ?? defaults.trackLocations,
    trackInventorySnapshots: data?.trackInventorySnapshots ?? defaults.trackInventorySnapshots,
    trackItemAcquisitions: compatible?.trackItemAcquisitions ?? defaults.trackItemAcquisitions,
    trackDailySummaries: data?.trackDailySummaries ?? defaults.trackDailySummaries,
    locationSampleIntervalSeconds: data?.locationSampleIntervalSeconds ?? defaults.locationSampleIntervalSeconds,
    locationMovementThresholdMeters: data?.locationMovementThresholdMeters ?? defaults.locationMovementThresholdMeters,
    inventorySnapshotIntervalMinutes: data?.inventorySnapshotIntervalMinutes ?? defaults.inventorySnapshotIntervalMinutes,
    inventorySnapshotOnJoin: data?.inventorySnapshotOnJoin ?? defaults.inventorySnapshotOnJoin,
    inventorySnapshotOnLeave: data?.inventorySnapshotOnLeave ?? defaults.inventorySnapshotOnLeave,
    retentionDays: data?.retentionDays ?? defaults.retentionDays,
    locationRetentionDays: data?.locationRetentionDays ?? defaults.locationRetentionDays,
    inventorySnapshotRetentionDays: data?.inventorySnapshotRetentionDays ?? defaults.inventorySnapshotRetentionDays,
    itemAcquisitionRetentionDays: compatible?.itemAcquisitionRetentionDays ?? defaults.itemAcquisitionRetentionDays,
    dailySummaryRetentionDays: data?.dailySummaryRetentionDays ?? defaults.dailySummaryRetentionDays,
    maxActivityLogsPerPlayer: data?.maxActivityLogsPerPlayer ?? defaults.maxActivityLogsPerPlayer,
    excludeAdmins: data?.excludeAdmins ?? defaults.excludeAdmins,
    excludedPlayerIdsText: (data?.excludedPlayerIds ?? []).join('\n'),
  };
}

function toPayload(values: FormModel): PlayerTrackingFeatureSettingsDto {
  const payload: PlayerTrackingSettingsCompat = {
    isEnabled: values.isEnabled,
    trackSessions: values.trackSessions,
    trackActivityLogs: values.trackActivityLogs,
    trackChatActivity: values.trackChatActivity,
    trackLocations: values.trackLocations,
    trackInventorySnapshots: values.trackInventorySnapshots,
    trackItemAcquisitions: values.trackItemAcquisitions,
    trackDailySummaries: values.trackDailySummaries,
    locationSampleIntervalSeconds: Number(values.locationSampleIntervalSeconds),
    locationMovementThresholdMeters: Number(values.locationMovementThresholdMeters),
    inventorySnapshotIntervalMinutes: Number(values.inventorySnapshotIntervalMinutes),
    inventorySnapshotOnJoin: values.inventorySnapshotOnJoin,
    inventorySnapshotOnLeave: values.inventorySnapshotOnLeave,
    retentionDays: Number(values.retentionDays),
    locationRetentionDays: Number(values.locationRetentionDays),
    inventorySnapshotRetentionDays: Number(values.inventorySnapshotRetentionDays),
    itemAcquisitionRetentionDays: Number(values.itemAcquisitionRetentionDays),
    dailySummaryRetentionDays: Number(values.dailySummaryRetentionDays),
    maxActivityLogsPerPlayer: Number(values.maxActivityLogsPerPlayer),
    excludeAdmins: values.excludeAdmins,
    excludedPlayerIds: toTextList(values.excludedPlayerIdsText),
  };
  return payload;
}

function applyFormModel(values: FormModel): void {
  initialValues.value = values;
  Object.assign(form, values);
}

function formatTime(value: string | null | undefined): string {
  return value ? dayjs(value).format('YYYY-MM-DD HH:mm:ss') : '-';
}

async function loadData(): Promise<void> {
  isLoading.value = true;
  try {
    const [{ data: settingsData }, { data: statusData }] = await Promise.all([
      playerTrackingGetSettings({ throwOnError: true }),
      playerTrackingGetStatus({ throwOnError: true }),
    ]);
    applyFormModel(toFormModel(settingsData));
    status.value = statusData ?? null;
  }
  finally {
    isLoading.value = false;
  }
}

async function loadStatus(): Promise<void> {
  const { data } = await playerTrackingGetStatus({ throwOnError: true });
  status.value = data ?? null;
}

async function saveSettings(): Promise<void> {
  isSubmitting.value = true;
  try {
    await playerTrackingUpdateSettings({ body: toPayload(form), throwOnError: true });
    toast({ type: 'success', text: t('views.playerTracking.settings.messages.saveSuccess') });
    await loadData();
  }
  finally {
    isSubmitting.value = false;
  }
}

async function resetSettings(): Promise<void> {
  const ok = await confirm({
    type: 'warning',
    text: t('views.playerTracking.settings.messages.resetConfirm'),
  });
  if (!ok)
    return;

  isSubmitting.value = true;
  try {
    const { data } = await playerTrackingResetSettings({ throwOnError: true });
    applyFormModel(toFormModel(data));
    toast({ type: 'success', text: t('views.playerTracking.settings.messages.resetSuccess') });
    await loadStatus();
  }
  finally {
    isSubmitting.value = false;
  }
}

async function cleanupTrackingData(): Promise<void> {
  const ok = await confirm({
    type: 'warning',
    text: t('views.playerTracking.settings.messages.cleanupConfirm'),
  });
  if (!ok)
    return;

  isCleaning.value = true;
  try {
    const { data } = await playerTrackingCleanup({ throwOnError: true });
    cleanupResult.value = data ?? null;
    toast({
      type: 'success',
      text: t('views.playerTracking.settings.messages.cleanupSuccess'),
    });
    await loadStatus();
  }
  finally {
    isCleaning.value = false;
  }
}

onMounted(loadData);

onBeforeRouteLeave(async () => {
  if (!isDirty.value)
    return true;

  return await confirm({
    type: 'warning',
    text: t('views.playerTracking.settings.messages.unsavedChanges'),
  });
});
</script>

<template>
  <div class="player-tracking-settings">
    <div class="player-tracking-settings__header">
      <div>
        <h2>{{ t('menus.playerTracking') }}</h2>
        <p>{{ t('views.playerTracking.settings.description') }}</p>
      </div>
      <div class="player-tracking-settings__header-actions">
        <el-tag :type="form.isEnabled ? 'success' : 'info'" effect="plain">
          {{ form.isEnabled ? t('common.enabled') : t('common.disabled') }}
        </el-tag>
        <el-switch
          v-model="form.isEnabled"
          inline-prompt
          :active-text="t('common.yes')"
          :inactive-text="t('common.no')"
        />
      </div>
    </div>

    <el-skeleton v-if="isLoading" :rows="10" animated />

    <template v-else>
      <section class="player-tracking-settings__overview">
        <div
          v-for="item in statusCards"
          :key="item.label"
          class="player-tracking-settings__metric"
        >
          <span>{{ item.label }}</span>
          <strong>{{ item.value }}</strong>
        </div>
      </section>

      <el-alert class="player-tracking-settings__summary" type="info" :closable="false" :title="strategySummary" />
      <el-alert v-if="status?.lastError" type="warning" :closable="false" :title="status.lastError" />

      <el-form label-position="top" class="player-tracking-settings__form">
        <section class="player-tracking-settings__panel">
          <div class="player-tracking-settings__section-title">
            <div>
              <h3>{{ t('views.playerTracking.settings.sections.core') }}</h3>
              <p>{{ t('views.playerTracking.settings.sectionDescriptions.core') }}</p>
            </div>
          </div>

          <div class="player-tracking-settings__checks">
            <el-checkbox v-model="form.trackSessions">
              {{ t('views.playerTracking.settings.fields.trackSessions') }}
            </el-checkbox>
            <el-checkbox v-model="form.trackActivityLogs">
              {{ t('views.playerTracking.settings.fields.trackActivityLogs') }}
            </el-checkbox>
            <el-checkbox v-model="form.trackChatActivity" :disabled="!form.trackActivityLogs">
              {{ t('views.playerTracking.settings.fields.trackChatActivity') }}
            </el-checkbox>
            <el-checkbox v-model="form.trackDailySummaries">
              {{ t('views.playerTracking.settings.fields.trackDailySummaries') }}
            </el-checkbox>
            <el-checkbox v-model="form.excludeAdmins">
              {{ t('views.playerTracking.settings.fields.excludeAdmins') }}
            </el-checkbox>
          </div>

          <el-row :gutter="16" class="mt-4">
            <el-col :xs="24" :md="8">
              <el-form-item :label="t('views.playerTracking.settings.fields.retentionDays')">
                <el-input-number v-model="form.retentionDays" class="w-full" :min="1" :precision="0" />
              </el-form-item>
            </el-col>
            <el-col :xs="24" :md="8">
              <el-form-item :label="t('views.playerTracking.settings.fields.dailySummaryRetentionDays')">
                <el-input-number v-model="form.dailySummaryRetentionDays" class="w-full" :min="1" :precision="0" />
              </el-form-item>
            </el-col>
            <el-col :xs="24" :md="8">
              <el-form-item :label="t('views.playerTracking.settings.fields.maxActivityLogsPerPlayer')">
                <el-input-number v-model="form.maxActivityLogsPerPlayer" class="w-full" :min="100" :precision="0" />
              </el-form-item>
            </el-col>
            <el-col :xs="24">
              <el-form-item :label="t('views.playerTracking.settings.fields.excludedPlayerIds')">
                <el-input
                  v-model="form.excludedPlayerIdsText"
                  type="textarea"
                  :rows="3"
                  :placeholder="t('views.playerTracking.settings.placeholders.excludedPlayerIds')"
                />
              </el-form-item>
            </el-col>
          </el-row>
        </section>

        <section class="player-tracking-settings__panel">
          <div class="player-tracking-settings__section-title">
            <div>
              <h3>{{ t('views.playerTracking.settings.sections.locations') }}</h3>
              <p>{{ t('views.playerTracking.settings.sectionDescriptions.locations') }}</p>
            </div>
            <el-switch
              v-model="form.trackLocations"
              inline-prompt
              :active-text="t('common.yes')"
              :inactive-text="t('common.no')"
            />
          </div>

          <el-row :gutter="16">
            <el-col :xs="24" :md="8">
              <el-form-item :label="t('views.playerTracking.settings.fields.locationSampleIntervalSeconds')">
                <el-input-number v-model="form.locationSampleIntervalSeconds" class="w-full" :min="30" :precision="0" />
              </el-form-item>
            </el-col>
            <el-col :xs="24" :md="8">
              <el-form-item :label="t('views.playerTracking.settings.fields.locationMovementThresholdMeters')">
                <el-input-number v-model="form.locationMovementThresholdMeters" class="w-full" :min="1" />
              </el-form-item>
            </el-col>
            <el-col :xs="24" :md="8">
              <el-form-item :label="t('views.playerTracking.settings.fields.locationRetentionDays')">
                <el-input-number v-model="form.locationRetentionDays" class="w-full" :min="1" :precision="0" />
              </el-form-item>
            </el-col>
          </el-row>
        </section>

        <section class="player-tracking-settings__panel">
          <div class="player-tracking-settings__section-title">
            <div>
              <h3>{{ t('views.playerTracking.settings.sections.inventory') }}</h3>
              <p>{{ t('views.playerTracking.settings.sectionDescriptions.inventory') }}</p>
            </div>
            <el-switch
              v-model="form.trackInventorySnapshots"
              inline-prompt
              :active-text="t('common.yes')"
              :inactive-text="t('common.no')"
            />
          </div>

          <div class="player-tracking-settings__checks">
            <el-checkbox v-model="form.inventorySnapshotOnJoin">
              {{ t('views.playerTracking.settings.fields.inventorySnapshotOnJoin') }}
            </el-checkbox>
            <el-checkbox v-model="form.inventorySnapshotOnLeave">
              {{ t('views.playerTracking.settings.fields.inventorySnapshotOnLeave') }}
            </el-checkbox>
            <el-checkbox v-model="form.trackItemAcquisitions">
              追踪物品获得来源
            </el-checkbox>
          </div>

          <el-row :gutter="16" class="mt-4">
            <el-col :xs="24" :md="12">
              <el-form-item :label="t('views.playerTracking.settings.fields.inventorySnapshotIntervalMinutes')">
                <el-input-number v-model="form.inventorySnapshotIntervalMinutes" class="w-full" :min="5" :precision="0" />
              </el-form-item>
            </el-col>
            <el-col :xs="24" :md="12">
              <el-form-item :label="t('views.playerTracking.settings.fields.inventorySnapshotRetentionDays')">
                <el-input-number v-model="form.inventorySnapshotRetentionDays" class="w-full" :min="1" :precision="0" />
              </el-form-item>
              <el-form-item label="物品获得记录保留天数">
                <el-input-number v-model="form.itemAcquisitionRetentionDays" class="w-full" :min="1" :precision="0" />
              </el-form-item>
            </el-col>
          </el-row>
        </section>
      </el-form>

      <section class="player-tracking-settings__runtime player-tracking-settings__panel">
        <div class="player-tracking-settings__section-title">
          <div>
            <h3>{{ t('views.playerTracking.settings.sections.status') }}</h3>
            <p>{{ t('views.playerTracking.settings.sectionDescriptions.status') }}</p>
          </div>
          <div class="player-tracking-settings__runtime-actions">
            <el-button size="small" @click="loadStatus">
              {{ t('components.myTable.refresh') }}
            </el-button>
            <el-button size="small" type="danger" plain :loading="isCleaning" @click="cleanupTrackingData">
              {{ t('views.playerTracking.settings.actions.cleanup') }}
            </el-button>
          </div>
        </div>

        <div class="player-tracking-settings__stats">
          <div class="player-tracking-settings__stat">
            <span>{{ t('views.playerTracking.settings.status.lastActivityAt') }}</span>
            <strong>{{ formatTime(status?.lastActivityAt) }}</strong>
          </div>
          <div class="player-tracking-settings__stat">
            <span>{{ t('views.playerTracking.settings.status.lastLocationSampleAt') }}</span>
            <strong>{{ formatTime(status?.lastLocationSampleAt) }}</strong>
          </div>
          <div class="player-tracking-settings__stat">
            <span>{{ t('views.playerTracking.settings.status.lastInventorySnapshotAt') }}</span>
            <strong>{{ formatTime(status?.lastInventorySnapshotAt) }}</strong>
          </div>
          <div class="player-tracking-settings__stat">
            <span>{{ t('views.playerTracking.settings.status.lastCleanupAt') }}</span>
            <strong>{{ formatTime(status?.lastCleanupAt) }}</strong>
          </div>
        </div>

        <el-descriptions v-if="cleanupResult" class="mt-4" :column="4" border>
          <el-descriptions-item :label="t('views.playerTracking.settings.cleanup.deletedActivities')">
            {{ cleanupResult.deletedActivities ?? 0 }}
          </el-descriptions-item>
          <el-descriptions-item :label="t('views.playerTracking.settings.cleanup.deletedLocations')">
            {{ cleanupResult.deletedLocations ?? 0 }}
          </el-descriptions-item>
          <el-descriptions-item :label="t('views.playerTracking.settings.cleanup.deletedInventorySnapshots')">
            {{ cleanupResult.deletedInventorySnapshots ?? 0 }}
          </el-descriptions-item>
          <el-descriptions-item :label="t('views.playerTracking.settings.cleanup.deletedDailySummaries')">
            {{ cleanupResult.deletedDailySummaries ?? 0 }}
          </el-descriptions-item>
        </el-descriptions>
      </section>

      <div class="player-tracking-settings__actions">
        <el-button :disabled="isSubmitting" @click="resetSettings">
          {{ t('common.reset') }}
        </el-button>
        <el-button type="primary" :loading="isSubmitting" :disabled="!isDirty" @click="saveSettings">
          {{ t('common.save') }}
        </el-button>
      </div>
    </template>
  </div>
</template>

<style scoped>
.player-tracking-settings {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.player-tracking-settings__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.player-tracking-settings__header-actions,
.player-tracking-settings__runtime-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.player-tracking-settings__header h2,
.player-tracking-settings h3 {
  margin: 0;
}

.player-tracking-settings__header p,
.player-tracking-settings__section-title p {
  margin: 6px 0 0;
  color: var(--el-text-color-secondary);
}

.player-tracking-settings__overview,
.player-tracking-settings__stats {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.player-tracking-settings__metric,
.player-tracking-settings__panel {
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  background: var(--el-bg-color);
}

.player-tracking-settings__metric {
  min-width: 0;
  padding: 12px;
}

.player-tracking-settings__metric span,
.player-tracking-settings__stat span,
.player-tracking-settings__section-title p {
  color: var(--el-text-color-secondary);
  font-size: 13px;
}

.player-tracking-settings__metric strong,
.player-tracking-settings__stat strong {
  display: block;
  margin-top: 8px;
  overflow-wrap: anywhere;
  font-size: 17px;
}

.player-tracking-settings__panel {
  padding: 16px;
}

.player-tracking-settings__section-title {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}

.player-tracking-settings__checks {
  display: flex;
  flex-wrap: wrap;
  gap: 12px 20px;
}

.player-tracking-settings__stat {
  min-width: 0;
}

.player-tracking-settings__actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

@media (max-width: 720px) {
  .player-tracking-settings__header,
  .player-tracking-settings__section-title,
  .player-tracking-settings__actions,
  .player-tracking-settings__header-actions,
  .player-tracking-settings__runtime-actions {
    flex-direction: column;
    align-items: stretch;
  }

  .player-tracking-settings__overview,
  .player-tracking-settings__stats {
    grid-template-columns: 1fr;
  }
}
</style>
