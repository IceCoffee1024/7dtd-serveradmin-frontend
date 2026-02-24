<script setup lang="ts">
defineProps({
  header: {
    type: String,
    default: '',
  },
});
</script>

<template>
  <el-card class="rounded-12px">
    <template #default>
      <div>
        <div
          class="mb-20px relative before:rounded-xl before:h-16px before:w-4px before:content-[''] before:top-4px before:absolute before:bg-primary"
        >
          <span class="text-base font-medium ml-12px">{{ header }}</span>
        </div>
        <slot />
      </div>
    </template>
  </el-card>
</template>
