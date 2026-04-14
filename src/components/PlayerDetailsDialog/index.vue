<script setup lang="ts">
import dayjs from 'dayjs';
import { useI18n } from 'vue-i18n';
import { getPlayerDetails } from '~/api/gameServer';
import MyDialog from '~/components/MyDialog/index.vue';
import { useLatestAsync } from '~/composables/useLatestAsync';
import { formatMinute, formatPosition } from '~/utils';

defineOptions({ name: 'PlayerDetailsDialog' });

interface DetailRow {
  label: string;
  value: string | number;
}

const { t } = useI18n();

const {
  data,
  pending: loading,
  execute: executeLatest,
  reset,
} = useLatestAsync<DetailRow[]>({
  initialValue: [],
});

const leftTableData = computed<DetailRow[]>(() => {
  const rows = data.value ?? [];
  const mid = Math.ceil(rows.length / 2);
  return rows.slice(0, mid);
});
const rightTableData = computed<DetailRow[]>(() => {
  const rows = data.value ?? [];
  const mid = Math.ceil(rows.length / 2);
  return rows.slice(mid);
});
const dialogRef = useTemplateRef('dialogRef');
const title = ref('');

function formatDayTime(days: number | undefined, time: number | undefined): string {
  const safeDays = Number(days ?? 0);
  const safeTime = Number(time ?? 0);
  return `${safeDays} ${t('common.day', safeDays)} ${safeTime} ${t('common.hour', safeTime)}`;
}

function normalizeNumber(value: unknown): number {
  return typeof value === 'number' ? value : Number(value ?? 0);
}

function readStringArray(value: unknown): string {
  if (Array.isArray(value)) {
    return value.join(', ');
  }
  return typeof value === 'string' ? value : '';
}

async function open(playerId: string, playerName: string) {
  title.value = `${playerName} (${playerId})`;
  reset();
  dialogRef.value?.open();

  await executeLatest(async () => getModel(await getPlayerDetails(playerId)));
}

function onDialogClosed() {
  title.value = '';
  reset();
}

defineExpose({
  open,
});

function getModel(data: API.GameServer.PlayerDetails): DetailRow[] {
  const source = data as unknown as Record<string, unknown>;

  const result: DetailRow[] = [
    { label: t('components.playerDetailsDialog.playerName'), value: data.playerName ?? '' },
    { label: t('components.playerDetailsDialog.entityId'), value: data.entityId ?? '' },
    { label: t('components.playerDetailsDialog.playerId'), value: data.playerId ?? '' },
    { label: t('components.playerDetailsDialog.platformId'), value: data.platformId ?? '' },
    { label: t('components.playerDetailsDialog.playGroup'), value: data.playGroup ?? '' },
    { label: t('components.playerDetailsDialog.admin'), value: data.isAdmin ? t('common.yes') : t('common.no') },
    { label: t('components.playerDetailsDialog.online'), value: !data.isOffline ? t('common.yes') : t('common.no') },
    { label: t('components.playerDetailsDialog.ip'), value: data.ip ?? '' },
    { label: t('components.playerDetailsDialog.ping'), value: normalizeNumber(data.ping) },
    { label: t('components.playerDetailsDialog.position'), value: formatPosition(data.position) },
    { label: t('components.playerDetailsDialog.lastSpawnPosition'), value: formatPosition(data.lastSpawnPosition) },
    { label: t('components.playerDetailsDialog.gameStage'), value: normalizeNumber(source.gameStage) },
    { label: t('components.playerDetailsDialog.lastLogin'), value: dayjs(data.lastLogin).format() },
    { label: t('components.playerDetailsDialog.playerKills'), value: normalizeNumber(source.playerKills) },
    { label: t('components.playerDetailsDialog.zombieKills'), value: normalizeNumber(source.zombieKills) },
    { label: t('components.playerDetailsDialog.deaths'), value: normalizeNumber(source.deaths) },
    { label: t('components.playerDetailsDialog.score'), value: normalizeNumber(data.score) },
    { label: t('components.playerDetailsDialog.health'), value: normalizeNumber(data.stats?.health).toFixed(1) },
    { label: t('components.playerDetailsDialog.stamina'), value: normalizeNumber(data.stats?.stamina).toFixed(1) },
    { label: t('components.playerDetailsDialog.food'), value: normalizeNumber(data.stats?.food).toFixed(1) },
    { label: t('components.playerDetailsDialog.water'), value: normalizeNumber(data.stats?.water).toFixed(1) },
    { label: t('components.playerDetailsDialog.level'), value: normalizeNumber(source.level) },
    { label: t('components.playerDetailsDialog.expToNextLevel'), value: normalizeNumber(source.expToNextLevel) },
    { label: t('components.playerDetailsDialog.skillPoints'), value: normalizeNumber(source.skillPoints) },
    {
      label: t('components.playerDetailsDialog.isLandProtectionActive'),
      value: data.isLandProtectionActive ? t('components.playerDetailsDialog.active') : t('components.playerDetailsDialog.inactive'),
    },
    { label: t('components.playerDetailsDialog.distanceWalked'), value: normalizeNumber(data.distanceWalked).toFixed(1) },
    { label: t('components.playerDetailsDialog.totalItemsCrafted'), value: normalizeNumber(data.totalItemsCrafted) },
    { label: t('components.playerDetailsDialog.totalTimePlayed'), value: formatMinute(normalizeNumber(data.totalTimePlayed)) },
    { label: t('components.playerDetailsDialog.currentLife'), value: formatMinute(normalizeNumber(data.currentLife)) },
    { label: t('components.playerDetailsDialog.longestLife'), value: formatMinute(normalizeNumber(data.longestLife)) },
    { label: t('components.playerDetailsDialog.alreadyCraftedList'), value: readStringArray(data.alreadyCraftedList) },
    { label: t('components.playerDetailsDialog.unlockedRecipeList'), value: readStringArray(data.unlockedRecipeList) },
    { label: t('components.playerDetailsDialog.rentedVMPosition'), value: formatPosition(data.rentedVMPosition) },
    { label: t('components.playerDetailsDialog.rentalEndDayTime'), value: formatDayTime(data.rentalEndDay, data.rentalEndTime) },
    { label: t('components.playerDetailsDialog.bedroll'), value: formatPosition(data.bedroll) },
  ];

  return result.filter(i => !!i.value || i.value === 0);
}
</script>

<template>
  <MyDialog
    ref="dialogRef"
    class="min-w-650px"
    width="64%"
    :title="$t('components.playerDetailsDialog.header')"
    :show-footer="false"
    :loading="loading"
    @closed="onDialogClosed"
  >
    <div>
      <div class="text-sm font-semibold mb-3">
        {{ title }}
      </div>
      <template v-if="data?.length">
        <div class="gap-2 grid grid-cols-2 overflow-auto">
          <el-table :data="leftTableData" stripe show-overflow-tooltip border :show-header="false">
            <el-table-column prop="label" min-width="180" class-name="font-semibold" />
            <el-table-column prop="value" min-width="220" />
          </el-table>
          <el-table :data="rightTableData" stripe show-overflow-tooltip border :show-header="false">
            <el-table-column prop="label" min-width="180" class-name="font-semibold" />
            <el-table-column prop="value" min-width="220" />
          </el-table>
        </div>
      </template>
      <el-empty v-else class="h-full" />
    </div>
  </MyDialog>
</template>
