<script setup lang="ts">
import { useRoute } from 'vue-router';

defineOptions({ name: 'ErrorPage' });

const route = useRoute();
const message = computed(() => route.query.message?.toString() ?? '');
</script>

<template>
  <ExceptionPage :type="500" :message="message" />
</template>
