<script setup lang="ts">
interface Props {
  menu: App.Menu;
}

const { menu } = defineProps<Props>();
</script>

<template>
  <el-sub-menu v-if="menu.children?.length" :index="menu.index">
    <template #title>
      <el-icon>
        <component :is="menu.icon" />
      </el-icon>
      <span class="ellipsis-text" :title="menu.label">{{ menu.label }}</span>
    </template>
    <MenuItem v-for="child in menu.children" :key="child.index" :menu="child" :index="child.index" />
  </el-sub-menu>
  <el-menu-item v-else :index="menu.index">
    <el-icon>
      <component :is="menu.icon" />
    </el-icon>
    <span class="ellipsis-text" :title="menu.label">{{ menu.label }}</span>
  </el-menu-item>
</template>
