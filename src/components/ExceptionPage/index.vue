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
}
</script>

<template>
  <div class="flex-center flex-col gap-24px size-full min-h-520px overflow-hidden">
    <el-icon class="text-primary" size="400">
      <icon-custom-no-permission v-if="type === 403" />
      <icon-custom-not-found v-else-if="type === 404" />
      <icon-custom-service-error v-else-if="type === 500" />
    </el-icon>
    <router-link to="/">
      <el-button type="primary" size="large">
        {{ $t('common.backToHome') }}
      </el-button>
    </router-link>
  </div>
</template>
