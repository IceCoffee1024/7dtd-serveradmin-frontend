<script setup lang="ts">
import { useFullscreen } from '@vueuse/core';

const { isFullscreen, toggle } = useFullscreen();
</script>

<template>
  <IconButton
    :tooltip-content="isFullscreen ? $t('layout.header.exitFullscreen') : $t('layout.header.fullscreen')"
    tooltip-placement="bottom"
    @click="toggle()"
  >
    <icon-ri:fullscreen-exit-fill v-if="isFullscreen" />
    <icon-ri:fullscreen-fill v-else />
  </IconButton>
</template>
