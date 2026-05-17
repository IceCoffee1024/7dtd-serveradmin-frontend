<script setup lang="ts">
import BackupRunsTable from '~/views/AuditLogs/BackupRuns/index.vue';

defineOptions({ name: 'BackupHistoryPage' });
</script>

<template>
  <el-card class="h-full" shadow="never">
    <BackupRunsTable />
  </el-card>
</template>
