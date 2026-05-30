<script setup  lang="ts">
import type { GameTimeDto, StatsDto } from '~/generated/api/types.gen';
import dayjs from 'dayjs';
import { useI18n } from 'vue-i18n';

interface Props {
  model?: StatsDto;
}
defineProps<Props>();

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
</script>

<template>
  <div class="overview-grid">
    <div class="overview-item overview-item--featured">
      <span class="overview-item__label">{{ $t('views.dashboard.overview.serverName') }}</span>
      <p class="overview-item__value">
        {{ model?.serverName || $t('common.unknown') }}
      </p>
    </div>
    <div class="overview-item">
      <span class="overview-item__label">{{ $t('views.dashboard.overview.serverIp') }}</span>
      <p class="overview-item__value">
        {{ model?.serverIp || $t('common.unknown') }}
      </p>
    </div>
    <div class="overview-item">
      <span class="overview-item__label">{{ $t('views.dashboard.overview.serverPort') }}</span>
      <p class="overview-item__value">
        {{ model?.serverPort || $t('common.unknown') }}
      </p>
    </div>
    <div class="overview-item">
      <span class="overview-item__label">{{ $t('views.dashboard.overview.region') }}</span>
      <p class="overview-item__value">
        {{ model?.region || $t('common.unknown') }}
      </p>
    </div>
    <div class="overview-item">
      <span class="overview-item__label">{{ $t('views.dashboard.overview.language') }}</span>
      <p class="overview-item__value">
        {{ model?.language || $t('common.unknown') }}
      </p>
    </div>
    <div class="overview-item">
      <span class="overview-item__label">{{ $t('views.dashboard.overview.serverVersion') }}</span>
      <p class="overview-item__value">
        {{ model?.serverVersion || $t('common.unknown') }}
      </p>
    </div>
    <div class="overview-item">
      <span class="overview-item__label">{{ $t('views.dashboard.overview.uptime') }}</span>
      <p class="overview-item__value">
        {{ model ? formatUptime(model.uptime) : $t('common.unknown') }}
      </p>
    </div>
    <div class="overview-item">
      <span class="overview-item__label">{{ $t('views.dashboard.overview.gameTime') }}</span>
      <p class="overview-item__value">
        {{ model ? formatGameTime(model.gameTime) : $t('common.unknown') }}
      </p>
    </div>
    <div class="overview-item">
      <span class="overview-item__label">{{ $t('views.dashboard.overview.gameName') }}</span>
      <p class="overview-item__value">
        {{ model?.gameName || $t('common.unknown') }}
      </p>
    </div>
    <div class="overview-item">
      <span class="overview-item__label">{{ $t('views.dashboard.overview.gameMode') }}</span>
      <p class="overview-item__value">
        {{ model?.gameMode || $t('common.unknown') }}
      </p>
    </div>
    <div class="overview-item">
      <span class="overview-item__label">{{ $t('views.dashboard.overview.gameWorld') }}</span>
      <p class="overview-item__value">
        {{ model?.gameWorld || $t('common.unknown') }}
      </p>
    </div>
    <div class="overview-item">
      <span class="overview-item__label">{{ $t('views.dashboard.overview.gameDifficulty') }}</span>
      <p class="overview-item__value">
        {{ model ? formatGameDifficulty(model.gameDifficulty) : $t('common.unknown') }}
      </p>
    </div>
  </div>
</template>

<style lang="scss" scoped>
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
}

.overview-item__label {
  display: block;
  color: var(--el-text-color-secondary);
  font-size: 0.82rem;
}

.overview-item__value {
  margin: 0.45rem 0 0;
  color: var(--el-text-color-primary);
  font-size: 1rem;
  font-weight: 600;
  line-height: 1.45;
  word-break: break-word;
}

@media (max-width: 1024px) {
  .overview-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .overview-item--featured {
    grid-column: span 2;
  }
}

@media (max-width: 640px) {
  .overview-grid {
    grid-template-columns: 1fr;
  }

  .overview-item--featured {
    grid-column: span 1;
  }
}
</style>
