<script setup lang="ts">
import { getItemIconUrl, getUiIconUrl } from '~/api/gameServer';

interface Props {
  size?: number;
  iconName?: string;
  iconColor?: string;
  uiIcon?: boolean;
  preview?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  size: 160,
  iconName: '',
  iconColor: undefined,
  uiIcon: false,
  preview: true,
});

function getIconUrl(category: 'UiIcons' | 'ItemIcons', iconName: string, iconColor?: string): string | null {
  if (!iconName) {
    return null;
  }

  return category === 'UiIcons'
    ? getUiIconUrl(iconName, iconColor)
    : getItemIconUrl(iconName, iconColor);
}

const src = computed<string | null>(() => {
  return getIconUrl(props.uiIcon ? 'UiIcons' : 'ItemIcons', props.iconName, props.iconColor);
});

const previewSrcList = computed<string[]>(() => {
  if (!props.preview || !src.value) {
    return [];
  }
  return [src.value];
});
</script>

<template>
  <el-image
    :src="src || undefined"
    :preview-src-list="previewSrcList"
    :style="{ width: `${size}px`, height: `${size}px` }"
    fit="contain"
  />
</template>

<style scoped>
html:not(.dark) .el-image {
  background-color: #4d4d4d;
}
</style>
