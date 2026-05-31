<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useRecentActivityStore } from '~/stores/recentActivity';

const { activities } = storeToRefs(useRecentActivityStore());

const ACTIVITY_TONE_COLOR_MAP = {
  success: 'var(--el-color-success)',
  danger: 'var(--el-color-danger)',
} as const;

const latestActivityTime = computed(() => activities.value[0]?.time ?? '');
const activityCount = computed(() => activities.value.length);

function resolveToneColor(tone: keyof typeof ACTIVITY_TONE_COLOR_MAP): string {
  return ACTIVITY_TONE_COLOR_MAP[tone];
}
</script>

<template>
  <div class="recent-activity-shell">
    <div class="recent-activity-shell__meta">
      <div class="recent-activity-shell__metric recent-activity-shell__metric--primary">
        <span>{{ activityCount }}</span>
        <small>{{ $t('views.dashboard.headers.recentActivity') }}</small>
      </div>
      <div class="recent-activity-shell__metric recent-activity-shell__metric--success">
        <span>{{ latestActivityTime || '--' }}</span>
        <small>{{ $t('common.update') }}</small>
      </div>
    </div>

    <div
      v-if="activityCount > 0"
      class="recent-activity"
      :class="{ 'recent-activity--scroll': activityCount > 3 }"
    >
      <div
        v-for="(activity, index) in activities"
        :key="index"
        class="recent-activity__item"
      >
        <span class="recent-activity__rail" :style="{ background: resolveToneColor(activity.tone) }" />
        <span class="recent-activity__icon" :style="{ color: resolveToneColor(activity.tone) }">
          <component :is="activity.icon" />
        </span>
        <div class="recent-activity__content">
          <span class="recent-activity__text">{{ activity.text }}</span>
          <span class="recent-activity__time">{{ activity.time }}</span>
        </div>
      </div>
    </div>
    <div v-else class="app-empty-state recent-activity-shell__empty">
      <div class="app-empty-state__icon">
        <icon-mdi-bell-outline />
      </div>
      <div class="app-empty-state__title">
        {{ $t('views.dashboard.headers.recentActivity') }}
      </div>
      <div class="app-empty-state__description">
        {{ $t('common.unknown') }}
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.recent-activity-shell {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.recent-activity-shell__meta {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75rem;
}

.recent-activity-shell__metric {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  padding: 0.8rem 0.9rem;
  border-radius: 18px;
  border: 1px solid color-mix(in srgb, var(--el-border-color-light) 68%, white 32%);
  background: color-mix(in srgb, var(--el-bg-color) 97%, white 3%);
}

.recent-activity-shell__metric--primary {
  color: var(--colors-primary);
}

.recent-activity-shell__metric--success {
  color: #0f766e;
}

.recent-activity-shell__metric span {
  color: var(--el-text-color-primary);
  font-size: 1rem;
  font-weight: 700;
}

.recent-activity-shell__metric small {
  color: var(--el-text-color-secondary);
  font-size: 0.74rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.recent-activity {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  height: 13.75rem;
  padding: 0.2rem 0;
  overflow-y: auto;
}

.recent-activity--scroll {
  padding-right: 0.4rem;
}

.recent-activity__item {
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: 0.85rem;
  padding: 0.95rem 1rem;
  border-radius: 18px;
  border: 1px solid color-mix(in srgb, var(--el-border-color-light) 68%, white 32%);
  background:
    linear-gradient(180deg, color-mix(in srgb, var(--el-bg-color) 96%, white 4%), var(--el-bg-color)),
    radial-gradient(circle at top right, color-mix(in srgb, var(--colors-primary) 5%, transparent), transparent 40%);
}

.recent-activity__rail {
  position: absolute;
  left: 0.65rem;
  top: 0.9rem;
  bottom: 0.9rem;
  width: 0.22rem;
  border-radius: 999px;
  opacity: 0.9;
}

.recent-activity__icon {
  display: grid;
  place-items: center;
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 14px;
  background: color-mix(in srgb, currentColor 12%, transparent);
  flex-shrink: 0;
  margin-left: 0.35rem;
}

.recent-activity__content {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  min-width: 0;
}

.recent-activity__text {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.recent-activity__time {
  font-size: 0.76rem;
  color: var(--el-text-color-secondary);
}

.recent-activity-shell__empty {
  min-height: 13.75rem;
}

@media (max-width: 640px) {
  .recent-activity-shell__meta {
    grid-template-columns: 1fr;
  }
}
</style>
