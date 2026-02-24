<script setup lang="ts">
interface Props {
  model?: API.Devices.SystemPlatformInfo;
}
defineProps<Props>();
</script>

<template>
  <div class="system-info">
    <span>{{ $t('views.dashboard.systemInfo.deviceName') }}</span>
    <span :title="model?.deviceName">{{ model?.deviceName }}</span>
    <span>{{ $t('views.dashboard.systemInfo.deviceModel') }}</span>
    <span :title="model?.deviceModel">{{ model?.deviceModel }}</span>
    <span>{{ $t('views.dashboard.systemInfo.deviceType') }}</span>
    <span :title="model?.deviceType">{{ model?.deviceType }}</span>
    <span>{{ $t('views.dashboard.systemInfo.deviceUniqueIdentifier') }}</span>
    <span :title="model?.deviceUniqueIdentifier">{{ model?.deviceUniqueIdentifier }}</span>
    <span>{{ $t('views.dashboard.systemInfo.operatingSystem') }}</span>
    <span :title="model?.operatingSystem">{{ model?.operatingSystem }}</span>
    <span>{{ $t('views.dashboard.systemInfo.processorType') }}</span>
    <span :title="model?.processorType">{{ model?.processorType }}</span>
    <span>{{ $t('views.dashboard.systemInfo.processorCount') }}</span>
    <span :title="model?.processorCount">{{ model?.processorCount }}</span>
    <span>{{ $t('views.dashboard.systemInfo.systemMemorySize') }}</span>
    <span :title="`${Math.round(model ? model.systemMemorySize / 1024 : 0)} GB`">{{ Math.round(model ? model.systemMemorySize / 1024 : 0) }} GB</span>
    <span>{{ $t('views.dashboard.systemInfo.userName') }}</span>
    <span :title="model?.userName">{{ model?.userName }}</span>
  </div>
</template>

<style lang="scss" scoped>
.system-info {
  --uno: 'grid grid-cols-[auto_1fr] gap-4';
  span {
    &:nth-child(even) {
      --uno: 'text-el-secondary ellipsis-text';
    }
  }
}
</style>
