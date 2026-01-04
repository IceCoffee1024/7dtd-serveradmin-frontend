<script setup lang="ts">
interface Props {
  active: boolean;
}

defineProps<Props>();
</script>

<template>
  <div
    class="m-1px border-2 rounded-lg cursor-pointer text-primary"
    :class="[
      active
        ? 'border-primary shadow-lg'
        : 'border-transparent shadow-md hover:border-primary',
    ]"
  >
    <slot />
  </div>
</template>
