<script setup lang="ts">
interface Props {
  colorName: string;
}
defineProps<Props>();
</script>

<template>
  <div
    class="border border-white/30 rounded-full h-12px w-12px cursor-pointer ring-1 transition-transform hover:scale-110"
    :style="{
      'background-color': `var(--colors-${colorName}-500)`,
    }"
  />
</template>
