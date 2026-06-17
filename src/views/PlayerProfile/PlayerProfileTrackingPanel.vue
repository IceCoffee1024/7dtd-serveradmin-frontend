<script setup lang="ts">
import type {
  PlayerActivityLogDto,
  PlayerDailySummaryDto,
  PlayerInventorySnapshotDto,
  PlayerLocationSampleDto,
  PlayerSessionDto,
  PlayerTrackingActivityType,
} from '~/generated/api/types.gen';
import dayjs from 'dayjs';
import { useI18n } from 'vue-i18n';
import { usePopup } from '~/composables';
import {
  playerTrackingCaptureInventorySnapshot,
  playerTrackingGetPlayerActivities,
  playerTrackingGetPlayerDailySummaries,
  playerTrackingGetPlayerInventorySnapshots,
  playerTrackingGetPlayerLocations,
  playerTrackingGetPlayerSessions,
} from '~/generated/api/sdk.gen';

defineOptions({ name: 'PlayerProfileTrackingPanel' });

const props = defineProps<{
  playerId: string;
  isOnline: boolean;
  formatTime: (value: string | null | undefined) => string;
}>();

const { t } = useI18n();
const { toast } = usePopup();

const isLoading = ref(false);
const isCapturing = ref(false);
const sessions = ref<PlayerSessionDto[]>([]);
const activities = ref<PlayerActivityLogDto[]>([]);
const locations = ref<PlayerLocationSampleDto[]>([]);
const inventorySnapshots = ref<PlayerInventorySnapshotDto[]>([]);
const dailySummaries = ref<PlayerDailySummaryDto[]>([]);

const activityTypeOptions = computed(() => [
  { label: t('views.gameItems.all'), value: 'all' as const },
  { label: t('views.playerProfile.tracking.activityTypes.Login'), value: 'Login' as const },
  { label: t('views.playerProfile.tracking.activityTypes.Joined'), value: 'Joined' as const },
  { label: t('views.playerProfile.tracking.activityTypes.Left'), value: 'Left' as const },
  { label: t('views.playerProfile.tracking.activityTypes.Chat'), value: 'Chat' as const },
  { label: t('views.playerProfile.tracking.activityTypes.Death'), value: 'Death' as const },
  { label: t('views.playerProfile.tracking.activityTypes.KillZombie'), value: 'KillZombie' as const },
  { label: t('views.playerProfile.tracking.activityTypes.KillPlayer'), value: 'KillPlayer' as const },
  { label: t('views.playerProfile.tracking.activityTypes.Inventory'), value: 'Inventory' as const },
  { label: t('views.playerProfile.tracking.activityTypes.Session'), value: 'Session' as const },
]);
const activityType = ref<'all' | PlayerTrackingActivityType>('all');

const totalSessionSeconds = computed(() => sessions.value.reduce((total, item) => total + (item.durationSeconds ?? 0), 0));
const latestLocation = computed(() => locations.value[0]);
const latestInventory = computed(() => inventorySnapshots.value[0]);

function formatPosition(row: { x?: number | null; y?: number | null; z?: number | null }): string {
  if (row.x == null || row.y == null || row.z == null)
    return '-';
  return `${Math.round(row.x)}, ${Math.round(row.y)}, ${Math.round(row.z)}`;
}

function formatDurationSeconds(seconds: number | null | undefined): string {
  const value = Math.max(0, seconds ?? 0);
  const hours = Math.floor(value / 3600);
  const minutes = Math.floor((value % 3600) / 60);
  if (hours > 0)
    return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

function parseInventoryItems(json: string | null | undefined): unknown[] {
  if (!json)
    return [];

  try {
    const parsed = JSON.parse(json);
    return Array.isArray(parsed) ? parsed : [];
  }
  catch {
    return [];
  }
}

function snapshotSummary(row: PlayerInventorySnapshotDto): string {
  const bagCount = parseInventoryItems(row.bagJson).length;
  const beltCount = parseInventoryItems(row.beltJson).length;
  const equipmentCount = parseInventoryItems(row.equipmentJson).filter(Boolean).length;
  return t('views.playerProfile.tracking.snapshotSummary', {
    bag: bagCount,
    belt: beltCount,
    equipment: equipmentCount,
  });
}

async function loadTrackingData(): Promise<void> {
  if (!props.playerId)
    return;

  isLoading.value = true;
  try {
    const [
      sessionsResult,
      activitiesResult,
      locationsResult,
      inventoryResult,
      dailyResult,
    ] = await Promise.all([
      playerTrackingGetPlayerSessions({
        path: { playerId: props.playerId },
        query: { pageNumber: 1, pageSize: 8 },
        throwOnError: true,
      }),
      playerTrackingGetPlayerActivities({
        path: { playerId: props.playerId },
        query: {
          pageNumber: 1,
          pageSize: 12,
          activityType: activityType.value === 'all' ? null : activityType.value,
        },
        throwOnError: true,
      }),
      playerTrackingGetPlayerLocations({
        path: { playerId: props.playerId },
        query: { pageNumber: 1, pageSize: 8 },
        throwOnError: true,
      }),
      playerTrackingGetPlayerInventorySnapshots({
        path: { playerId: props.playerId },
        query: { pageNumber: 1, pageSize: 8 },
        throwOnError: true,
      }),
      playerTrackingGetPlayerDailySummaries({
        path: { playerId: props.playerId },
        query: {
          pageNumber: 1,
          pageSize: 14,
          startTime: dayjs().subtract(13, 'day').startOf('day').toISOString(),
          endTime: dayjs().endOf('day').toISOString(),
        },
        throwOnError: true,
      }),
    ]);

    sessions.value = sessionsResult.data?.items ?? [];
    activities.value = activitiesResult.data?.items ?? [];
    locations.value = locationsResult.data?.items ?? [];
    inventorySnapshots.value = inventoryResult.data?.items ?? [];
    dailySummaries.value = dailyResult.data?.items ?? [];
  }
  finally {
    isLoading.value = false;
  }
}

async function captureInventorySnapshot(): Promise<void> {
  if (!props.playerId)
    return;

  isCapturing.value = true;
  try {
    const { data } = await playerTrackingCaptureInventorySnapshot({
      path: { playerId: props.playerId },
      throwOnError: true,
    });
    toast({
      type: 'success',
      text: t('views.playerProfile.tracking.messages.captureSuccess', { count: data?.totalItemCount ?? 0 }),
    });
    await loadTrackingData();
  }
  finally {
    isCapturing.value = false;
  }
}

watch(() => props.playerId, loadTrackingData, { immediate: true });
watch(activityType, loadTrackingData);
</script>

<template>
  <div v-loading="isLoading" class="profile-panel-stack">
    <section class="profile-panel">
      <div class="profile-panel__header">
        <h3>{{ t('views.playerProfile.sections.trackingOverview') }}</h3>
        <el-button size="small" @click="loadTrackingData">
          {{ t('components.myTable.refresh') }}
        </el-button>
      </div>

      <div class="tracking-summary">
        <div>
          <span>{{ t('views.playerProfile.tracking.totalSessionTime') }}</span>
          <strong>{{ formatDurationSeconds(totalSessionSeconds) }}</strong>
        </div>
        <div>
          <span>{{ t('views.playerProfile.tracking.sessionCount') }}</span>
          <strong>{{ sessions.length }}</strong>
        </div>
        <div>
          <span>{{ t('views.playerProfile.tracking.lastLocation') }}</span>
          <strong>{{ latestLocation ? formatPosition(latestLocation) : '-' }}</strong>
        </div>
        <div>
          <span>{{ t('views.playerProfile.tracking.lastInventorySnapshot') }}</span>
          <strong>{{ formatTime(latestInventory?.createdAt) }}</strong>
        </div>
      </div>
    </section>

    <section class="profile-panel">
      <div class="profile-panel__header">
        <h3>{{ t('views.playerProfile.sections.sessions') }}</h3>
      </div>
      <el-table :data="sessions" size="small" border>
        <el-table-column :label="t('views.playerProfile.tracking.startedAt')" width="170">
          <template #default="{ row }">
            {{ formatTime(row.startedAt) }}
          </template>
        </el-table-column>
        <el-table-column :label="t('views.playerProfile.tracking.endedAt')" width="170">
          <template #default="{ row }">
            {{ formatTime(row.endedAt) }}
          </template>
        </el-table-column>
        <el-table-column :label="t('views.playerProfile.tracking.duration')" width="120">
          <template #default="{ row }">
            {{ formatDurationSeconds(row.durationSeconds) }}
          </template>
        </el-table-column>
        <el-table-column prop="endReason" :label="t('views.playerProfile.tracking.endReason')" width="140" />
        <el-table-column :label="t('views.playerList.position')">
          <template #default="{ row }">
            {{ formatPosition({ x: row.lastKnownX, y: row.lastKnownY, z: row.lastKnownZ }) }}
          </template>
        </el-table-column>
      </el-table>
    </section>

    <section class="profile-panel">
      <div class="profile-panel__header">
        <h3>{{ t('views.playerProfile.sections.trackingActivity') }}</h3>
        <el-segmented
          v-model="activityType"
          :options="activityTypeOptions"
          size="small"
        />
      </div>
      <el-table :data="activities" size="small" border>
        <el-table-column :label="t('views.playerProfile.tracking.createdAt')" width="170">
          <template #default="{ row }">
            {{ formatTime(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column :label="t('views.playerProfile.tracking.activityType')" width="130">
          <template #default="{ row }">
            <el-tag effect="plain" size="small">
              {{ t(`views.playerProfile.tracking.activityTypes.${row.activityType ?? 'Session'}`) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="summary" :label="t('views.playerProfile.tracking.summary')" min-width="180" />
        <el-table-column :label="t('views.playerList.position')" width="130">
          <template #default="{ row }">
            {{ formatPosition(row) }}
          </template>
        </el-table-column>
      </el-table>
    </section>

    <section class="profile-panel">
      <div class="profile-panel__header">
        <h3>{{ t('views.playerProfile.sections.locations') }}</h3>
      </div>
      <el-table :data="locations" size="small" border>
        <el-table-column :label="t('views.playerProfile.tracking.createdAt')" width="170">
          <template #default="{ row }">
            {{ formatTime(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column prop="source" :label="t('views.playerProfile.tracking.source')" width="120" />
        <el-table-column prop="worldName" :label="t('views.playerProfile.tracking.worldName')" min-width="140" />
        <el-table-column :label="t('views.playerList.position')">
          <template #default="{ row }">
            {{ formatPosition(row) }}
          </template>
        </el-table-column>
      </el-table>
    </section>

    <section class="profile-panel">
      <div class="profile-panel__header">
        <h3>{{ t('views.playerProfile.sections.inventorySnapshots') }}</h3>
        <el-button size="small" type="primary" :loading="isCapturing" :disabled="!isOnline" @click="captureInventorySnapshot">
          {{ t('views.playerProfile.tracking.captureInventorySnapshot') }}
        </el-button>
      </div>
      <el-table :data="inventorySnapshots" size="small" border>
        <el-table-column :label="t('views.playerProfile.tracking.createdAt')" width="170">
          <template #default="{ row }">
            {{ formatTime(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column prop="snapshotReason" :label="t('views.playerProfile.tracking.snapshotReason')" width="120" />
        <el-table-column prop="totalItemCount" :label="t('views.playerProfile.tracking.totalItemCount')" width="120" />
        <el-table-column :label="t('views.playerProfile.tracking.snapshotContents')" min-width="220">
          <template #default="{ row }">
            {{ snapshotSummary(row) }}
          </template>
        </el-table-column>
      </el-table>
    </section>

    <section class="profile-panel">
      <div class="profile-panel__header">
        <h3>{{ t('views.playerProfile.sections.dailySummaries') }}</h3>
      </div>
      <el-table :data="dailySummaries" size="small" border>
        <el-table-column :label="t('views.playerProfile.governance.date')" width="130">
          <template #default="{ row }">
            {{ row.date ? dayjs(row.date).format('YYYY-MM-DD') : '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="loginCount" :label="t('views.playerProfile.tracking.loginCount')" width="100" />
        <el-table-column prop="chatCount" :label="t('views.playerProfile.tracking.chatCount')" width="100" />
        <el-table-column prop="deathCount" :label="t('views.playerProfile.tracking.deathCount')" width="100" />
        <el-table-column prop="killZombieCount" :label="t('views.playerProfile.tracking.killZombieCount')" width="120" />
        <el-table-column prop="killPlayerCount" :label="t('views.playerProfile.tracking.killPlayerCount')" width="120" />
        <el-table-column :label="t('views.playerProfile.tracking.sessionSeconds')" width="130">
          <template #default="{ row }">
            {{ formatDurationSeconds(row.sessionSeconds) }}
          </template>
        </el-table-column>
        <el-table-column :label="t('views.playerProfile.tracking.distanceTravelled')" width="150">
          <template #default="{ row }">
            {{ Math.round(row.distanceTravelled ?? 0) }}m
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

.profile-panel__header :deep(.el-segmented) {
  max-width: 100%;
  overflow-x: auto;
}

.tracking-summary {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.tracking-summary > div {
  min-width: 0;
  padding: 12px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
}

.tracking-summary span {
  color: var(--el-text-color-secondary);
  font-size: 13px;
}

.tracking-summary strong {
  display: block;
  margin-top: 8px;
  overflow-wrap: anywhere;
  font-size: 17px;
}

@media (max-width: 960px) {
  .profile-panel__header {
    align-items: flex-start;
    flex-direction: column;
  }

  .tracking-summary {
    grid-template-columns: 1fr;
  }
}
</style>
