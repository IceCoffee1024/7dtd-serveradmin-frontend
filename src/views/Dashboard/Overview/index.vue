<script setup lang="ts">
import type { GameTimeDto, StatsDto } from '~/generated/api/types.gen';
import dayjs from 'dayjs';
import { useI18n } from 'vue-i18n';

interface Props {
  model?: StatsDto;
}
const props = defineProps<Props>();

const { t } = useI18n();

function formatUptime(time: number | null | undefined) {
  if (!time) {
    return '';
  }
  const dur = dayjs.duration(time, 'seconds');

  const days = Math.floor(dur.asDays());
  const hours = dur.hours();
  const minutes = dur.minutes();
  const seconds = dur.seconds();

  return t('views.dashboard.overview.uptimeFormat', days + 1, { named: { days, hours, minutes, seconds } });
}

function formatGameTime(time: GameTimeDto | null | undefined) {
  if (!time) {
    return '';
  }
  const days = time.days;
  const hours = time.hours;
  const minutes = time.minutes;
  return t('views.dashboard.overview.gameTimeFormat', { days, hours, minutes });
}

function formatGameDifficulty(gameDifficulty: number | null | undefined) {
  if (gameDifficulty === undefined || gameDifficulty === null) {
    return '';
  }
  return t(`views.dashboard.overview.gameDifficultys.${gameDifficulty}`);
}

const summaryItems = computed(() => [
  {
    label: t('views.dashboard.overview.serverVersion'),
    value: props.model?.serverVersion || t('common.unknown'),
    tone: 'primary',
  },
  {
    label: t('views.dashboard.overview.gameMode'),
    value: props.model?.gameMode || t('common.unknown'),
    tone: 'warning',
  },
  {
    label: t('views.dashboard.overview.gameDifficulty'),
    value: props.model ? formatGameDifficulty(props.model.gameDifficulty) || t('common.unknown') : t('common.unknown'),
    tone: 'success',
  },
]);

const overviewItems = computed(() => [
  {
    key: 'serverName',
    label: t('views.dashboard.overview.serverName'),
    value: props.model?.serverName || t('common.unknown'),
    featured: true,
  },
  {
    key: 'serverIp',
    label: t('views.dashboard.overview.serverIp'),
    value: props.model?.serverIp || t('common.unknown'),
    mono: true,
  },
  {
    key: 'serverPort',
    label: t('views.dashboard.overview.serverPort'),
    value: props.model?.serverPort || t('common.unknown'),
    mono: true,
  },
  {
    key: 'region',
    label: t('views.dashboard.overview.region'),
    value: props.model?.region || t('common.unknown'),
  },
  {
    key: 'language',
    label: t('views.dashboard.overview.language'),
    value: props.model?.language || t('common.unknown'),
  },
  {
    key: 'uptime',
    label: t('views.dashboard.overview.uptime'),
    value: props.model ? formatUptime(props.model.uptime) : t('common.unknown'),
  },
  {
    key: 'gameTime',
    label: t('views.dashboard.overview.gameTime'),
    value: props.model ? formatGameTime(props.model.gameTime) : t('common.unknown'),
  },
  {
    key: 'gameName',
    label: t('views.dashboard.overview.gameName'),
    value: props.model?.gameName || t('common.unknown'),
  },
  {
    key: 'gameWorld',
    label: t('views.dashboard.overview.gameWorld'),
    value: props.model?.gameWorld || t('common.unknown'),
    mono: true,
  },
]);
</script>

<template>
  <div class="overview-shell">
    <div class="overview-summary">
      <div
        v-for="item in summaryItems"
        :key="item.label"
        class="overview-summary__item"
        :class="`overview-summary__item--${item.tone}`"
      >
        <span class="overview-summary__label">{{ item.label }}</span>
        <strong class="overview-summary__value">{{ item.value }}</strong>
      </div>
    </div>

    <div class="overview-grid">
      <div
        v-for="item in overviewItems"
        :key="item.key"
        class="overview-item"
        :class="{ 'overview-item--featured': item.featured }"
      >
        <span class="overview-item__label">{{ item.label }}</span>
        <p class="overview-item__value" :class="{ 'overview-item__value--mono': item.mono }">
          {{ item.value }}
        </p>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.overview-shell {
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
}

.overview-summary {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.75rem;
}

.overview-summary__item {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  padding: 0.8rem 0.9rem;
  border-radius: 18px;
  border: 1px solid color-mix(in srgb, var(--el-border-color-light) 70%, white 30%);
  background:
    linear-gradient(180deg, color-mix(in srgb, var(--el-bg-color) 97%, white 3%), var(--el-bg-color)),
    radial-gradient(circle at top right, color-mix(in srgb, var(--colors-primary) 6%, transparent), transparent 40%);
}

.overview-summary__item--primary {
  color: var(--colors-primary);
}

.overview-summary__item--warning {
  color: #b45309;
}

.overview-summary__item--success {
  color: #0f766e;
}

.overview-summary__label {
  color: var(--el-text-color-secondary);
  font-size: 0.74rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.overview-summary__value {
  color: var(--el-text-color-primary);
  font-size: 0.98rem;
  font-weight: 700;
}

.overview-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.9rem;
}

.overview-item {
  padding: 1rem 1.05rem;
  border-radius: 20px;
  border: 1px solid color-mix(in srgb, var(--el-border-color-light) 70%, white 30%);
  background:
    linear-gradient(180deg, color-mix(in srgb, var(--el-bg-color) 96%, white 4%), var(--el-bg-color)),
    radial-gradient(circle at top right, color-mix(in srgb, var(--colors-primary) 6%, transparent), transparent 42%);
}

.overview-item--featured {
  grid-column: span 2;
  background:
    radial-gradient(circle at top right, color-mix(in srgb, var(--colors-primary) 10%, transparent), transparent 38%),
    linear-gradient(180deg, color-mix(in srgb, var(--el-bg-color) 96%, white 4%), var(--el-bg-color));
}

.overview-item__label {
  display: block;
  color: var(--el-text-color-secondary);
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.overview-item__value {
  margin: 0.45rem 0 0;
  color: var(--el-text-color-primary);
  font-size: 1rem;
  font-weight: 600;
  line-height: 1.45;
  word-break: break-word;
}

.overview-item__value--mono {
  font-family: var(--el-font-family-monospace, 'Cascadia Mono', 'Consolas', monospace);
  font-size: 0.92rem;
}

@media (max-width: 1024px) {
  .overview-summary,
  .overview-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .overview-item--featured {
    grid-column: span 2;
  }
}

@media (max-width: 640px) {
  .overview-summary,
  .overview-grid {
    grid-template-columns: 1fr;
  }

  .overview-item--featured {
    grid-column: span 1;
  }
}
</style>
