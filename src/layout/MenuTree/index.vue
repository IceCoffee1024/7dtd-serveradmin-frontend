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
  <el-menu :default-active="defaultActive" :collapse="collapse" class="h-56px" @select="handleSelectMenu">
    <template v-for="(group, i) in groupedMenus" :key="i">
      <div
        v-if="group.label && !collapse"
        class="text-xs text-gray-400 tracking-wider font-semibold px-3 pb-1 pt-5 select-none uppercase dark:text-gray-500"
      >
        {{ group.label }}
      </div>
      <MenuItem v-for="item in group.items" :key="item.index" :menu="item" />
    </template>
  </el-menu>
</template>

<style lang="scss">
.el-menu {
  border-right: none !important;
  border-bottom: none !important;
}
</style>
