<script setup lang="ts">
import { useMenus } from '~/composables';
import MenuTree from '../MenuTree/index.vue';

defineProps<Props>();

interface Props {
  collapse: boolean;
}

const { menus } = useMenus();
</script>

<template>
  <!-- overflow-x-hidden: Prevent horizontal scrollbars from appearing when collapsing. -->
  <div class="sidebar-shell">
    <div class="sidebar-panel">
      <MenuTree :menus="menus" :collapse="collapse" />
    </div>
  </div>
</template>

<style scoped lang="scss">
.sidebar-shell {
  width: 100%;
  height: 100%;
  padding: 0.9rem 0.75rem 0.75rem;
  overflow: hidden;
}

.sidebar-panel {
  height: 100%;
  border-radius: 28px;
  border: 1px solid color-mix(in srgb, var(--el-border-color-light) 70%, white 30%);
  background:
    radial-gradient(circle at top center, color-mix(in srgb, var(--colors-primary) 8%, transparent), transparent 28%),
    linear-gradient(180deg, color-mix(in srgb, var(--el-bg-color) 96%, white 4%), var(--el-bg-color));
  box-shadow:
    0 16px 40px color-mix(in srgb, var(--colors-primary) 8%, transparent),
    0 8px 20px rgba(15, 23, 42, 0.04);
  overflow-x: hidden;
  overflow-y: auto;
}
</style>
