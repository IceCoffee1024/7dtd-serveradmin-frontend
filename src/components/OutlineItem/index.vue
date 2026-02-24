<script setup lang="ts">
defineProps({
  legend: {
    type: String,
    default: '',
  },
});
</script>

<template>
  <fieldset
    class="px-4 py-3 border border-gray-300 rounded-md dark:border-gray-600"
  >
    <legend
      v-if="legend || $slots.label"
      class="font-semibold px-2 ellipsis-text"
    >
      <slot name="label">
        {{ legend }}
      </slot>
    </legend>
    <slot />
  </fieldset>
</template>
