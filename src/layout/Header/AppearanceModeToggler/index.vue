<script setup lang="ts">
import type { SwitchInstance } from 'element-plus';
import { useToggle } from '@vueuse/core';
import { useTheme } from '~/composables';
import DarkIcon from './DarkIcon.vue';
import LightIcon from './LightIcon.vue';

defineOptions({ inheritAttrs: false });
const { isDark } = useTheme();
const toggleDark = useToggle(isDark);

const darkMode = ref(isDark.value);
const switchRef = ref<SwitchInstance>();

watch(
  () => isDark.value,
  (newVal) => {
    darkMode.value = newVal;
  },
);

watch(
  () => darkMode.value,
  (newVal) => {
    if (newVal !== isDark.value) {
      toggleDark();
    }
  },
);

function beforeChange() {
  return new Promise<boolean>((resolve) => {
    const isAppearanceTransition
      // eslint-disable-next-line ts/ban-ts-comment
      // @ts-expect-error
      = document.startViewTransition
        && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!isAppearanceTransition) {
      resolve(true);
      return;
    }

    const switchElement = switchRef.value?.$el;
    const rect = switchElement.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;

    const endRadius = Math.hypot(
      Math.max(x, innerWidth - x),
      Math.max(y, innerHeight - y),
    );

    const ratioX = (100 * x) / innerWidth;
    const ratioY = (100 * y) / innerHeight;
    const referR = Math.hypot(innerWidth, innerHeight) / Math.SQRT2;
    const ratioR = (100 * endRadius) / referR;

    const transition = document.startViewTransition(async () => {
      resolve(true);
      await nextTick();
    });
    transition.ready.then(() => {
      const clipPath = [
        `circle(0% at ${ratioX}% ${ratioY}%)`,
        `circle(${ratioR}% at ${ratioX}% ${ratioY}%)`,
      ];
      document.documentElement.animate(
        {
          clipPath: isDark.value ? [...clipPath].reverse() : clipPath,
        },
        {
          duration: 400,
          easing: 'ease-in',
          fill: 'both',
          pseudoElement: isDark.value
            ? '::view-transition-old(root)'
            : '::view-transition-new(root)',
        },
      );
    });
  });
}
</script>

<template>
  <el-switch
    ref="switchRef"
    v-model="darkMode"
    :before-change="beforeChange"
    :active-action-icon="DarkIcon"
    :inactive-action-icon="LightIcon"
  />
</template>

<style lang="scss" scoped>
.el-switch {
  --bg-color-mute: #f2f2f2;
  .dark & {
    --bg-color-mute: #2c2c2c;
  }

  --el-switch-on-color: var(--bg-color-mute);
  --el-switch-off-color: var(--bg-color-mute);
  --el-switch-border-color: var(--el-border-color);

  :deep(.el-switch__core) {
    .el-switch__action {
      width: 14px;
      height: 14px;
    }
  }
}

:deep(.dark-icon) {
  border-radius: 50%;
  color: #cfd3dc;
  background-color: #141414;
}

:deep(.light-icon) {
  color: #606266;
}
</style>
