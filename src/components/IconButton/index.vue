<script setup lang="ts">
import type { ElButton, ElTooltip } from 'element-plus';

defineOptions({
  inheritAttrs: false,
});

withDefaults(defineProps<Props>(), {
  tooltipContent: '',
  tooltipPlacement: 'bottom',
  aTag: false,
  border: false,
});
type ElButtonProps = InstanceType<typeof ElButton>['$props'];
type ElTooltipProps = InstanceType<typeof ElTooltip>['$props'];
interface Props extends /* @vue-ignore */ Omit<ElButtonProps, 'size'> {
  /** Tooltip content */
  tooltipContent?: string;
  /** Tooltip placement */
  tooltipPlacement?: ElTooltipProps['placement'];
  aTag?: boolean;
  color?: string;
  /** Button size forwarded to the underlying el-button. */
  buttonSize?: ElButtonProps['size'];
  /** Icon size forwarded to el-icon. */
  iconSize?: string | number;
  border?: boolean;
  round?: boolean;
  loading?: boolean;
}
</script>

<template>
  <el-tooltip :placement="tooltipPlacement" :content="tooltipContent" :disabled="!tooltipContent">
    <el-button
      class="icon-button" :class="{ 'icon-button--pill': round, 'icon-button--border': border }" :size="buttonSize" :text="!border" :tag="aTag ? 'a' : undefined"
      :target="aTag ? '_blank' : undefined" :rel="aTag ? 'noopener noreferrer' : undefined" :loading="loading" v-bind="$attrs"
    >
      <el-icon v-show="!loading" class="text-lg" :color="color" :size="iconSize">
        <slot />
      </el-icon>
    </el-button>
  </el-tooltip>
</template>

<style scoped>
.el-button + .el-button {
  margin-left: 0;
}

.icon-button {
  width: 32px;
  min-width: 32px;
  border-radius: 12px;
  color: var(--el-text-color-primary);
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease,
    background-color 0.2s ease,
    border-color 0.2s ease;
}

.icon-button:hover {
  transform: translateY(-1px);
}

.icon-button:disabled,
.icon-button.is-disabled {
  transform: none;
  opacity: 0.72;
}

.icon-button--pill {
  border-radius: 999px;
}

.icon-button--border {
  border-color: color-mix(in srgb, var(--el-border-color) 72%, white 28%);
  background: color-mix(in srgb, var(--el-bg-color) 94%, white 6%);
  box-shadow: 0 6px 16px rgba(15, 23, 42, 0.05);
}

.icon-button--border:hover {
  box-shadow: 0 10px 20px color-mix(in srgb, var(--colors-primary) 10%, transparent);
}
</style>
