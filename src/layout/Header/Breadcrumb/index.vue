<script setup lang="ts">
import type { RouteLocationNormalizedLoaded } from 'vue-router';
import { createReusableTemplate } from '@vueuse/core';
import { useRoute, useRouter } from 'vue-router';
import { useMenus } from '~/composables';

interface Props {
  showIcon?: boolean;
}
defineProps<Props>();

type Breadcrumb = Omit<App.Menu, 'children'> & {
  options?: Breadcrumb[];
};

interface BreadcrumbContentProps {
  breadcrumb: Breadcrumb;
}
const [DefineBreadcrumbContent, BreadcrumbContent] = createReusableTemplate<BreadcrumbContentProps>();

const route = useRoute();
const router = useRouter();
const { menus } = useMenus();

function handleClickMenu(breadcrumb: Breadcrumb) {
  let target = breadcrumb;
  while (target.options?.length) {
    target = target.options[0];
  }

  if (!target.index) {
    console.warn('Breadcrumb target has no index');
    return;
  }

  const resolved = router.resolve({ name: target.index });
  if (!resolved.meta.link) {
    router.push(resolved);
  }
  else {
    window.open(resolved.meta.link, '_blank');
  }
}

/**
 * Transform menu to breadcrumb
 *
 * @param menu
 */
function transformMenuToBreadcrumb(menu: App.Menu) {
  const { children, ...rest } = menu;

  const breadcrumb: Breadcrumb = {
    ...rest,
  };

  if (children?.length) {
    breadcrumb.options = children.map(transformMenuToBreadcrumb);
  }

  return breadcrumb;
}

/**
 * Get breadcrumbs by route
 *
 * @param route
 * @param menus
 */
function getBreadcrumbsByRoute(route: RouteLocationNormalizedLoaded, menus: App.Menu[]): Breadcrumb[] {
  const routeName = route.name as string;

  for (const menu of menus) {
    if (menu.index === routeName) {
      return [transformMenuToBreadcrumb(menu)];
    }

    if (menu.children?.length) {
      const result = getBreadcrumbsByRoute(route, menu.children);
      if (result.length > 0) {
        return [transformMenuToBreadcrumb(menu), ...result];
      }
    }
  }

  return [];
}

const breadcrumbs = computed(() => {
  return getBreadcrumbsByRoute(route, menus.value);
});
</script>

<template>
  <el-breadcrumb class="flex">
    <!-- define component start: BreadcrumbContent -->
    <DefineBreadcrumbContent v-slot="{ breadcrumb }">
      <div class="align-middle inline-flex items-center">
        <el-icon v-if="showIcon && breadcrumb.icon" class="text-lg me-4px">
          <component :is="breadcrumb.icon" />
        </el-icon>
        {{ breadcrumb.label }}
      </div>
    </DefineBreadcrumbContent>

    <!-- define component end: BreadcrumbContent -->
    <el-breadcrumb-item v-for="item in breadcrumbs" :key="item.index">
      <el-dropdown v-if="item.options?.length" class="cursor-pointer" @command="handleClickMenu">
        <BreadcrumbContent :breadcrumb="item" />
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item v-for="option in item.options" :key="option.index" :command="option">
              {{ option.label }}
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
      <BreadcrumbContent v-else :breadcrumb="item" />
    </el-breadcrumb-item>
  </el-breadcrumb>
</template>

<style scoped></style>
