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
        <div class="backup-task-pane">
          <WorldConfigTab />
          <div class="backup-task-pane__files">
            <FilesTable kind="World" />
          </div>
        </div>
      </el-tab-pane>
      <el-tab-pane :label="$t('menus.databaseBackup')" name="database">
        <div class="backup-task-pane">
          <DatabaseConfigTab />
          <div class="backup-task-pane__files">
            <FilesTable kind="Database" />
          </div>
        </div>
      </el-tab-pane>
      <el-tab-pane :label="$t('menus.serverConfigBackup')" name="server-config">
        <div class="backup-task-pane">
          <ServerConfigConfigTab />
          <div class="backup-task-pane__files">
            <FilesTable kind="ServerConfig" />
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>
  </el-card>
</template>

<style scoped lang="scss">
.backup-shell {
  min-height: 0;
  border: 1px solid color-mix(in srgb, var(--el-border-color-light) 70%, white 30%);
  border-radius: 28px;
  overflow: hidden;
  background:
    radial-gradient(circle at top right, color-mix(in srgb, var(--colors-primary) 6%, transparent), transparent 34%),
    linear-gradient(180deg, color-mix(in srgb, var(--el-bg-color) 97%, white 3%), var(--el-bg-color));

  :deep(.el-card__body) {
    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: 0;
    padding: 1rem 1rem 0.85rem;
  }
}

.backup-shell__tabs {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  height: 100%;
  min-height: 0;

  :deep(.el-tabs__content) {
    flex: 1 1 auto;
    min-height: 0;
    overflow: hidden;
    padding-right: 0.15rem;
  }

  :deep(.el-tab-pane) {
    height: 100%;
    min-height: 0;
  }
}

.backup-task-pane {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
}

.backup-task-pane__files {
  flex: 1 1 auto;
  min-height: 0;
  margin-top: 1.5rem;
}
</style>
