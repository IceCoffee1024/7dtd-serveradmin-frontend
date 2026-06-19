<script setup lang="ts">
import type {
  PlayerActivityLogDto,
  PlayerDailySummaryDto,
  PlayerInventoryCompensationDraftDto,
  PlayerInventoryCompensationExecuteResultDto,
  PlayerInventoryDiffItemDto,
  PlayerInventorySnapshotCompareDto,
  PlayerInventorySnapshotDto,
  PlayerLocationRegionHitDto,
  PlayerLocationSampleDto,
  PlayerLocationTrackDto,
  PlayerSessionDto,
  PlayerTrackingActivityType,
} from '~/generated/api/types.gen';
import dayjs from 'dayjs';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import { usePopup } from '~/composables';
import {
  playerTrackingCaptureInventorySnapshot,
  playerTrackingComparePlayerInventorySnapshots,
  playerTrackingCreateInventoryCompensationDraft,
  playerTrackingExecuteInventoryCompensation,
  playerTrackingGetPlayerActivities,
  playerTrackingGetPlayerDailySummaries,
  playerTrackingGetPlayerInventorySnapshots,
  playerTrackingGetPlayerLocations,
  playerTrackingGetPlayerLocationTrack,
  playerTrackingGetPlayerSessions,
  playerTrackingSearchLocationRegion,
} from '~/generated/api/sdk.gen';

defineOptions({ name: 'PlayerProfileTrackingPanel' });

const props = defineProps<{
  playerId: string;
  isOnline: boolean;
  formatTime: (value: string | null | undefined) => string;
}>();

interface PlayerInventoryCompensationExecuteItem {
  itemKey?: string;
  itemName?: string;
  localizationName?: string | null;
  count?: number;
  quality?: number | null;
  durabilityPercent?: number | null;
  hasMods?: boolean;
  mods?: string[];
  succeeded?: boolean;
  message?: string | null;
}

type PlayerInventoryCompensationExecuteResult = PlayerInventoryCompensationExecuteResultDto & {
  items?: PlayerInventoryCompensationExecuteItem[];
};

const { t } = useI18n();
const { toast, confirm } = usePopup();
const route = useRoute();
const router = useRouter();

const isLoading = ref(false);
const isCapturing = ref(false);
const isComparing = ref(false);
const isDrafting = ref(false);
const isExecuting = ref(false);
const isLoadingTrack = ref(false);
const isSearchingRegion = ref(false);

const sessions = ref<PlayerSessionDto[]>([]);
const activities = ref<PlayerActivityLogDto[]>([]);
const locations = ref<PlayerLocationSampleDto[]>([]);
const inventorySnapshots = ref<PlayerInventorySnapshotDto[]>([]);
const dailySummaries = ref<PlayerDailySummaryDto[]>([]);
const compareResult = ref<PlayerInventorySnapshotCompareDto | null>(null);
const compensationDraft = ref<PlayerInventoryCompensationDraftDto | null>(null);
const compensationResult = ref<PlayerInventoryCompensationExecuteResult | null>(null);
const locationTrack = ref<PlayerLocationTrackDto | null>(null);
const regionHits = ref<PlayerLocationRegionHitDto[]>([]);

const selectedFromSnapshotId = ref<number>();
const selectedToSnapshotId = ref<number>();
const selectedDiffKeys = ref<string[]>([]);
const compensationTicketId = ref('');
const compensationReason = ref('');
const requireExactRestore = ref(true);

const trackRange = reactive({
  startTime: dayjs().subtract(2, 'hour').format('YYYY-MM-DDTHH:mm'),
  endTime: dayjs().format('YYYY-MM-DDTHH:mm'),
  minDistance: 25,
});

const regionQuery = reactive({
  startTime: dayjs().subtract(2, 'hour').format('YYYY-MM-DDTHH:mm'),
  endTime: dayjs().format('YYYY-MM-DDTHH:mm'),
  centerX: undefined as number | undefined,
  centerZ: undefined as number | undefined,
  radius: 100,
});

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
const snapshotOptions = computed(() => inventorySnapshots.value
  .filter((item): item is PlayerInventorySnapshotDto & { id: number } => typeof item.id === 'number')
  .map(item => ({
    label: `#${item.id} ${props.formatTime(item.createdAt)} (${item.totalItemCount ?? 0})`,
    value: item.id,
  })));
const lostDiffItems = computed(() => (compareResult.value?.items ?? []).filter(item => item.diffType === 'Removed' && item.before?.key));
const selectedLostDiffItems = computed(() => lostDiffItems.value.filter(item => item.before?.key && selectedDiffKeys.value.includes(item.before.key)));
const canCreateCompensation = computed(() => selectedLostDiffItems.value.length > 0 && selectedFromSnapshotId.value && selectedToSnapshotId.value);
const canViewRegionOnMap = computed(() => regionQuery.centerX != null && regionQuery.centerZ != null && regionQuery.radius > 0);

function queryNumber(value: unknown): number | undefined {
  const raw = Array.isArray(value) ? value[0] : value;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function toIso(value: string | undefined): string | undefined {
  if (!value)
    return undefined;
  return dayjs(value).toISOString();
}

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

function formatDistance(value: number | null | undefined): string {
  return `${Math.round(value ?? 0)}m`;
}

function formatItemName(row: { localizationName?: string | null; itemName?: string | null }): string {
  return row.localizationName || row.itemName || '-';
}

function formatDurability(value: number | null | undefined): string {
  if (value == null)
    return '-';
  return `${Math.round(value)}%`;
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

function diffDisplayItem(row: PlayerInventoryDiffItemDto) {
  return row.before ?? row.after ?? {};
}

function isDiffSelected(key: string | null | undefined): boolean {
  return !!key && selectedDiffKeys.value.includes(key);
}

function toggleDiffSelection(key: string | null | undefined, checked: string | number | boolean): void {
  if (!key)
    return;

  const isChecked = Boolean(checked);
  if (isChecked && selectedDiffKeys.value.includes(key) === false) {
    selectedDiffKeys.value = [...selectedDiffKeys.value, key];
  }
  else if (isChecked === false) {
    selectedDiffKeys.value = selectedDiffKeys.value.filter(item => item !== key);
  }
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
        query: { pageNumber: 1, pageSize: 20 },
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
    if (!selectedToSnapshotId.value)
      selectedToSnapshotId.value = inventorySnapshots.value[0]?.id;
    if (!selectedFromSnapshotId.value)
      selectedFromSnapshotId.value = inventorySnapshots.value[1]?.id;
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

async function compareInventorySnapshots(): Promise<void> {
  if (!props.playerId || !selectedFromSnapshotId.value || !selectedToSnapshotId.value)
    return;

  isComparing.value = true;
  compensationDraft.value = null;
  compensationResult.value = null;
  selectedDiffKeys.value = [];
  try {
    const { data } = await playerTrackingComparePlayerInventorySnapshots({
      path: { playerId: props.playerId },
      query: {
        fromSnapshotId: selectedFromSnapshotId.value,
        toSnapshotId: selectedToSnapshotId.value,
      },
      throwOnError: true,
    });
    compareResult.value = data ?? null;
    selectedDiffKeys.value = lostDiffItems.value
      .filter(item => item.isCompensable !== false && item.before?.key)
      .map(item => item.before!.key!);
  }
  finally {
    isComparing.value = false;
  }
}

async function createCompensationDraft(): Promise<void> {
  if (!props.playerId || !canCreateCompensation.value)
    return;

  isDrafting.value = true;
  compensationResult.value = null;
  try {
    const { data } = await playerTrackingCreateInventoryCompensationDraft({
      path: { playerId: props.playerId },
      body: {
        fromSnapshotId: selectedFromSnapshotId.value,
        toSnapshotId: selectedToSnapshotId.value,
        ticketId: compensationTicketId.value || null,
        reason: compensationReason.value || null,
        itemKeys: selectedDiffKeys.value,
      },
      throwOnError: true,
    });
    compensationDraft.value = data ?? null;
    if (data?.warning) {
      toast({ type: 'warning', text: data.warning });
    }
  }
  finally {
    isDrafting.value = false;
  }
}

async function executeCompensation(): Promise<void> {
  if (!props.playerId || !compensationDraft.value)
    return;

  const ok = await confirm({
    type: 'warning',
    text: t('views.playerProfile.tracking.messages.executeCompensationConfirm'),
  });
  if (!ok)
    return;

  isExecuting.value = true;
  try {
    const { data } = await playerTrackingExecuteInventoryCompensation({
      path: { playerId: props.playerId },
      body: {
        draft: compensationDraft.value,
        requireExactRestore: requireExactRestore.value,
      },
      throwOnError: true,
    });
    compensationResult.value = data ?? null;
    toast({
      type: data?.succeeded ? 'success' : 'warning',
      text: t('views.playerProfile.tracking.messages.executeCompensationSuccess', { count: data?.grantedItemCount ?? 0 }),
    });
  }
  finally {
    isExecuting.value = false;
  }
}

function openTrackOnMap(): void {
  void router.push({
    name: 'GPSMap',
    params: { locale: route.params.locale },
    query: {
      trackingPlayerId: props.playerId,
      trackingStartTime: toIso(trackRange.startTime),
      trackingEndTime: toIso(trackRange.endTime),
      trackingMinDistance: String(trackRange.minDistance),
      ...(regionQuery.centerX != null ? { regionCenterX: String(regionQuery.centerX) } : {}),
      ...(regionQuery.centerZ != null ? { regionCenterZ: String(regionQuery.centerZ) } : {}),
      ...(regionQuery.radius != null ? { regionRadius: String(regionQuery.radius) } : {}),
    },
  });
}

function selectRegionOnMap(): void {
  void router.push({
    name: 'GPSMap',
    params: { locale: route.params.locale },
    query: {
      pickRegionForPlayerId: props.playerId,
      pickRegionStartTime: toIso(regionQuery.startTime),
      pickRegionEndTime: toIso(regionQuery.endTime),
      pickRegionRadius: String(regionQuery.radius),
    },
  });
}

function viewRegionOnMap(): void {
  if (!canViewRegionOnMap.value)
    return;

  void router.push({
    name: 'GPSMap',
    params: { locale: route.params.locale },
    query: {
      regionCenterX: String(regionQuery.centerX),
      regionCenterZ: String(regionQuery.centerZ),
      regionRadius: String(regionQuery.radius),
    },
  });
}

function applyRegionFromQuery(): void {
  const centerX = queryNumber(route.query.regionCenterX);
  const centerZ = queryNumber(route.query.regionCenterZ);
  const radius = queryNumber(route.query.regionRadius);
  const startTime = Array.isArray(route.query.regionStartTime) ? route.query.regionStartTime[0] : route.query.regionStartTime;
  const endTime = Array.isArray(route.query.regionEndTime) ? route.query.regionEndTime[0] : route.query.regionEndTime;

  if (centerX != null)
    regionQuery.centerX = centerX;
  if (centerZ != null)
    regionQuery.centerZ = centerZ;
  if (radius != null && radius > 0)
    regionQuery.radius = radius;
  if (typeof startTime === 'string' && startTime.length > 0)
    regionQuery.startTime = dayjs(startTime).format('YYYY-MM-DDTHH:mm');
  if (typeof endTime === 'string' && endTime.length > 0)
    regionQuery.endTime = dayjs(endTime).format('YYYY-MM-DDTHH:mm');
}

async function loadLocationTrack(): Promise<void> {
  if (!props.playerId)
    return;

  isLoadingTrack.value = true;
  try {
    const { data } = await playerTrackingGetPlayerLocationTrack({
      path: { playerId: props.playerId },
      query: {
        startTime: toIso(trackRange.startTime),
        endTime: toIso(trackRange.endTime),
        minDistance: trackRange.minDistance,
        maxPoints: 200,
      },
      throwOnError: true,
    });
    locationTrack.value = data ?? null;
  }
  finally {
    isLoadingTrack.value = false;
  }
}

async function searchRegion(): Promise<void> {
  isSearchingRegion.value = true;
  try {
    const { data } = await playerTrackingSearchLocationRegion({
      query: {
        startTime: toIso(regionQuery.startTime),
        endTime: toIso(regionQuery.endTime),
        centerX: regionQuery.centerX,
        centerZ: regionQuery.centerZ,
        radius: regionQuery.radius,
        pageNumber: 1,
        pageSize: 20,
      },
      throwOnError: true,
    });
    regionHits.value = data?.items ?? [];
  }
  finally {
    isSearchingRegion.value = false;
  }
}

watch(() => props.playerId, () => {
  applyRegionFromQuery();
  void loadTrackingData();
}, { immediate: true });
watch(activityType, loadTrackingData);
watch(() => route.query, applyRegionFromQuery);
</script>

<template>
  <div v-loading="isLoading" class="profile-panel-stack profile-tracking-panel">
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
        <h3>{{ t('views.playerProfile.sections.inventoryDiff') }}</h3>
      </div>
      <div class="tracking-controls">
        <el-select v-model="selectedFromSnapshotId" :placeholder="t('views.playerProfile.tracking.fromSnapshot')" filterable>
          <el-option v-for="item in snapshotOptions" :key="`from-${item.value}`" :label="item.label" :value="item.value" />
        </el-select>
        <el-select v-model="selectedToSnapshotId" :placeholder="t('views.playerProfile.tracking.toSnapshot')" filterable>
          <el-option v-for="item in snapshotOptions" :key="`to-${item.value}`" :label="item.label" :value="item.value" />
        </el-select>
        <el-button type="primary" :loading="isComparing" :disabled="!selectedFromSnapshotId || !selectedToSnapshotId" @click="compareInventorySnapshots">
          {{ t('views.playerProfile.tracking.compareSnapshots') }}
        </el-button>
      </div>

      <div v-if="compareResult" class="tracking-diff-summary">
        <el-tag type="danger" effect="plain">
          {{ t('views.playerProfile.tracking.removedCount', { count: compareResult.removedCount ?? 0 }) }}
        </el-tag>
        <el-tag type="success" effect="plain">
          {{ t('views.playerProfile.tracking.addedCount', { count: compareResult.addedCount ?? 0 }) }}
        </el-tag>
        <el-tag effect="plain">
          {{ t('views.playerProfile.tracking.changedCount', { count: compareResult.changedCount ?? 0 }) }}
        </el-tag>
        <el-tag effect="plain">
          {{ t('views.playerProfile.tracking.movedCount', { count: compareResult.movedCount ?? 0 }) }}
        </el-tag>
      </div>

      <el-table v-if="compareResult" :data="compareResult.items ?? []" size="small" border>
        <el-table-column width="46">
          <template #default="{ row }">
            <el-checkbox
              v-if="row.diffType === 'Removed' && row.before?.key"
              :model-value="isDiffSelected(row.before.key)"
              :label="row.before.key"
              @update:model-value="toggleDiffSelection(row.before.key, $event)"
            >
              <span class="sr-only">{{ row.before.key }}</span>
            </el-checkbox>
          </template>
        </el-table-column>
        <el-table-column prop="diffType" :label="t('views.playerProfile.tracking.diffType')" width="140" />
        <el-table-column :label="t('views.playerProfile.tracking.item')" min-width="180">
          <template #default="{ row }">
            {{ formatItemName(diffDisplayItem(row)) }}
          </template>
        </el-table-column>
        <el-table-column :label="t('views.playerProfile.tracking.countDelta')" width="110">
          <template #default="{ row }">
            {{ row.countDelta ?? 0 }}
          </template>
        </el-table-column>
        <el-table-column :label="t('views.playerProfile.tracking.quality')" width="100">
          <template #default="{ row }">
            {{ diffDisplayItem(row).quality ?? '-' }}
          </template>
        </el-table-column>
        <el-table-column :label="t('views.playerProfile.tracking.durability')" width="120">
          <template #default="{ row }">
            {{ formatDurability(diffDisplayItem(row).durabilityPercent) }}
          </template>
        </el-table-column>
        <el-table-column :label="t('views.playerProfile.tracking.mods')" min-width="160">
          <template #default="{ row }">
            {{ (diffDisplayItem(row).mods ?? []).join(', ') || '-' }}
          </template>
        </el-table-column>
      </el-table>
    </section>

    <section class="profile-panel">
      <div class="profile-panel__header">
        <h3>{{ t('views.playerProfile.sections.inventoryCompensation') }}</h3>
      </div>
      <div class="tracking-controls">
        <el-input v-model="compensationTicketId" :placeholder="t('views.playerProfile.tracking.ticketId')" />
        <el-input v-model="compensationReason" :placeholder="t('views.playerProfile.tracking.compensationReason')" />
        <el-button type="primary" :loading="isDrafting" :disabled="!canCreateCompensation" @click="createCompensationDraft">
          {{ t('views.playerProfile.tracking.createCompensationDraft') }}
        </el-button>
      </div>
      <el-alert
        v-if="compensationDraft?.warning"
        class="tracking-alert"
        type="warning"
        :closable="false"
        :title="compensationDraft.warning"
      />
      <el-table :data="compensationDraft?.items ?? []" size="small" border>
        <el-table-column :label="t('views.playerProfile.tracking.item')" min-width="180">
          <template #default="{ row }">
            {{ formatItemName(row) }}
          </template>
        </el-table-column>
        <el-table-column prop="count" :label="t('views.playerProfile.tracking.count')" width="90" />
        <el-table-column prop="quality" :label="t('views.playerProfile.tracking.quality')" width="90" />
        <el-table-column :label="t('views.playerProfile.tracking.durability')" width="120">
          <template #default="{ row }">
            {{ formatDurability(row.durabilityPercent) }}
          </template>
        </el-table-column>
        <el-table-column :label="t('views.playerProfile.tracking.exactRestore')" width="130">
          <template #default="{ row }">
            <el-tag :type="row.exactRestoreSupported ? 'success' : 'warning'" effect="plain">
              {{ row.exactRestoreSupported ? t('common.yes') : t('common.no') }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>
      <div class="tracking-actions">
        <el-checkbox v-model="requireExactRestore">
          {{ t('views.playerProfile.tracking.requireExactRestore') }}
        </el-checkbox>
        <el-button type="danger" :loading="isExecuting" :disabled="!compensationDraft || !isOnline" @click="executeCompensation">
          {{ t('views.playerProfile.tracking.executeCompensation') }}
        </el-button>
      </div>
      <div v-if="compensationResult" class="tracking-result-block">
        <div class="tracking-diff-summary">
          <el-tag :type="compensationResult.succeeded ? 'success' : 'warning'" effect="plain">
            {{ compensationResult.succeeded ? t('views.playerProfile.tracking.compensationSucceeded') : t('views.playerProfile.tracking.compensationFailed') }}
          </el-tag>
          <el-tag effect="plain">
            {{ t('views.playerProfile.tracking.requestedItems', { count: compensationResult.requestedItemCount ?? 0 }) }}
          </el-tag>
          <el-tag effect="plain">
            {{ t('views.playerProfile.tracking.grantedItems', { count: compensationResult.grantedItemCount ?? 0 }) }}
          </el-tag>
        </div>
        <el-alert
          v-if="compensationResult.errorMessage"
          class="tracking-alert"
          type="warning"
          :closable="false"
          :title="compensationResult.errorMessage"
        />
        <el-table :data="compensationResult.items ?? []" size="small" border>
          <el-table-column :label="t('views.playerProfile.tracking.status')" width="110">
            <template #default="{ row }">
              <el-tag :type="row.succeeded ? 'success' : 'danger'" effect="plain">
                {{ row.succeeded ? t('views.playerProfile.tracking.succeeded') : t('views.playerProfile.tracking.failed') }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column :label="t('views.playerProfile.tracking.item')" min-width="180">
            <template #default="{ row }">
              {{ formatItemName(row) }}
            </template>
          </el-table-column>
          <el-table-column prop="count" :label="t('views.playerProfile.tracking.count')" width="90" />
          <el-table-column prop="quality" :label="t('views.playerProfile.tracking.quality')" width="90" />
          <el-table-column :label="t('views.playerProfile.tracking.durability')" width="120">
            <template #default="{ row }">
              {{ formatDurability(row.durabilityPercent) }}
            </template>
          </el-table-column>
          <el-table-column :label="t('views.playerProfile.tracking.message')" min-width="220">
            <template #default="{ row }">
              {{ row.message || '-' }}
            </template>
          </el-table-column>
        </el-table>
      </div>
    </section>

    <section class="profile-panel">
      <div class="profile-panel__header">
        <h3>{{ t('views.playerProfile.sections.locationTrack') }}</h3>
      </div>
      <div class="tracking-controls">
        <el-input v-model="trackRange.startTime" type="datetime-local" />
        <el-input v-model="trackRange.endTime" type="datetime-local" />
        <el-input-number v-model="trackRange.minDistance" :min="0" :max="1000" />
        <el-button type="primary" :loading="isLoadingTrack" @click="loadLocationTrack">
          {{ t('views.playerProfile.tracking.loadTrack') }}
        </el-button>
        <el-button :disabled="!props.playerId" @click="openTrackOnMap">
          {{ t('views.playerProfile.tracking.viewTrackOnMap') }}
        </el-button>
      </div>
      <div v-if="locationTrack" class="tracking-diff-summary">
        <el-tag effect="plain">
          {{ t('views.playerProfile.tracking.trackPoints', { returned: locationTrack.returnedPoints ?? 0, total: locationTrack.totalPoints ?? 0 }) }}
        </el-tag>
        <el-tag effect="plain">
          {{ t('views.playerProfile.tracking.trackDistance', { distance: formatDistance(locationTrack.distanceTravelled) }) }}
        </el-tag>
      </div>
      <el-table :data="locationTrack?.points ?? []" size="small" border>
        <el-table-column :label="t('views.playerProfile.tracking.createdAt')" width="170">
          <template #default="{ row }">
            {{ formatTime(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column prop="source" :label="t('views.playerProfile.tracking.source')" width="120" />
        <el-table-column :label="t('views.playerList.position')">
          <template #default="{ row }">
            {{ formatPosition(row) }}
          </template>
        </el-table-column>
      </el-table>
    </section>

    <section class="profile-panel">
      <div class="profile-panel__header">
        <h3>{{ t('views.playerProfile.sections.regionSearch') }}</h3>
      </div>
      <div class="tracking-controls tracking-controls--region">
        <el-input v-model="regionQuery.startTime" type="datetime-local" />
        <el-input v-model="regionQuery.endTime" type="datetime-local" />
        <el-input-number v-model="regionQuery.centerX" :placeholder="t('views.playerProfile.tracking.centerX')" />
        <el-input-number v-model="regionQuery.centerZ" :placeholder="t('views.playerProfile.tracking.centerZ')" />
        <el-input-number v-model="regionQuery.radius" :min="1" :max="5000" />
        <el-button type="primary" :loading="isSearchingRegion" @click="searchRegion">
          {{ t('views.playerProfile.tracking.searchRegion') }}
        </el-button>
        <el-button @click="selectRegionOnMap">
          {{ t('views.playerProfile.tracking.selectRegionOnMap') }}
        </el-button>
        <el-button :disabled="!canViewRegionOnMap" @click="viewRegionOnMap">
          {{ t('views.playerProfile.tracking.viewRegionOnMap') }}
        </el-button>
      </div>
      <el-table :data="regionHits" size="small" border>
        <el-table-column prop="playerName" :label="t('views.playerList.playerName')" min-width="160" />
        <el-table-column prop="playerId" :label="t('views.playerList.playerId')" min-width="180" />
        <el-table-column prop="hitCount" :label="t('views.playerProfile.tracking.hitCount')" width="100" />
        <el-table-column :label="t('views.playerProfile.tracking.firstSeenAt')" width="170">
          <template #default="{ row }">
            {{ formatTime(row.firstSeenAt) }}
          </template>
        </el-table-column>
        <el-table-column :label="t('views.playerProfile.tracking.lastSeenAt')" width="170">
          <template #default="{ row }">
            {{ formatTime(row.lastSeenAt) }}
          </template>
        </el-table-column>
        <el-table-column :label="t('views.playerList.position')" width="140">
          <template #default="{ row }">
            {{ formatPosition({ x: row.lastX, y: row.lastY, z: row.lastZ }) }}
          </template>
        </el-table-column>
      </el-table>
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

.tracking-controls {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  margin-bottom: 12px;
}

.tracking-controls--region {
  grid-template-columns: repeat(6, minmax(0, 1fr));
}

.tracking-diff-summary,
.tracking-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin: 10px 0 12px;
}

.tracking-alert {
  margin-bottom: 12px;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

@media (max-width: 1180px) {
  .tracking-controls,
  .tracking-controls--region {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 960px) {
  .profile-panel__header {
    align-items: flex-start;
    flex-direction: column;
  }

  .tracking-summary,
  .tracking-controls,
  .tracking-controls--region {
    grid-template-columns: 1fr;
  }
}
</style>
