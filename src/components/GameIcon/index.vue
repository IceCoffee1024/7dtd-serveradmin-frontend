<script setup lang="ts">
interface Props {
  size?: number;
  iconName?: string;
  iconColor?: string;
  isUiIcon?: boolean;
  preview?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  size: 160,
  iconName: '',
  iconColor: undefined,
  isUiIcon: false,
  preview: true,
});

function getIconUrl(category: 'UiIcons' | 'ItemIcons', iconName: string, iconColor?: string): string | null {
  if (!iconName) {
    return null;
  }

  // Append color to the name if it exists and is not 'FFFFFF'
  const name = iconColor && iconColor.toUpperCase() !== 'FFFFFF' ? `${iconName}__${iconColor}` : iconName;

  // Dynamically create the path based on the category
  const basePath = `${import.meta.env.VITE_API_BASE_URL}GameServer/${category}/`;
  return `${basePath}${name}.png`;
}

const src = computed<string | null>(() => {
  return getIconUrl(props.isUiIcon ? 'UiIcons' : 'ItemIcons', props.iconName, props.iconColor);
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
