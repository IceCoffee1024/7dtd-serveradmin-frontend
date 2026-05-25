<script lang="ts" setup>
defineProps<Props>();

type ExceptionType = 403 | 404 | 500;

interface Props {
  /**
   * Exception type
   *
   * - 403: no permission
   * - 404: not found
   * - 500: service error
   */
  type: ExceptionType;
  /** Optional detail message shown below the icon, e.g. the reason from a Steam OAuth rejection. */
  message?: string;
}
</script>

<template>
  <div class="flex-center flex-col gap-24px size-full min-h-520px overflow-hidden">
    <el-icon class="text-primary" size="400">
      <icon-custom-no-permission v-if="type === 403" />
      <icon-custom-not-found v-else-if="type === 404" />
      <icon-custom-service-error v-else-if="type === 500" />
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
