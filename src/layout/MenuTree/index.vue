<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router';
import MenuItem from './MenuItem.vue';

defineProps<Props>();

interface Props {
  menus: App.Menu[];
}

const route = useRoute();
const router = useRouter();
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
  <el-menu :default-active="defaultActive" class="h-56px" @select="handleSelectMenu">
    <template v-for="menu in menus" :key="menu.index">
      <MenuItem :menu="menu" />
    </template>
  </el-menu>
</template>

<style lang="scss">
.el-menu {
  border-right: none !important;
  border-bottom: none !important;
}
</style>
