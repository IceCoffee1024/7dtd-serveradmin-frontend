<script setup lang="ts">
import BackupRunsTable from '~/views/AuditLogs/BackupRuns/index.vue';

defineOptions({ name: 'BackupHistoryPage' });
</script>

<template>
  <el-card
    class="h-full min-h-0"
    shadow="never"
    :body-style="{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      minHeight: '0',
      overflow: 'hidden',
    }"
  >
    <BackupRunsTable />
  </el-card>
</template>
