import type { RouteRecordRaw } from 'vue-router';
import { createSharedComposable } from '@vueuse/core';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { getMenuLabel } from '~/router/index';

export const useMenus = createSharedComposable(() => {
  const menus = ref<App.Menu[]>([]);
  const { locale } = useI18n();
  const router = useRouter();

  const buildMenuFromRoutes = (routes: RouteRecordRaw[]): App.Menu[] => {
    return routes
      .filter(route => (route.name || route.children?.length) && !route.meta?.hidden)
      .map((route) => {
        const menu: App.Menu = {
          label: getMenuLabel(route.meta?.title),
          icon: route.meta?.icon,
          index: (route.name as string) || route.path,
          keepAlive: route.meta?.keepAlive !== false,
        };

        if (route.children?.length) {
          menu.children = buildMenuFromRoutes(route.children);
        }

        return menu;
      });
  };

  watch(locale, () => {
    // Rebuild routes when locale changes to update menu titles
    const routes = router.getRoutes().find(route => route.path === '/:locale/')?.children;
    if (!routes) {
      throw new Error('Failed to get routes for menu building.');
    }
    menus.value = buildMenuFromRoutes(routes);
  }, { immediate: true });

  return { menus };
});
