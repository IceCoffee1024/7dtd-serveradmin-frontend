import type { RouteRecordRaw } from 'vue-router';
import { createRouter, createWebHashHistory } from 'vue-router';
import Layout from '~/layout/index.vue';
import { i18n, isSupportedLocale } from '~/plugins/i18n';
import nProgress from '~/plugins/nprogress';
import { useLocaleStore } from '~/stores/locale';
import { useUserInfoStore } from '~/stores/userInfo';
import { markIcon } from '~/utils/index';

const { t, locale } = i18n.global;

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: () => {
      return { name: 'Dashboard', params: { locale: locale.value } };
    },
    children: [
      {
        path: '403',
        name: '403',
        component: () => import('../views/403.vue'),
        meta: { title: '403', hidden: true, requiresAuth: false },
      },
      {
        path: '404',
        name: '404',
        component: () => import('../views/404.vue'),
        meta: { title: '404', hidden: true, requiresAuth: false },
      },
      {
        path: '500',
        name: '500',
        component: () => import('../views/500.vue'),
        meta: { title: '500', hidden: true, requiresAuth: false },
      },
      {
        path: 'login',
        name: 'Login',
        component: () => import('../views/Login/index.vue'),
        meta: { title: () => t('menus.login'), hidden: true, requiresAuth: false },
      },
    ],
  },
  {
    path: '/:locale/',
    component: Layout,
    redirect: (to) => {
      return { name: 'Dashboard', params: { locale: to.params.locale } };
    },
    children: [
      {
        name: 'Dashboard',
        path: 'dashboard',
        component: () => import('../views/Dashboard/index.vue'),
        meta: {
          title: () => t('menus.dashboard'),
          icon: markIcon(() => import('~icons/mdi/home')),
          keepAlive: true,
        },
      },
      {
        name: 'PlayerList',
        path: 'player-list',
        component: () => import('../views/PlayerList/index.vue'),
        meta: {
          title: () => t('menus.playerList'),
          icon: markIcon(() => import('~icons/mdi/account-group')),
        },
      },
      {
        name: 'GPSMap',
        path: 'gps-map',
        component: () => import('../views/GPSMap/index.vue'),
        meta: {
          title: () => t('menus.gpsMap'),
          icon: markIcon(() => import('~icons/mdi/map')),
        },
      },
      {
        name: 'GameChat',
        path: 'game-chat',
        component: () => import('../views/GameChat/index.vue'),
        meta: {
          title: () => t('menus.gameChat'),
          icon: markIcon(() => import('~icons/mdi/chat')),
        },
      },
      {
        name: 'ServerConfig',
        path: 'server-config',
        component: () => import('../views/ServerConfig/index.vue'),
        meta: {
          title: () => t('menus.serverConfig'),
          icon: markIcon(() => import('~icons/ic/baseline-settings')),
        },
      },
      {
        name: 'BanWhitelist',
        path: 'ban-whitelist',
        component: () => import('../views/BanWhitelist/index.vue'),
        meta: {
          title: () => t('menus.banWhitelist'),
          icon: markIcon(() => import('~icons/mdi/list-status')),
        },
      },
      {
        name: 'Permission',
        path: 'permission',
        component: () => import('../views/Permission/index.vue'),
        meta: {
          title: () => t('menus.permissions'),
          icon: markIcon(() => import('~icons/mdi/account-key')),
        },
      },
      {
        name: 'ModManagement',
        path: 'mod-management',
        component: () => import('../views/ModManagement/index.vue'),
        meta: {
          title: () => t('menus.modManagement'),
          icon: markIcon(() => import('~icons/mdi/puzzle')),
        },
      },
      {
        name: 'Console',
        path: 'console',
        component: () => import('../views/Console/index.vue'),
        meta: {
          title: () => t('menus.console'),
          icon: markIcon(() => import('~icons/mdi/console')),
        },
      },
      {
        name: 'AppSettings',
        path: 'app-settings',
        component: () => import('../views/AppSettings/index.vue'),
        meta: {
          title: () => t('menus.appSettings'),
          icon: markIcon(() => import('~icons/mdi/cog')),
        },
      },
      {
        name: 'ApiDocumentation',
        path: 'swagger',
        redirect: '/swagger',
        meta: {
          title: () => t('menus.apiDocumentation'),
          icon: markIcon(() => import('~icons/mdi/file-document')),
          link: '/swagger',
          requiresAuth: false,
        },
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

  // Check if this route requires authorization and if the user has logged in
  if (to.meta.requiresAuth !== false) {
    const userInfoStore = useUserInfoStore();
    const isLoggedIn = await userInfoStore.isLoggedIn();

    if (!isLoggedIn) {
      // If not, redirect to the login page
      return `/login?redirect=${to.fullPath}`;
    }
  }

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
