<script setup lang="ts">
defineOptions({
  inheritAttrs: false,
});

withDefaults(defineProps<Props>(), {
  tooltipContent: '',
  tooltipPlacement: 'bottom',
  aTag: false,
  border: false,
});

interface Props {
  /** Tooltip content */
  tooltipContent?: string;
  /** Tooltip placement */
  tooltipPlacement?: string;
  aTag?: boolean;
  color?: string;
  size?: string | number;
  border?: boolean;
  round?: boolean;
}
</script>

<template>
  <el-tooltip :placement="tooltipPlacement" :content="tooltipContent" :disabled="!tooltipContent">
    <el-button
      class="w-32px" :class="{ '!rounded-lg': round }" :text="!border" :tag="aTag ? 'a' : undefined"
      :target="aTag ? '_blank' : undefined" :rel="aTag ? 'noopener noreferrer' : undefined" v-bind="$attrs"
    >
      <el-icon class="text-lg" :color="color" :size="size">
        <slot />
      </el-icon>
    </el-button>
  </el-tooltip>
</template>
