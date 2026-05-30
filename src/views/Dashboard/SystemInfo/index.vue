<script setup lang="ts">
import type { SystemPlatformInfoDto } from '~/generated/api/types.gen';

interface Props {
  model?: SystemPlatformInfoDto;
}
defineProps<Props>();
</script>

<template>
  <div class="system-info-grid">
    <div class="system-info-item">
      <span class="system-info-item__label">{{ $t('views.dashboard.systemInfo.deviceName') }}</span>
      <span class="system-info-item__value" :title="model?.deviceName">{{ model?.deviceName || $t('common.unknown') }}</span>
    </div>
    <div class="system-info-item">
      <span class="system-info-item__label">{{ $t('views.dashboard.systemInfo.deviceModel') }}</span>
      <span class="system-info-item__value" :title="model?.deviceModel">{{ model?.deviceModel || $t('common.unknown') }}</span>
    </div>
    <div class="system-info-item">
      <span class="system-info-item__label">{{ $t('views.dashboard.systemInfo.deviceType') }}</span>
      <span class="system-info-item__value" :title="model?.deviceType">{{ model?.deviceType || $t('common.unknown') }}</span>
    </div>
    <div class="system-info-item">
      <span class="system-info-item__label">{{ $t('views.dashboard.systemInfo.deviceUniqueIdentifier') }}</span>
      <span class="system-info-item__value" :title="model?.deviceUniqueIdentifier">{{ model?.deviceUniqueIdentifier || $t('common.unknown') }}</span>
    </div>
    <div class="system-info-item">
      <span class="system-info-item__label">{{ $t('views.dashboard.systemInfo.operatingSystem') }}</span>
      <span class="system-info-item__value" :title="model?.operatingSystem">{{ model?.operatingSystem || $t('common.unknown') }}</span>
    </div>
    <div class="system-info-item">
      <span class="system-info-item__label">{{ $t('views.dashboard.systemInfo.processorType') }}</span>
      <span class="system-info-item__value" :title="model?.processorType">{{ model?.processorType || $t('common.unknown') }}</span>
    </div>
    <div class="system-info-item">
      <span class="system-info-item__label">{{ $t('views.dashboard.systemInfo.processorCount') }}</span>
      <span class="system-info-item__value" :title="model?.processorCount">{{ model?.processorCount ?? $t('common.unknown') }}</span>
    </div>
    <div class="system-info-item">
      <span class="system-info-item__label">{{ $t('views.dashboard.systemInfo.systemMemorySize') }}</span>
      <span class="system-info-item__value" :title="model?.systemMemorySize ? `${Math.round(model.systemMemorySize / 1024)} GB` : $t('common.unknown')">{{ model?.systemMemorySize ? `${Math.round(model.systemMemorySize / 1024)} GB` : $t('common.unknown') }}</span>
    </div>
    <div class="system-info-item">
      <span class="system-info-item__label">{{ $t('views.dashboard.systemInfo.userName') }}</span>
      <span class="system-info-item__value" :title="model?.userName">{{ model?.userName || $t('common.unknown') }}</span>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.system-info-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.9rem;
}

.system-info-item {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  padding: 1rem 1.05rem;
  border-radius: 20px;
  border: 1px solid color-mix(in srgb, var(--el-border-color-light) 70%, white 30%);
  background: color-mix(in srgb, var(--el-bg-color) 96%, white 4%);
}

.system-info-item__label {
  color: var(--el-text-color-secondary);
  font-size: 0.8rem;
}

.system-info-item__value {
  color: var(--el-text-color-primary);
  font-weight: 600;
  line-height: 1.45;
  word-break: break-word;
}

@media (max-width: 640px) {
  .system-info-grid {
    grid-template-columns: 1fr;
  }
}
</style>
