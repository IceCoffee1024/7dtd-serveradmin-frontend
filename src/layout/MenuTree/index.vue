<script setup lang="ts">
import { useWindowSize } from '@vueuse/core';
import { useRoute, useRouter } from 'vue-router';
import MenuItem from './MenuItem.vue';

interface Props {
  menus: App.Menu[];
  collapse?: boolean;
  mode?: 'vertical' | 'horizontal';
  ellipsis?: boolean;
  alignment?: 'left' | 'center' | 'right';
}

const props = withDefaults(defineProps<Props>(), {
  collapse: false,
  mode: 'vertical',
  ellipsis: true,
  alignment: 'left',
});

const route = useRoute();
const router = useRouter();
const { width: windowWidth } = useWindowSize();

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

const horizontalVisibleRootCount = computed(() => {
  if (windowWidth.value >= 1400)
    return 5;
  if (windowWidth.value >= 1240)
    return 4;
  if (windowWidth.value >= 1040)
    return 3;
  if (windowWidth.value >= 940)
    return 2;
  if (windowWidth.value >= 820)
    return 1;
  return 0;
});

const horizontalMenus = computed(() => groupedMenus.value.flatMap(group => group.items));
const visibleHorizontalMenus = computed(() => horizontalMenus.value.slice(0, horizontalVisibleRootCount.value));
const overflowHorizontalMenus = computed(() => horizontalMenus.value.slice(horizontalVisibleRootCount.value));
</script>

<template>
  <el-menu
    :default-active="defaultActive"
    :collapse="collapse"
    :mode="mode"
    :ellipsis="ellipsis"
    class="menu-tree"
    :class="{
      'menu-tree--collapsed': collapse,
      'menu-tree--horizontal': mode === 'horizontal',
      [`menu-tree--align-${alignment}`]: mode === 'horizontal',
    }"
    @select="handleSelectMenu"
  >
    <template v-if="mode === 'horizontal'">
      <MenuItem v-for="item in visibleHorizontalMenus" :key="item.index" :menu="item" />
      <el-sub-menu
        v-if="overflowHorizontalMenus.length"
        index="__top-menu-more"
        class="menu-tree__more-menu"
      >
        <template #title>
          <el-icon>
            <icon-ic:baseline-more-horiz />
          </el-icon>
          <span class="sr-only">More</span>
        </template>
        <MenuItem v-for="item in overflowHorizontalMenus" :key="item.index" :menu="item" />
      </el-sub-menu>
    </template>

    <template v-else>
      <template v-for="(group, i) in groupedMenus" :key="i">
        <div
          v-if="group.label && !collapse"
          class="menu-tree__group-label"
        >
          {{ group.label }}
        </div>
        <MenuItem v-for="item in group.items" :key="item.index" :menu="item" />
      </template>
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

.menu-tree.menu-tree--horizontal {
  display: flex;
  align-items: center;
  min-height: auto;
  padding: 0.25rem 0.35rem;
  width: 100%;
  min-width: 0;
}

.menu-tree.menu-tree--horizontal.menu-tree--align-left {
  justify-content: flex-start;
}

.menu-tree.menu-tree--horizontal.menu-tree--align-center {
  justify-content: center;
}

.menu-tree.menu-tree--horizontal.menu-tree--align-right {
  justify-content: flex-end;
}

.menu-tree.menu-tree--horizontal .el-menu-item,
.menu-tree.menu-tree--horizontal .el-sub-menu__title {
  max-width: 148px;
  margin-bottom: 0;
  margin-right: 0.2rem;
  padding-inline: 0.55rem !important;
  border-radius: 999px;
  height: 38px;
}

.menu-tree.menu-tree--horizontal .el-menu-item .el-icon,
.menu-tree.menu-tree--horizontal .el-sub-menu__title .el-icon {
  flex-shrink: 0;
  margin-right: 0.35rem;
}

.menu-tree.menu-tree--horizontal .menu-item__label {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.menu-tree.menu-tree--horizontal .el-menu-item.is-active {
  box-shadow: none;
}

.menu-tree.menu-tree--horizontal > .el-sub-menu > .el-sub-menu__title .el-sub-menu__icon-arrow {
  display: none;
}

.menu-tree.menu-tree--horizontal .menu-tree__more-menu > .el-sub-menu__title {
  width: 44px;
  padding-inline: 0 !important;
  justify-content: center;
}

.menu-tree.menu-tree--horizontal .menu-tree__more-menu > .el-sub-menu__title .el-icon {
  margin-right: 0;
}

.menu-tree.menu-tree--horizontal .el-menu--popup {
  min-width: 180px;
}
</style>
