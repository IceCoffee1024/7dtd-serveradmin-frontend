<script setup lang="ts">
import { useRoute } from 'vue-router';

const message = computed(() => useRoute().query.message?.toString() ?? '');
</script>

<template>
  <ExceptionPage :type="403" :message="message" />
</template>

<style scoped></style>
