<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useRecentActivityStore } from '~/stores/recentActivity';

const { activities } = storeToRefs(useRecentActivityStore());
</script>

<template>
  <div class="activity-list h-62 overflow-y-auto" :class="{ '!pe-2': activities.length > 3 }">
    <div v-for="(activity, index) in activities" :key="index" class="activity-item">
      <component :is="activity.icon" :style="{ color: activity.color }" />
      <div class="activity-content">
        <span class="activity-text">{{ activity.text }}</span>
        <span class="activity-time">{{ activity.time }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.activity-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 0.5rem 0;
}

.activity-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  border: 1px solid var(--colors-surface-200);
  border-radius: 0.5rem;
  background-color: var(--colors-surface-50);
}

.dark .activity-item {
  background-color: var(--colors-surface-800);
  border-color: var(--colors-surface-700);
}

.activity-content {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.activity-text {
  font-size: 0.875rem;
  font-weight: 500;
}

.activity-time {
  font-size: 0.75rem;
  color: var(--colors-surface-600);
}

.dark .activity-time {
  color: var(--colors-surface-400);
}
</style>
