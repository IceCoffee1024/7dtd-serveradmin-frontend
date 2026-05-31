<script setup lang="ts">
defineOptions({ name: 'EconomyPage' });
</script>

<template>
  <el-card class="economy-shell h-full min-h-0" shadow="never">
    <router-view />
  </el-card>
</template>

<style scoped lang="scss">
.economy-shell {
  :deep(> .el-card__body) {
    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: 0;
  }

  :deep(> .el-card__body > *) {
    flex: 1 1 auto;
    min-height: 0;
  }
}
</style>
