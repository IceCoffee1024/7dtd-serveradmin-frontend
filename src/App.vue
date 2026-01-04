<script setup lang="ts">
import { useTheme } from '~/composables';
import { currentLanguage as elementLocale } from '~/plugins/element-plus';

const { initTheme } = useTheme();
initTheme();
</script>

<template>
  <el-config-provider :locale="elementLocale">
    <router-view />
  </el-config-provider>
</template>
