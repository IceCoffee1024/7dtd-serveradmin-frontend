<script setup lang="ts">
import AuditLogTable from './Table/index.vue';

defineOptions({ name: 'AuditLogs' });

const activeTab = ref('audit-logs');
</script>

<template>
  <el-card class="h-full" shadow="never">
    <el-tabs v-model="activeTab">
      <el-tab-pane :label="$t('views.auditLogs.tabs.auditLogs')" name="audit-logs">
        <AuditLogTable />
      </el-tab-pane>
    </el-tabs>
  </el-card>
</template>
