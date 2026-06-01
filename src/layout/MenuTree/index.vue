<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router';
import MenuItem from './MenuItem.vue';

interface Props {
  menus: App.Menu[];
  collapse?: boolean;
}

const props = defineProps<Props>();

const route = useRoute();
const router = useRouter();

interface MenuGroup {
  label?: string;
  items: App.Menu[];
}

const groupedMenus = computed((): MenuGroup[] => {
  const groups: MenuGroup[] = [];
  let current: MenuGroup | null = null;
  for (const menu of props.menus) {
    if (menu.groupLabel !== undefined) {
      current = { label: menu.groupLabel, items: [menu] };
      groups.push(current);
    }
    else if (current) {
      current.items.push(menu);
    }
    else {
      current = { items: [menu] };
      groups.push(current);
    }
  }
  return groups;
});

function handleSelectMenu(index: string) {
  const resolved = router.resolve({ name: index });
  if (!resolved.meta.link) {
    router.push(resolved);
  }
  else {
    window.open(resolved.meta.link, '_blank');
  }
}

const defaultActive = computed(() => route.name as string);
</script>

<template>
  <el-menu :default-active="defaultActive" :collapse="collapse" class="menu-tree" :class="{ 'menu-tree--collapsed': collapse }" @select="handleSelectMenu">
    <template v-for="(group, i) in groupedMenus" :key="i">
      <div
        v-if="group.label && !collapse"
        class="menu-tree__group-label"
      >
        {{ group.label }}
      </div>
      <MenuItem v-for="item in group.items" :key="item.index" :menu="item" />
    </template>
  </el-menu>
</template>

<style lang="scss">
.menu-tree {
  min-height: 100%;
  padding: 0.9rem 0.7rem 1rem;
  box-sizing: border-box;
  border-right: none !important;
  border-bottom: none !important;
  background: transparent !important;
}

.menu-tree__group-label {
  padding: 1rem 0.75rem 0.45rem;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  color: var(--el-text-color-secondary);
  text-transform: uppercase;
  user-select: none;
}

.menu-tree .el-menu-item,
.menu-tree .el-sub-menu__title {
  height: 44px;
  margin-bottom: 0.3rem;
  border-radius: 14px;
  color: var(--el-text-color-secondary);
  transition:
    background-color 0.2s ease,
    color 0.2s ease,
    transform 0.2s ease,
    box-shadow 0.2s ease;
}

.menu-tree .el-menu-item:hover,
.menu-tree .el-sub-menu__title:hover {
  background: color-mix(in srgb, var(--colors-primary) 10%, transparent) !important;
  color: var(--el-text-color-primary) !important;
}

.menu-tree .el-menu-item.is-active {
  background: linear-gradient(
    90deg,
    color-mix(in srgb, var(--colors-primary) 14%, transparent),
    color-mix(in srgb, var(--el-color-info) 8%, transparent)
  ) !important;
  color: var(--colors-primary) !important;
  box-shadow: 0 10px 24px color-mix(in srgb, var(--colors-primary) 12%, transparent);
}

.menu-tree .el-menu-item .el-icon,
.menu-tree .el-sub-menu__title .el-icon {
  margin-right: 10px;
  font-size: 18px;
}

.menu-tree .el-sub-menu .el-menu-item {
  min-width: 0;
  margin-left: 0.5rem;
}

.menu-tree .el-sub-menu .el-menu {
  background: transparent !important;
}

.menu-tree.menu-tree--collapsed {
  padding-inline: 0.45rem;
}

.menu-tree.menu-tree--collapsed .el-menu-item,
.menu-tree.menu-tree--collapsed .el-sub-menu__title {
  justify-content: center;
  padding: 0 !important;
}

.menu-tree.menu-tree--collapsed .el-menu-item .el-icon,
.menu-tree.menu-tree--collapsed .el-sub-menu__title .el-icon {
  margin-right: 0;
}

.menu-tree[role='menubar'] {
  min-height: auto;
  padding: 0.25rem 0.35rem;
}

.menu-tree[role='menubar'] .el-menu-item,
.menu-tree[role='menubar'] .el-sub-menu__title {
  margin-bottom: 0;
  margin-right: 0.35rem;
  border-radius: 999px;
  height: 38px;
}

.menu-tree[role='menubar'] .el-menu-item.is-active {
  box-shadow: none;
}
</style>
