<script setup lang="ts">
import ConfigTab from './ConfigTab.vue';
import FilesTable from '../components/FilesTable.vue';

defineOptions({ name: 'ServerConfigBackupPage' });

const activeTab = ref('config');
</script>

<template>
  <el-card class="h-full" shadow="never">
    <el-tabs v-model="activeTab">
      <el-tab-pane :label="$t('views.backup.tabs.config')" name="config">
        <ConfigTab />
      </el-tab-pane>
      <el-tab-pane :label="$t('views.backup.tabs.files')" name="files">
        <FilesTable kind="ServerConfig" />
      </el-tab-pane>
    </el-tabs>
  </el-card>
</template>
