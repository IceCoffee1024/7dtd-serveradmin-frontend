import type { RouteRecordRaw } from 'vue-router';
import { createRouter, createWebHashHistory } from 'vue-router';
import Layout from '~/layout/index.vue';
import { LOCALE_TYPE } from '~/locales/constant';
import { i18n, isSupportedLocale, resolveSupportedLocale } from '~/plugins/i18n';
import nProgress from '~/plugins/nprogress';
import { useLocaleStore } from '~/stores/locale';
import { useUserInfoStore } from '~/stores/userInfo';
import { markIcon } from '~/utils/index';

const { t, locale } = i18n.global;

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: () => {
      return { name: 'Dashboard', params: { locale: resolveSupportedLocale(locale.value) } };
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
        path: 'error',
        name: 'Error',
        component: () => import('../views/error.vue'),
        meta: { hidden: true, requiresAuth: false },
      },
      {
        path: 'login',
        name: 'Login',
        component: () => import('../views/Login/index.vue'),
        meta: { title: () => t('menus.login'), hidden: true, requiresAuth: false },
      },
      {
        path: 'login/fromSteam',
        name: 'LoginFromSteam',
        component: () => import('../views/Login/FromSteam.vue'),
        meta: { hidden: true, requiresAuth: false },
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
          groupLabel: () => t('menus.groups.monitoring'),
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
        name: 'FeatureModules',
        path: 'feature-modules',
        component: () => import('../views/FeatureModules/index.vue'),
        meta: {
          title: () => t('menus.featureModules'),
          icon: markIcon(() => import('~icons/mdi/puzzle')),
          groupLabel: () => t('menus.groups.gameFeatures'),
        },
      },
      {
        name: 'GameChat',
        path: 'game-chat',
        redirect: { name: 'LiveChat' },
        meta: {
          title: () => t('menus.gameChat'),
          icon: markIcon(() => import('~icons/mdi/chat')),
          groupLabel: () => t('menus.groups.gameFeatures'),
        },
        children: [
          {
            name: 'LiveChat',
            path: 'live-chat',
            component: () => import('../views/GameChat/LiveChat/index.vue'),
            meta: {
              title: () => t('menus.liveChat'),
            },
          },
          {
            name: 'ChatHistory',
            path: 'chat-history',
            component: () => import('../views/GameChat/ChatHistory/index.vue'),
            meta: {
              title: () => t('menus.chatHistory'),
            },
          },
          {
            name: 'ChatSettings',
            path: 'chat-settings',
            component: () => import('../views/GameChat/ChatSettings/index.vue'),
            meta: {
              title: () => t('menus.chatSettings'),
            },
          },
          {
            name: 'ColoredChat',
            path: 'colored-chat',
            component: () => import('../views/GameChat/ColoredChat/index.vue'),
            meta: {
              title: () => t('menus.coloredChat'),
            },
          },
        ],
      },
      {
        name: 'Economy',
        path: 'economy',
        component: () => import('../views/Economy/index.vue'),
        redirect: { name: 'EconomyOverview' },
        meta: {
          title: () => t('menus.economy'),
          icon: markIcon(() => import('~icons/mdi/cash-multiple')),
        },
        children: [
          {
            name: 'EconomyOverview',
            path: 'overview',
            component: () => import('../views/Economy/Overview/index.vue'),
            meta: {
              title: () => t('menus.economyOverview'),
              icon: markIcon(() => import('~icons/mdi/chart-bar')),
            },
          },
          {
            name: 'EconomyAccounts',
            path: 'accounts',
            component: () => import('../views/Economy/Accounts/index.vue'),
            meta: {
              title: () => t('menus.economyAccounts'),
              icon: markIcon(() => import('~icons/mdi/account-cash')),
            },
          },
          {
            name: 'EconomyTransactions',
            path: 'transactions',
            component: () => import('../views/Economy/Transactions/index.vue'),
            meta: {
              title: () => t('menus.economyTransactions'),
              icon: markIcon(() => import('~icons/mdi/swap-horizontal')),
            },
          },
          {
            name: 'EconomySettings',
            path: 'settings',
            component: () => import('../views/Economy/Settings/index.vue'),
            meta: {
              title: () => t('menus.economySettings'),
              icon: markIcon(() => import('~icons/mdi/cog-outline')),
            },
          },
          {
            name: 'EconomyShop',
            path: 'shop',
            component: () => import('../views/Economy/Shop/index.vue'),
            meta: {
              title: () => t('menus.economyShop'),
              icon: markIcon(() => import('~icons/mdi/store-outline')),
            },
          },
          {
            name: 'EconomyRedeemCodes',
            path: 'redeem-codes',
            component: () => import('../views/Economy/RedeemCodes/index.vue'),
            meta: {
              title: () => t('menus.economyRedeemCodes'),
              icon: markIcon(() => import('~icons/mdi/ticket-percent-outline')),
            },
          },
        ],
      },
      {
        name: 'GameItems',
        path: 'game-items',
        component: () => import('../views/GameItems/index.vue'),
        meta: {
          title: () => t('menus.gameItems'),
          icon: markIcon(() => import('~icons/mdi/package-variant')),
        },
      },
      {
        name: 'ServerConfig',
        path: 'server-config',
        component: () => import('../views/ServerConfig/index.vue'),
        meta: {
          title: () => t('menus.serverConfig'),
          icon: markIcon(() => import('~icons/ic/baseline-settings')),
          groupLabel: () => t('menus.groups.serverManagement'),
        },
      },
      {
        name: 'Teleport',
        path: 'teleport',
        component: () => import('../views/Teleport/index.vue'),
        redirect: { name: 'TeleportTools' },
        meta: {
          title: () => t('menus.teleport'),
          icon: markIcon(() => import('~icons/mdi/map-marker-right')),
        },
        children: [
          {
            name: 'TeleportTools',
            path: 'tools',
            component: () => import('../views/Teleport/Tools/index.vue'),
            meta: {
              title: () => t('menus.teleportTools'),
              icon: markIcon(() => import('~icons/mdi/map-marker-right')),
            },
          },
          {
            name: 'TeleportSettings',
            path: 'settings',
            component: () => import('../views/Teleport/Settings/index.vue'),
            meta: {
              title: () => t('menus.teleportSettings'),
              icon: markIcon(() => import('~icons/mdi/cog-outline')),
            },
          },
          {
            name: 'TeleportCities',
            path: 'cities',
            component: () => import('../views/Teleport/Cities/index.vue'),
            meta: {
              title: () => t('menus.teleportCities'),
              icon: markIcon(() => import('~icons/mdi/city')),
            },
          },
          {
            name: 'TeleportHomes',
            path: 'homes',
            component: () => import('../views/Teleport/Homes/index.vue'),
            meta: {
              title: () => t('menus.teleportHomes'),
              icon: markIcon(() => import('~icons/mdi/home-account')),
            },
          },
          {
            name: 'TeleportLogs',
            path: 'logs',
            component: () => import('../views/Teleport/Logs/index.vue'),
            meta: {
              title: () => t('menus.teleportLogs'),
              icon: markIcon(() => import('~icons/mdi/history')),
            },
          },
        ],
      },
      {
        name: 'GameNotice',
        path: 'game-notice',
        component: () => import('../views/GameNotice/index.vue'),
        meta: {
          title: () => t('menus.gameNotice'),
          icon: markIcon(() => import('~icons/mdi/bullhorn-outline')),
        },
      },
      {
        name: 'VoteRestart',
        path: 'vote-restart',
        component: () => import('../views/VoteRestart/index.vue'),
        redirect: { name: 'VoteRestartSettings' },
        meta: {
          title: () => t('menus.voteRestart'),
          icon: markIcon(() => import('~icons/mdi/vote')),
        },
        children: [
          {
            name: 'VoteRestartSettings',
            path: 'settings',
            component: () => import('../views/VoteRestart/Settings/index.vue'),
            meta: {
              title: () => t('menus.voteRestartSettings'),
              icon: markIcon(() => import('~icons/mdi/cog-outline')),
            },
          },
        ],
      },
      {
        name: 'VoteKick',
        path: 'vote-kick',
        component: () => import('../views/VoteKick/index.vue'),
        redirect: { name: 'VoteKickSettings' },
        meta: {
          title: () => t('menus.voteKick'),
          icon: markIcon(() => import('~icons/mdi/account-remove')),
        },
        children: [
          {
            name: 'VoteKickSettings',
            path: 'settings',
            component: () => import('../views/VoteKick/Settings/index.vue'),
            meta: {
              title: () => t('menus.voteKickSettings'),
              icon: markIcon(() => import('~icons/mdi/cog-outline')),
            },
          },
        ],
      },
      {
        name: 'Achievement',
        path: 'achievement',
        component: () => import('../views/Achievement/index.vue'),
        redirect: { name: 'AchievementDefinitions' },
        meta: {
          title: () => t('menus.achievement'),
          icon: markIcon(() => import('~icons/mdi/trophy-outline')),
        },
        children: [
          {
            name: 'AchievementDefinitions',
            path: 'definitions',
            component: () => import('../views/Achievement/Definitions/index.vue'),
            meta: {
              title: () => t('menus.achievementDefinitions'),
              icon: markIcon(() => import('~icons/mdi/trophy-variant-outline')),
            },
          },
          {
            name: 'AchievementRecords',
            path: 'records',
            component: () => import('../views/Achievement/Records/index.vue'),
            meta: {
              title: () => t('menus.achievementRecords'),
              icon: markIcon(() => import('~icons/mdi/history')),
            },
          },
          {
            name: 'AchievementSettings',
            path: 'settings',
            component: () => import('../views/Achievement/Settings/index.vue'),
            meta: {
              title: () => t('menus.achievementSettings'),
              icon: markIcon(() => import('~icons/mdi/cog-outline')),
            },
          },
        ],
      },
      {
        name: 'OnlineReward',
        path: 'online-reward',
        component: () => import('../views/OnlineReward/index.vue'),
        redirect: { name: 'OnlineRewardSettings' },
        meta: {
          title: () => t('menus.onlineReward'),
          icon: markIcon(() => import('~icons/mdi/clock-check-outline')),
        },
        children: [
          {
            name: 'OnlineRewardSettings',
            path: 'settings',
            component: () => import('../views/OnlineReward/Settings/index.vue'),
            meta: {
              title: () => t('menus.onlineRewardSettings'),
              icon: markIcon(() => import('~icons/mdi/cog-outline')),
            },
          },
        ],
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
          title: () => t('menus.permission'),
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
          groupLabel: () => t('menus.groups.operations'),
        },
      },
      {
        name: 'Restart',
        path: 'restart',
        component: () => import('../views/Restart/index.vue'),
        redirect: { name: 'RestartSettings' },
        meta: {
          title: () => t('menus.restart'),
          icon: markIcon(() => import('~icons/mdi/restart')),
        },
        children: [
          {
            name: 'RestartSettings',
            path: 'settings',
            component: () => import('../views/Restart/Settings/index.vue'),
            meta: {
              title: () => t('menus.restartSettings'),
              icon: markIcon(() => import('~icons/mdi/cog-outline')),
            },
          },
          {
            name: 'RestartRun',
            path: 'run',
            component: () => import('../views/Restart/Run/index.vue'),
            meta: {
              title: () => t('menus.restartRun'),
              icon: markIcon(() => import('~icons/mdi/play-circle-outline')),
            },
          },
          {
            name: 'RestartHistory',
            path: 'history',
            component: () => import('../views/Restart/History/index.vue'),
            meta: {
              title: () => t('menus.restartHistory'),
              icon: markIcon(() => import('~icons/mdi/history')),
            },
          },
        ],
      },
      {
        name: 'Scheduler',
        path: 'scheduler',
        component: () => import('../views/ScheduledCommand/index.vue'),
        redirect: { name: 'SchedulerTasks' },
        meta: {
          title: () => t('menus.scheduler'),
          icon: markIcon(() => import('~icons/mdi/calendar-clock')),
        },
        children: [
          {
            name: 'SchedulerTasks',
            path: 'tasks',
            component: () => import('../views/ScheduledCommand/Tasks/index.vue'),
            meta: {
              title: () => t('menus.schedulerTasks'),
              icon: markIcon(() => import('~icons/mdi/format-list-checks')),
            },
          },
          {
            name: 'SchedulerHistory',
            path: 'history',
            component: () => import('../views/ScheduledCommand/History/index.vue'),
            meta: {
              title: () => t('menus.schedulerHistory'),
              icon: markIcon(() => import('~icons/mdi/history')),
            },
          },
          {
            name: 'SchedulerSettings',
            path: 'settings',
            component: () => import('../views/ScheduledCommand/Settings/index.vue'),
            meta: {
              title: () => t('menus.schedulerSettings'),
              icon: markIcon(() => import('~icons/mdi/cog-outline')),
            },
          },
        ],
      },
      {
        name: 'Backup',
        path: 'backup',
        redirect: { name: 'BackupSettings' },
        meta: {
          title: () => t('menus.backup'),
          icon: markIcon(() => import('~icons/mdi/backup-restore')),
        },
        children: [
          {
            name: 'BackupSettings',
            path: 'settings',
            component: () => import('../views/Backup/Settings/index.vue'),
            meta: {
              title: () => t('menus.backupSettings'),
              icon: markIcon(() => import('~icons/mdi/cog-outline')),
            },
          },
          {
            name: 'BackupTasks',
            path: 'tasks',
            component: () => import('../views/Backup/Tasks/index.vue'),
            meta: {
              title: () => t('menus.backupTasks'),
              icon: markIcon(() => import('~icons/mdi/backup-restore')),
            },
          },
          {
            name: 'BackupHistory',
            path: 'history',
            component: () => import('../views/Backup/History/index.vue'),
            meta: {
              title: () => t('menus.backupHistory'),
              icon: markIcon(() => import('~icons/mdi/history')),
            },
          },
        ],
      },
      {
        name: 'AuditLogs',
        path: 'audit-logs',
        component: () => import('../views/AuditLogs/index.vue'),
        meta: {
          title: () => t('menus.auditLogs'),
          icon: markIcon(() => import('~icons/mdi/file-document-outline')),
          groupLabel: () => t('menus.groups.system'),
        },
      },
      {
        name: 'GameEventLogs',
        path: 'game-event-logs',
        component: () => import('../views/GameEventLogs/index.vue'),
        meta: {
          title: () => t('menus.gameEventLogs'),
          icon: markIcon(() => import('~icons/mdi/book-open-variant')),
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

function getRouteLocaleParam(routeLocale: unknown): string | undefined {
  return Array.isArray(routeLocale) ? routeLocale[0] : routeLocale as string | undefined;
}

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

  const routeLocale = getRouteLocaleParam(to.params.locale);

  if (routeLocale !== undefined) {
    if (!isSupportedLocale(routeLocale)) {
      return { name: 'Dashboard', params: { locale: LOCALE_TYPE.EN } };
    }

    const localeStore = useLocaleStore();
    await localeStore.applyLocale(routeLocale);
  }

  // Check if this route requires authorization and if the user has logged in
  if (to.meta.requiresAuth !== false) {
    const userInfoStore = useUserInfoStore();
    const isLoggedIn = await userInfoStore.isLoggedIn();

    if (!isLoggedIn) {
      // If not, redirect to the login page
      return `/login?redirect=${to.fullPath}`;
    }
  }
});

router.afterEach((to) => {
  updateDocumentTitle(to.meta.title);
  nProgress.done();
});

export default router;
export { getMenuLabel, routes };
