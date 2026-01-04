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
  <div class="size-full overflow-x-hidden">
    <MenuTree :menus="menus" :collapse="collapse" class="size-full" />
  </div>
</template>
