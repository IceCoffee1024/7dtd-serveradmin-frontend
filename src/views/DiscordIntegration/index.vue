<script setup lang="ts">
defineOptions({ name: 'DiscordIntegrationPage' });
</script>

<template>
  <el-card class="discord-integration-shell" shadow="never">
    <router-view />
  </el-card>
</template>

<style scoped>
.discord-integration-shell {
  min-height: 0;
}

.discord-integration-shell :deep(> .el-card__body) {
  overflow: visible;
}
</style>
