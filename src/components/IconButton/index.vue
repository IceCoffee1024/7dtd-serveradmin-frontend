<script setup lang="ts">
import type { ElButton } from 'element-plus';

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
interface Props extends /* @vue-ignore */ Omit<ElButtonProps, 'size'> {
  /** Tooltip content */
  tooltipContent?: string;
  /** Tooltip placement */
  tooltipPlacement?: string;
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
      class="w-32px" :class="{ '!rounded-lg': round }" :size="buttonSize" :text="!border" :tag="aTag ? 'a' : undefined"
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
</style>
