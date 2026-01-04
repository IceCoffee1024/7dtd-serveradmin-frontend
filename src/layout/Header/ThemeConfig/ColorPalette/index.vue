<script setup lang="ts">
import type { ButtonType, PopoverInstance } from 'element-plus';
import { ClickOutside as vClickOutside } from 'element-plus';
import ColorButtonGroup from './ColorButtonGroup.vue';

interface Props {
  buttonType?: ButtonType | 'surface';
}
defineProps<Props>();

const surfaceColor = defineModel<string>('surfaceColor');
const semanticColor = defineModel<string>('semanticColor');

const buttonRef = ref();
const popoverRef = ref<PopoverInstance>();
function onClickOutside() {
  popoverRef.value?.hide();
}

const surfaceColors = [
  'slate',
  'gray',
  'zinc',
  'neutral',
  'stone',
] as const;

const semanticColors = [
  'red',
  'orange',
  'amber',
  'yellow',
  'lime',
  'pink',
  'rose',

  'green',
  'emerald',
  'teal',
  'cyan',
  'sky',
  'blue',
  'indigo',

  'violet',
  'purple',
  'fuchsia',

  ...surfaceColors,

  'dark',
  'light',

  'tan',
] as const;
</script>

<template>
  <div>
    <el-button
      v-if="buttonType !== 'surface'"
      ref="buttonRef"
      v-click-outside="onClickOutside"
      class="!rounded-lg"
      :type="buttonType"
    >
      <el-icon><icon-ep:arrow-down /></el-icon>
    </el-button>
    <el-button
      v-else
      ref="buttonRef"
      v-click-outside="onClickOutside"
      class="bg-base !rounded-lg hover:bg-card"
    >
      <el-icon><icon-ep:arrow-down /></el-icon>
    </el-button>
    <el-popover
      ref="popoverRef"
      :virtual-ref="buttonRef"
      trigger="click"
      virtual-triggering
    >
      <ColorButtonGroup v-if="buttonType !== 'surface'" v-model:selected-color="semanticColor" :colors="semanticColors" />
      <ColorButtonGroup v-else v-model:selected-color="surfaceColor" :colors="surfaceColors" />
    </el-popover>
  </div>
</template>
