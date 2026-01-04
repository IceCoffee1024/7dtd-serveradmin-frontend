import type { LocationQuery, RouteRecordRaw } from 'vue-router';
import qs from 'qs';
import { createRouter, createWebHashHistory } from 'vue-router';
import Layout from '~/layout/index.vue';
import { i18n, isSupportedLocale } from '~/plugins/i18n';
import nProgress from '~/plugins/nprogress';
import { useLocaleStore } from '~/stores/locale';
import { markIcon } from '~/utils/index';

const { t, locale } = i18n.global;

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: () => {
      return { name: 'Home', params: { locale: locale.value } };
    },
    children: [
      {
        path: '403',
        name: '403',
        component: () => import('../views/403.vue'),
        meta: { title: '403', hidden: true },
      },
      {
        path: '404',
        name: '404',
        component: () => import('../views/404.vue'),
        meta: { title: '404', hidden: true },
      },
      {
        path: '500',
        name: '500',
        component: () => import('../views/500.vue'),
        meta: { title: '500', hidden: true },
      },
    ],
  },
  {
    path: '/:locale/',
    component: Layout,
    redirect: (to) => {
      return { name: 'Home', params: { locale: to.params.locale } };
    },
    children: [
      {
        name: 'Home',
        path: 'home',
        component: () => import('../views/Home/index.vue'),
        meta: {
          title: () => t('menus.home'),
          icon: markIcon(() => import('~icons/mdi/home')),
          keepAlive: true,
          requiresAuth: true,
        },
      },
      {
        path: 'multi-level-menu',
        meta: {
          title: 'Multi-level Menu',
          icon: markIcon(() => import('~icons/mdi/menu')),
        },
        children: [
          {
            name: 'MultiLevelMenu11',
            path: '1-1',
            component: () => import('../views/MultiLevelMenu/1-1/index.vue'),
            meta: {
              title: 'Menu 1-1',
            },
          },
          {
            path: '1-2',
            meta: {
              title: 'Menu 1-2',
            },
            children: [
              {
                name: 'MultiLevelMenu121',
                path: '1',
                component: () => import('../views/MultiLevelMenu/1-2/1/index.vue'),
                meta: {
                  title: 'Menu 1-2-1',
                },
              },
              {
                name: 'MultiLevelMenu122',
                path: '2',
                component: () => import('../views/MultiLevelMenu/1-2/2/index.vue'),
                meta: {
                  title: 'Menu 1-2-2',
                },
              },
            ],
          },
        ],
      },
    ],
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/404',
  },
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
  parseQuery: (query: string) => qs.parse(query) as LocationQuery,
  stringifyQuery: qs.stringify,
});

function getMenuLabel(title: string | (() => string) | undefined): string {
  return (typeof title === 'function' ? title() : title) || 'Unnamed';
}

function updateDocumentTitle(routeTitle?: string | (() => string)) {
  const menuLabel = getMenuLabel(routeTitle);
  const projectName = t('common.projectName');
  document.title = `${menuLabel} - ${projectName}`;
}

router.beforeEach(async (to) => {
  nProgress.start();

  const paramsLocale = to.params.locale || locale.value;

  if (!isSupportedLocale(paramsLocale)) {
    return '/404';
  }

  const localeStore = useLocaleStore();
  await localeStore.applyLocale(paramsLocale);
});

router.afterEach((to) => {
  updateDocumentTitle(to.meta.title);
  nProgress.done();
});

export default router;
export { getMenuLabel, routes };
