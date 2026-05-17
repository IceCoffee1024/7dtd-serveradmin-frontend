<script setup lang="ts">
import AuditLogTable from './Table/index.vue';

defineOptions({ name: 'AuditLogs' });
</script>

<template>
  <el-card class="h-full" shadow="never">
    <AuditLogTable />
  </el-card>
</template>
