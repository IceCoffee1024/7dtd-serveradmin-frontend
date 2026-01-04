<script setup lang="ts">
import ColorPreview from './ColorPreview.vue';

interface Props {
  presetName: string;
  colors: App.ThemeSettings['appearance']['colors'];
}
defineProps<Props>();

defineEmits(['apply']);
</script>

<template>
  <el-card class="rounded-lg">
    <div class="flex items-center justify-between">
      <div class="font-bold text-primary">
        {{ $t(`layout.header.presets.${presetName}.name`) }}
      </div>
      <el-button type="primary" size="small" plain round @click="$emit('apply', presetName)">
        {{ $t('common.apply') }}
      </el-button>
    </div>
    <div class="text-sm text-gray-600 mt-8px dark:text-gray-400">
      {{ $t(`layout.header.presets.${presetName}.description`) }}
    </div>
    <div class="mt-8px flex gap-1">
      <ColorPreview :color-name="colors.primary" />
      <ColorPreview :color-name="colors.info" />
      <ColorPreview :color-name="colors.success" />
      <ColorPreview :color-name="colors.warning" />
      <ColorPreview :color-name="colors.danger" />
      <ColorPreview :color-name="colors.surface" />
    </div>
  </el-card>
</template>
