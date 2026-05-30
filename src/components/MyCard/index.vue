<script setup lang="ts">
withDefaults(defineProps<{
  header?: string;
  description?: string;
  compact?: boolean;
}>(), {
  header: '',
  description: '',
  compact: false,
});
</script>

<template>
  <el-card class="my-card">
    <template #default>
      <div class="my-card__body" :class="{ 'my-card__body--compact': compact }">
        <div v-if="header || description || $slots.header || $slots.extra" class="my-card__header">
          <div class="my-card__title-wrap">
            <span class="my-card__accent" />
            <div class="min-w-0 flex-1">
              <slot name="header">
                <p v-if="header" class="my-card__title">
                  {{ header }}
                </p>
              </slot>
              <p v-if="description" class="my-card__description">
                {{ description }}
              </p>
            </div>
          </div>
          <div v-if="$slots.extra" class="my-card__extra">
            <slot name="extra" />
          </div>
        </div>
        <slot />
      </div>
    </template>
  </el-card>
</template>

<style scoped lang="scss">
.my-card {
  border: 1px solid color-mix(in srgb, var(--el-border-color-light) 70%, white 30%);
  border-radius: 24px;
  box-shadow:
    0 20px 60px color-mix(in srgb, var(--colors-primary) 8%, transparent),
    0 4px 14px rgba(15, 23, 42, 0.06);
  overflow: hidden;
  background:
    radial-gradient(circle at top right, color-mix(in srgb, var(--colors-primary) 8%, transparent), transparent 32%),
    linear-gradient(180deg, color-mix(in srgb, var(--el-bg-color) 96%, white 4%), var(--el-bg-color));

  :deep(.el-card__body) {
    padding: 0;
  }
}

.my-card__body {
  padding: 1.25rem;
}

.my-card__body--compact {
  padding: 1rem;
}

.my-card__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;
}

.my-card__title-wrap {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  min-width: 0;
}

.my-card__accent {
  width: 0.3rem;
  min-width: 0.3rem;
  height: 1.15rem;
  margin-top: 0.25rem;
  border-radius: 999px;
  background: linear-gradient(180deg, var(--colors-primary), var(--el-color-info));
  box-shadow: 0 0 0 6px color-mix(in srgb, var(--colors-primary) 10%, transparent);
}

.my-card__title {
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
  line-height: 1.4;
  color: var(--el-text-color-primary);
}

.my-card__description {
  margin: 0.35rem 0 0;
  font-size: 0.82rem;
  line-height: 1.5;
  color: var(--el-text-color-secondary);
}

.my-card__extra {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
}
</style>
