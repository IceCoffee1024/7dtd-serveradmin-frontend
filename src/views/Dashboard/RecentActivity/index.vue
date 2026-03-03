<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useRecentActivityStore } from '~/stores/recentActivity';

const { activities } = storeToRefs(useRecentActivityStore());

const ACTIVITY_TONE_COLOR_MAP = {
  success: 'var(--el-color-success)',
  danger: 'var(--el-color-danger)',
} as const;

function resolveToneColor(tone: keyof typeof ACTIVITY_TONE_COLOR_MAP): string {
  return ACTIVITY_TONE_COLOR_MAP[tone];
}
</script>

<template>
  <div class="py-2 flex flex-col gap-3 h-62 overflow-y-auto" :class="{ '!pe-2': activities.length > 3 }">
    <div
      v-for="(activity, index) in activities"
      :key="index"
      class="p-3 border rounded-lg flex gap-3 items-center bg-surface-50 border-surface-200 dark:bg-surface-800 dark:border-surface-700"
    >
      <component :is="activity.icon" :style="{ color: resolveToneColor(activity.tone) }" />
      <div class="flex flex-col gap-1">
        <span class="text-sm font-500">{{ activity.text }}</span>
        <span class="text-xs text-surface-600 dark:text-surface-400">{{ activity.time }}</span>
      </div>
    </div>
  </div>
</template>
