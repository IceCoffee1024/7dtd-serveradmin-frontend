<script setup lang="ts">
import Run from './Run/index.vue';
import Settings from './Settings/index.vue';

defineOptions({ name: 'RestartPage' });

const activeTab = ref('settings');
</script>

<template>
  <el-card class="h-full" shadow="never">
    <el-tabs v-model="activeTab">
      <el-tab-pane :label="$t('views.restart.tabs.settings')" name="settings">
        <Settings />
      </el-tab-pane>
      <el-tab-pane :label="$t('views.restart.tabs.run')" name="run">
        <Run />
      </el-tab-pane>
    </el-tabs>
  </el-card>
</template>
