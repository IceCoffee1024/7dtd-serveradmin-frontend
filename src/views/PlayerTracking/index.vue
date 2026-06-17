<script setup lang="ts">
defineOptions({ name: 'PlayerTrackingPage' });
</script>

<template>
  <el-card class="player-tracking-shell" shadow="never">
    <router-view />
  </el-card>
</template>

<style scoped>
.player-tracking-shell {
  min-height: 0;
}

.player-tracking-shell :deep(> .el-card__body) {
  overflow: visible;
}
</style>
