<script setup lang="ts">
import { useRoute } from 'vue-router';

defineOptions({ name: 'ErrorPage' });

const route = useRoute();
const message = computed(() => route.query.message?.toString() ?? '');
</script>

<template>
  <div class="flex-center flex-col gap-24px size-full min-h-520px overflow-hidden">
    <el-icon class="text-primary" size="400">
      <icon-custom-service-error />
    </el-icon>
    <p v-if="message" class="text-base text-gray-600 px-4 text-center max-w-lg dark:text-gray-400">
      {{ message }}
    </p>
    <router-link to="/">
      <el-button type="primary" size="large">
        {{ $t('common.backToHome') }}
      </el-button>
    </router-link>
  </div>
</template>
