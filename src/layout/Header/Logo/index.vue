<script setup lang="ts">
withDefaults(defineProps<Props>(), {
  showLogo: true,
  showTitle: true,
});

interface Props {
  /** Whether to show the logo */
  showLogo?: boolean;
  /** Whether to show the title */
  showTitle?: boolean;
}
</script>

<template>
  <RouterLink to="/" class="nowrap-hidden flex-center">
    <el-image v-if="showLogo" src="/favicon.svg" class="size-32px" />
    <h2 v-if="showTitle" class="font-bold pl-8px transition duration-300 ease-in-out text-base text-primary">
      {{ $t('common.projectName') }}
    </h2>
  </RouterLink>
</template>

<style scoped></style>
