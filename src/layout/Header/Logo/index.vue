<script setup lang="ts">
import logoImg from '~/assets/images/logo.png';

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
  <RouterLink to="/" class="logo-link">
    <el-image v-if="showLogo" :src="logoImg" class="logo-link__image" />
    <h2 v-if="showTitle" class="logo-link__title">
      {{ $t('common.projectName') }}
    </h2>
  </RouterLink>
</template>

<style scoped lang="scss">
.logo-link {
  display: inline-flex;
  align-items: center;
  max-width: 100%;
  min-width: 0;
  padding: 0.35rem 0.6rem 0.35rem 0.35rem;
  border-radius: 999px;
  background: color-mix(in srgb, var(--el-bg-color) 86%, white 14%);
  border: 1px solid color-mix(in srgb, var(--el-border-color-light) 68%, white 32%);
  box-shadow: 0 8px 20px rgba(15, 23, 42, 0.04);
  overflow: hidden;
}

.logo-link__image {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 8px 20px color-mix(in srgb, var(--colors-primary) 14%, transparent);
}

.logo-link__title {
  margin: 0;
  min-width: 0;
  padding-left: 0.6rem;
  overflow: hidden;
  font-size: 0.98rem;
  font-weight: 800;
  letter-spacing: 0.01em;
  color: var(--colors-primary);
  text-overflow: ellipsis;
  transition: color 0.2s ease;
  white-space: nowrap;
}
</style>
