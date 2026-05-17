<script setup lang="ts">
import DatabaseConfigTab from '../DatabaseBackup/ConfigTab.vue';
import ServerConfigConfigTab from '../ServerConfigBackup/ConfigTab.vue';
import WorldConfigTab from '../WorldBackup/ConfigTab.vue';
import FilesTable from '../components/FilesTable.vue';

defineOptions({ name: 'BackupTasksPage' });

const activeTab = ref('world');
</script>

<template>
  <el-card class="h-full" shadow="never">
    <el-tabs v-model="activeTab">
      <el-tab-pane :label="$t('menus.worldBackup')" name="world">
        <WorldConfigTab />
        <div class="mt-6">
          <FilesTable kind="World" />
        </div>
      </el-tab-pane>
      <el-tab-pane :label="$t('menus.databaseBackup')" name="database">
        <DatabaseConfigTab />
        <div class="mt-6">
          <FilesTable kind="Database" />
        </div>
      </el-tab-pane>
      <el-tab-pane :label="$t('menus.serverConfigBackup')" name="server-config">
        <ServerConfigConfigTab />
        <div class="mt-6">
          <FilesTable kind="ServerConfig" />
        </div>
      </el-tab-pane>
    </el-tabs>
  </el-card>
</template>
