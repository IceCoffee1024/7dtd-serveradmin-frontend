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
      <div class="sidebar-scroller">
        <MenuTree :menus="menus" :collapse="collapse" />
      </div>
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
  display: flex;
  flex-direction: column;
  height: 100%;
  border-radius: 28px;
  border: 1px solid color-mix(in srgb, var(--el-border-color-light) 70%, white 30%);
  background:
    radial-gradient(circle at top center, color-mix(in srgb, var(--colors-primary) 8%, transparent), transparent 28%),
    linear-gradient(180deg, color-mix(in srgb, var(--el-bg-color) 96%, white 4%), var(--el-bg-color));
  box-shadow:
    0 16px 40px color-mix(in srgb, var(--colors-primary) 8%, transparent),
    0 8px 20px rgba(15, 23, 42, 0.04);
  overflow: hidden;
}

.sidebar-scroller {
  flex: 1;
  min-height: 0;
  margin: 0.45rem 0.35rem 0.45rem 0;
  overflow-x: hidden;
  overflow-y: auto;
  scrollbar-gutter: stable;
  scrollbar-color: color-mix(in srgb, var(--colors-primary) 18%, transparent) transparent;
}

.sidebar-scroller::-webkit-scrollbar {
  width: 8px;
}

.sidebar-scroller::-webkit-scrollbar-thumb {
  border-width: 2px;
  background-color: color-mix(in srgb, var(--colors-primary) 20%, transparent);
}

.sidebar-scroller::-webkit-scrollbar-thumb:hover {
  background-color: color-mix(in srgb, var(--colors-primary) 28%, transparent);
}
</style>
