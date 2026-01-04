<script setup lang="ts">
interface Props {
  colors: readonly string[];
}
defineProps<Props>();

const selectedColor = defineModel<string>('selectedColor');
</script>

<template>
  <div class="config-colors">
    <button
      v-for="name of colors"
      :key="name"
      :title="name"
      type="button"
      class="color-button"
      :class="[
        {
          selected: selectedColor === name,
        },
      ]"
      :style="{ backgroundColor: `var(--colors-${name}-500)` }"
      @click="selectedColor = name"
    />
  </div>
</template>

<style scoped lang="scss">
.config-colors {
  padding-top: 0.5rem;
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  justify-content: space-between;
}

.color-button {
  border: none;
  width: 1.25rem;
  height: 1.25rem;
  border-radius: 9999px;
  padding: 0;
  cursor: pointer;
}

.selected {
  --ring-width: 2px;
  --ring-offset-width: 2px;
  --ring-color: var(--colors-primary-500);
  --ring-offset-color: #ffffff;
  --ring-offset-shadow: 0 0 0 var(--ring-offset-width) var(--ring-offset-color);
  --ring-shadow: 0 0 0 calc(var(--ring-width) + var(--ring-offset-width)) var(--ring-color);
  box-shadow: var(--ring-offset-shadow), var(--ring-shadow);
}
</style>
