<script setup lang="ts">
defineOptions({ name: 'EventAutomationPage' });
</script>

<template>
  <el-card
    class="event-automation-shell h-full min-h-0"
    shadow="never"
    :body-style="{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      minHeight: '0',
      overflow: 'hidden',
    }"
  >
    <router-view />
  </el-card>
</template>
