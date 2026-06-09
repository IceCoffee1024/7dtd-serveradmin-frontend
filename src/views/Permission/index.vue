<script setup lang="ts">
import AdminUser from './AdminUser/index.vue';
import CommandPermission from './CommandPermission/index.vue';

defineOptions({
  name: 'Permission',
});

const activeTab = ref('admin-user');
</script>

<template>
  <el-card class="permission-shell h-full min-h-0" shadow="never">
    <el-tabs v-model="activeTab" class="permission-shell__tabs">
      <el-tab-pane :label="$t('views.permission.adminUser')" name="admin-user">
        <AdminUser />
      </el-tab-pane>
      <el-tab-pane :label="$t('views.permission.commandPermission')" name="command-permission">
        <CommandPermission />
      </el-tab-pane>
    </el-tabs>
  </el-card>
</template>

<style scoped lang="scss">
.permission-shell {
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

.permission-shell__tabs {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  height: 100%;
  min-height: 0;

  :deep(.el-tabs__header) {
    flex: 0 0 auto;
  }

  :deep(.el-tabs__content) {
    flex: 1 1 auto;
    min-height: 0;
  }

  :deep(.el-tab-pane) {
    height: 100%;
    min-height: 0;
  }
}
</style>
