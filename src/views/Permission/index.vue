<script setup lang="ts">
import AdminUser from './AdminUser/index.vue';
import CommandPermission from './CommandPermission/index.vue';

defineOptions({
  name: 'Permission',
});

const activeTab = ref('admin-user');
</script>

<template>
  <el-card class="h-full" shadow="never">
    <el-tabs v-model="activeTab">
      <el-tab-pane :label="$t('views.permission.adminUser')" name="admin-user">
        <AdminUser />
      </el-tab-pane>
      <el-tab-pane :label="$t('views.permission.commandPermission')" name="command-permission">
        <CommandPermission />
      </el-tab-pane>
    </el-tabs>
  </el-card>
</template>
