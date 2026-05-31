<script setup lang="ts">
import type { SystemPlatformInfoDto } from '~/generated/api/types.gen';
import { useI18n } from 'vue-i18n';

interface Props {
  model?: SystemPlatformInfoDto;
}
const props = defineProps<Props>();
const { t } = useI18n();

function formatMemoryInGb(value: number | null | undefined): string {
  return value ? `${Math.round(value / 1024)} GB` : t('common.unknown');
}

function toDisplayValue(value: number | string | null | undefined): string {
  if (value === undefined || value === null || value === '') {
    return t('common.unknown');
  }

  return String(value);
}

const summaryItems = computed(() => [
  {
    label: 'OS',
    value: props.model?.operatingSystem || t('common.unknown'),
    tone: 'primary',
  },
  {
    label: 'CPU',
    value: props.model?.processorCount ? String(props.model.processorCount) : t('common.unknown'),
    tone: 'warning',
  },
  {
    label: 'RAM',
    value: formatMemoryInGb(props.model?.systemMemorySize),
    tone: 'success',
  },
]);

const infoItems = computed(() => [
  { label: 'views.dashboard.systemInfo.deviceName', value: props.model?.deviceName },
  { label: 'views.dashboard.systemInfo.deviceModel', value: props.model?.deviceModel },
  { label: 'views.dashboard.systemInfo.deviceType', value: props.model?.deviceType },
  { label: 'views.dashboard.systemInfo.deviceUniqueIdentifier', value: props.model?.deviceUniqueIdentifier, mono: true },
  { label: 'views.dashboard.systemInfo.operatingSystem', value: props.model?.operatingSystem },
  { label: 'views.dashboard.systemInfo.processorType', value: props.model?.processorType },
  { label: 'views.dashboard.systemInfo.processorCount', value: props.model?.processorCount },
  { label: 'views.dashboard.systemInfo.systemMemorySize', value: formatMemoryInGb(props.model?.systemMemorySize) },
  { label: 'views.dashboard.systemInfo.userName', value: props.model?.userName, mono: true },
]);
</script>

<template>
  <div class="system-info-shell">
    <div class="system-info-summary">
      <div
        v-for="item in summaryItems"
        :key="item.label"
        class="system-info-summary__item"
        :class="`system-info-summary__item--${item.tone}`"
      >
        <span class="system-info-summary__label">{{ item.label }}</span>
        <strong class="system-info-summary__value" :title="item.value">{{ item.value }}</strong>
      </div>
    </div>

    <div class="system-info-grid">
      <div
        v-for="item in infoItems"
        :key="item.label"
        class="system-info-item"
      >
        <span class="system-info-item__label">{{ $t(item.label) }}</span>
        <span
          class="system-info-item__value"
          :class="{ 'system-info-item__value--mono': item.mono }"
          :title="toDisplayValue(item.value)"
        >{{ toDisplayValue(item.value) }}</span>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.system-info-shell {
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
}

.system-info-summary {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.75rem;
}

.system-info-summary__item {
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

.system-info-summary__item--primary {
  color: var(--colors-primary);
}

.system-info-summary__item--warning {
  color: #b45309;
}

.system-info-summary__item--success {
  color: #0f766e;
}

.system-info-summary__label {
  color: var(--el-text-color-secondary);
  font-size: 0.74rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.system-info-summary__value {
  overflow: hidden;
  color: var(--el-text-color-primary);
  font-size: 0.95rem;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
}

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
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.system-info-item__value {
  color: var(--el-text-color-primary);
  font-weight: 600;
  line-height: 1.45;
  word-break: break-word;
}

.system-info-item__value--mono {
  font-family: var(--el-font-family-monospace, 'Cascadia Mono', 'Consolas', monospace);
  font-size: 0.9rem;
}

@media (max-width: 640px) {
  .system-info-summary,
  .system-info-grid {
    grid-template-columns: 1fr;
  }
}
</style>
