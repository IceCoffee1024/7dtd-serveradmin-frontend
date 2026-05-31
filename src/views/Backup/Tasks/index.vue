<script setup lang="ts">
import FilesTable from '../components/FilesTable.vue';
import DatabaseConfigTab from '../DatabaseBackup/ConfigTab.vue';
import ServerConfigConfigTab from '../ServerConfigBackup/ConfigTab.vue';
import WorldConfigTab from '../WorldBackup/ConfigTab.vue';

defineOptions({ name: 'BackupTasksPage' });

const activeTab = ref('world');
</script>

<template>
  <el-card class="backup-shell h-full" shadow="never">
    <el-tabs v-model="activeTab" class="backup-shell__tabs">
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

<style scoped lang="scss">
.backup-shell {
  border: 1px solid color-mix(in srgb, var(--el-border-color-light) 70%, white 30%);
  border-radius: 28px;
  overflow: hidden;
  background:
    radial-gradient(circle at top right, color-mix(in srgb, var(--colors-primary) 6%, transparent), transparent 34%),
    linear-gradient(180deg, color-mix(in srgb, var(--el-bg-color) 97%, white 3%), var(--el-bg-color));

  :deep(.el-card__body) {
    height: 100%;
    padding: 1rem 1rem 0.85rem;
  }
}

.backup-shell__tabs {
  height: 100%;

  :deep(.el-tabs__content) {
    height: calc(100% - 54px);
    overflow: auto;
    padding-right: 0.15rem;
  }
}
</style>
