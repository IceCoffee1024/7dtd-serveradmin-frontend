<script setup lang="ts">
defineOptions({ name: 'GeoIpAccessControlPage' });
</script>

<template>
  <el-card class="geoip-access-control-shell" shadow="never">
    <router-view />
  </el-card>
</template>

<style scoped>
.geoip-access-control-shell {
  min-height: 0;
}

.geoip-access-control-shell :deep(> .el-card__body) {
  overflow: visible;
}
</style>
