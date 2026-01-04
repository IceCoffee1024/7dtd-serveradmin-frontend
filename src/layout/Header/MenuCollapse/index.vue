<script setup lang="ts">
import { useToggle } from '@vueuse/core';

const collapsed = defineModel<boolean>('collapsed', { required: true });
const toggle = useToggle(collapsed);
</script>

<template>
  <IconButton
    :tooltip-content="collapsed ? $t('layout.header.expandMenu') : $t('layout.header.collapseMenu')"
    tooltip-placement="bottom-start"
    @click="toggle()"
  >
    <icon-line-md:menu-fold-right v-if="collapsed" />
    <icon-line-md:menu-fold-left v-else />
  </IconButton>
</template>
