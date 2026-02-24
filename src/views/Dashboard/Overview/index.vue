<script setup  lang="ts">
import dayjs from 'dayjs';
import { useI18n } from 'vue-i18n';

interface Props {
  model?: API.GameServer.Stats;
}
defineProps<Props>();

const { t } = useI18n();

function formatUptime(time: number) {
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

function formatGameTime(time: { days: number; hours: number; minutes: number }) {
  if (!time) {
    return '';
  }
  const days = time.days;
  const hours = time.hours;
  const minutes = time.minutes;
  return t('views.dashboard.overview.gameTimeFormat', { days, hours, minutes });
}

function formatGameDifficulty(gameDifficulty: number) {
  if (gameDifficulty === undefined || gameDifficulty === null) {
    return '';
  }
  return t(`views.dashboard.overview.gameDifficultys.${gameDifficulty}`);
}
</script>

<template>
  <div class="gap-4 grid grid-cols-12 min-w-800px">
    <div class="col-span-4 2xl:col-span-3">
      <OutlineItem :legend="$t('views.dashboard.overview.serverName')">
        <p class="content">
          {{ model?.serverName || $t('common.unknown') }}
        </p>
      </OutlineItem>
    </div>
    <div class="col-span-4 2xl:col-span-3">
      <OutlineItem :legend="$t('views.dashboard.overview.serverIp')">
        <p class="content">
          {{ model?.serverIp || $t('common.unknown') }}
        </p>
      </OutlineItem>
    </div>
    <div class="col-span-4 2xl:col-span-3">
      <OutlineItem :legend="$t('views.dashboard.overview.serverPort')">
        <p class="content">
          {{ model?.serverPort || $t('common.unknown') }}
        </p>
      </OutlineItem>
    </div>
    <div class="col-span-4 2xl:col-span-3">
      <OutlineItem :legend="$t('views.dashboard.overview.region')">
        <p class="content">
          {{ model?.region || $t('common.unknown') }}
        </p>
      </OutlineItem>
    </div>
    <div class="col-span-4 2xl:col-span-3">
      <OutlineItem :legend="$t('views.dashboard.overview.language')">
        <p class="content">
          {{ model?.language || $t('common.unknown') }}
        </p>
      </OutlineItem>
    </div>
    <div class="col-span-4 2xl:col-span-3">
      <OutlineItem :legend="$t('views.dashboard.overview.serverVersion')">
        <p class="content">
          {{ model?.serverVersion || $t('common.unknown') }}
        </p>
      </OutlineItem>
    </div>
    <div class="col-span-4 2xl:col-span-3">
      <OutlineItem :legend="$t('views.dashboard.overview.uptime')">
        <p class="content">
          {{ model ? formatUptime(model.uptime) : $t('common.unknown') }}
        </p>
      </OutlineItem>
    </div>
    <div class="col-span-4 2xl:col-span-3">
      <OutlineItem :legend="$t('views.dashboard.overview.gameTime')">
        <p class="content">
          {{ model ? formatGameTime(model.gameTime) : $t('common.unknown') }}
        </p>
      </OutlineItem>
    </div>
    <div class="col-span-4 2xl:col-span-3">
      <OutlineItem :legend="$t('views.dashboard.overview.gameName')">
        <p class="content">
          {{ model?.gameName || $t('common.unknown') }}
        </p>
      </OutlineItem>
    </div>
    <div class="col-span-4 2xl:col-span-3">
      <OutlineItem :legend="$t('views.dashboard.overview.gameMode')">
        <p class="content">
          {{ model?.gameMode || $t('common.unknown') }}
        </p>
      </OutlineItem>
    </div>
    <div class="col-span-4 2xl:col-span-3">
      <OutlineItem :legend="$t('views.dashboard.overview.gameWorld')">
        <p class="content">
          {{ model?.gameWorld || $t('common.unknown') }}
        </p>
      </OutlineItem>
    </div>
    <div class="col-span-4 2xl:col-span-3">
      <OutlineItem :legend="$t('views.dashboard.overview.gameDifficulty')">
        <p class="content">
          {{ model ? formatGameDifficulty(model.gameDifficulty) : $t('common.unknown') }}
        </p>
      </OutlineItem>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.content {
  --uno: 'ms-3 text-primary 3xl:whitespace-nowrap';
}
</style>
