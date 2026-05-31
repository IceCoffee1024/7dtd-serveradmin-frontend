<script setup lang="ts">
import FilesTable from '../components/FilesTable.vue';
import ConfigTab from './ConfigTab.vue';

defineOptions({ name: 'WorldBackupPage' });

const activeTab = ref('config');
</script>

<template>
  <el-card class="backup-shell h-full" shadow="never">
    <el-tabs v-model="activeTab" class="backup-shell__tabs">
      <el-tab-pane :label="$t('views.backup.tabs.config')" name="config">
        <ConfigTab />
      </el-tab-pane>
      <el-tab-pane :label="$t('views.backup.tabs.files')" name="files">
        <FilesTable kind="World" />
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
  }

  :deep(.el-tab-pane) {
    height: 100%;
  }
}
</style>
