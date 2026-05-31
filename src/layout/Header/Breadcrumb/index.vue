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
  <el-breadcrumb class="breadcrumb-shell">
    <!-- define component start: BreadcrumbContent -->
    <DefineBreadcrumbContent v-slot="{ breadcrumb }">
      <div class="breadcrumb-content">
        <el-icon v-if="showIcon && breadcrumb.icon" class="breadcrumb-content__icon">
          <component :is="breadcrumb.icon" />
        </el-icon>
        <span class="ellipsis-text">{{ breadcrumb.label }}</span>
      </div>
    </DefineBreadcrumbContent>

    <!-- define component end: BreadcrumbContent -->
    <el-breadcrumb-item v-for="item in breadcrumbs" :key="item.index">
      <el-dropdown v-if="item.options?.length" class="breadcrumb-dropdown" @command="handleClickMenu">
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

<style scoped lang="scss">
.breadcrumb-shell {
  display: flex;
  align-items: center;
  color: var(--el-text-color-secondary);
}

.breadcrumb-content {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  max-width: 220px;
  min-width: 0;
  padding: 0.15rem 0;
  font-size: 0.86rem;
  font-weight: 600;
}

.breadcrumb-content__icon {
  font-size: 1rem;
  flex-shrink: 0;
}

.breadcrumb-dropdown {
  cursor: pointer;
}

:deep(.el-breadcrumb__item:last-child .el-breadcrumb__inner),
:deep(.el-breadcrumb__item:last-child .el-breadcrumb__inner a) {
  color: var(--el-text-color-primary);
  font-weight: 700;
}

:deep(.el-breadcrumb__separator) {
  margin: 0 0.45rem;
  color: color-mix(in srgb, var(--el-text-color-secondary) 68%, white 32%);
}
</style>
