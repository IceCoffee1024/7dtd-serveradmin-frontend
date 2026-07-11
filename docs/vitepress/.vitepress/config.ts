import { defineConfig } from 'vitepress'

const navZh = [
  { text: '开始', link: '/zh/getting-started/overview' },
  { text: '日常运维', link: '/zh/daily-operations/dashboard' },
  { text: '游戏/玩家', link: '/zh/game-and-player-management/feature-modules' },
  { text: '自动化', link: '/zh/automation-and-reliability/restart' },
  { text: '集成与访问', link: '/zh/integrations-and-access/server-configuration' },
  { text: '参考', link: '/zh/reference/console-menu-index' },
]

const navEn = [
  { text: 'Getting started', link: '/en/getting-started/overview' },
  { text: 'Daily operations', link: '/en/daily-operations/dashboard' },
  { text: 'Game/player', link: '/en/game-and-player-management/feature-modules' },
  { text: 'Automation', link: '/en/automation-and-reliability/restart' },
  { text: 'Integrations', link: '/en/integrations-and-access/server-configuration' },
  { text: 'Reference', link: '/en/reference/console-menu-index' },
]

const sidebarZh = [
  {
    text: '开始使用与生命周期',
    items: [
      { text: '概览', link: '/zh/getting-started/overview' },
      { text: '安装', link: '/zh/getting-started/installation' },
      { text: '升级', link: '/zh/getting-started/upgrade' },
      { text: '初始管理员配置', link: '/zh/getting-started/initial-administrator-configuration' },
      { text: '发布前端与后端', link: '/zh/getting-started/publishing' },
    ],
  },
  {
    text: '日常运维',
    items: [
      { text: '仪表盘', link: '/zh/daily-operations/dashboard' },
      { text: '玩家列表与资料', link: '/zh/daily-operations/players' },
      { text: 'GPS 地图', link: '/zh/daily-operations/gps-map' },
      { text: '游戏聊天', link: '/zh/daily-operations/game-chat' },
      { text: '控制台与日志', link: '/zh/daily-operations/console-and-logs' },
    ],
  },
  {
    text: '游戏与玩家管理',
    items: [
      { text: '功能模块', link: '/zh/game-and-player-management/feature-modules' },
      { text: '游戏物品', link: '/zh/game-and-player-management/game-items' },
      { text: '经济系统', link: '/zh/game-and-player-management/economy' },
      { text: '传送', link: '/zh/game-and-player-management/teleport' },
      { text: '公告与投票', link: '/zh/game-and-player-management/announcements-and-voting' },
      { text: '成就与奖励', link: '/zh/game-and-player-management/achievements-and-rewards' },
      { text: '玩家追踪', link: '/zh/game-and-player-management/player-tracking' },
    ],
  },
  {
    text: '自动化与可靠性',
    items: [
      { text: '重启', link: '/zh/automation-and-reliability/restart' },
      { text: '计划任务', link: '/zh/automation-and-reliability/scheduler' },
      { text: '事件自动化', link: '/zh/automation-and-reliability/event-automation' },
      { text: '备份与恢复', link: '/zh/automation-and-reliability/backup-and-recovery' },
    ],
  },
  {
    text: '集成与访问',
    items: [
      { text: '服务器配置', link: '/zh/integrations-and-access/server-configuration' },
      { text: '访问控制', link: '/zh/integrations-and-access/access-control' },
      { text: '模组管理', link: '/zh/integrations-and-access/mod-management' },
      { text: 'Discord 集成', link: '/zh/integrations-and-access/discord-integration' },
      { text: 'GeoIP 访问控制', link: '/zh/integrations-and-access/geoip-access-control' },
      { text: '应用设置', link: '/zh/integrations-and-access/application-settings' },
      { text: 'API 文档', link: '/zh/integrations-and-access/api-documentation' },
    ],
  },
  {
    text: '参考与故障排查',
    items: [
      { text: '控制台菜单索引', link: '/zh/reference/console-menu-index' },
      { text: '管理员相关命令', link: '/zh/reference/administrator-commands' },
      { text: '故障排查', link: '/zh/reference/troubleshooting' },
      { text: '术语', link: '/zh/reference/terminology' },
    ],
  },
]

const sidebarEn = [
  {
    text: 'Getting started and lifecycle',
    items: [
      { text: 'Overview', link: '/en/getting-started/overview' },
      { text: 'Installation', link: '/en/getting-started/installation' },
      { text: 'Upgrade', link: '/en/getting-started/upgrade' },
      { text: 'Initial administrator configuration', link: '/en/getting-started/initial-administrator-configuration' },
      { text: 'Publishing frontend and backend', link: '/en/getting-started/publishing' },
    ],
  },
  {
    text: 'Daily operations',
    items: [
      { text: 'Dashboard', link: '/en/daily-operations/dashboard' },
      { text: 'Player list and profiles', link: '/en/daily-operations/players' },
      { text: 'GPS map', link: '/en/daily-operations/gps-map' },
      { text: 'Game chat', link: '/en/daily-operations/game-chat' },
      { text: 'Console and logs', link: '/en/daily-operations/console-and-logs' },
    ],
  },
  {
    text: 'Game and player management',
    items: [
      { text: 'Feature modules', link: '/en/game-and-player-management/feature-modules' },
      { text: 'Game items', link: '/en/game-and-player-management/game-items' },
      { text: 'Economy', link: '/en/game-and-player-management/economy' },
      { text: 'Teleport', link: '/en/game-and-player-management/teleport' },
      { text: 'Announcements and voting', link: '/en/game-and-player-management/announcements-and-voting' },
      { text: 'Achievements and rewards', link: '/en/game-and-player-management/achievements-and-rewards' },
      { text: 'Player tracking', link: '/en/game-and-player-management/player-tracking' },
    ],
  },
  {
    text: 'Automation and reliability',
    items: [
      { text: 'Restart', link: '/en/automation-and-reliability/restart' },
      { text: 'Scheduler', link: '/en/automation-and-reliability/scheduler' },
      { text: 'Event automation', link: '/en/automation-and-reliability/event-automation' },
      { text: 'Backup and recovery', link: '/en/automation-and-reliability/backup-and-recovery' },
    ],
  },
  {
    text: 'Integrations and access',
    items: [
      { text: 'Server configuration', link: '/en/integrations-and-access/server-configuration' },
      { text: 'Access control', link: '/en/integrations-and-access/access-control' },
      { text: 'Mod management', link: '/en/integrations-and-access/mod-management' },
      { text: 'Discord integration', link: '/en/integrations-and-access/discord-integration' },
      { text: 'GeoIP access control', link: '/en/integrations-and-access/geoip-access-control' },
      { text: 'Application settings', link: '/en/integrations-and-access/application-settings' },
      { text: 'API documentation', link: '/en/integrations-and-access/api-documentation' },
    ],
  },
  {
    text: 'Reference and troubleshooting',
    items: [
      { text: 'Console menu index', link: '/en/reference/console-menu-index' },
      { text: 'Administrator commands', link: '/en/reference/administrator-commands' },
      { text: 'Troubleshooting', link: '/en/reference/troubleshooting' },
      { text: 'Terminology', link: '/en/reference/terminology' },
    ],
  },
]

const commonTheme = {
  search: { provider: 'local' as const },
}

export default defineConfig({
  title: '7 Days to Die ServerAdmin Manual',
  description: 'Operations manual for 7 Days to Die ServerAdmin',
  lastUpdated: true,
  themeConfig: commonTheme,
  locales: {
    zh: {
      label: '简体中文',
      lang: 'zh-CN',
      link: '/zh/',
      title: '7 Days to Die ServerAdmin 手册',
      themeConfig: {
        siteTitle: '7DTD 服主管理',
        nav: navZh,
        sidebar: sidebarZh,
        outline: { level: 'deep', label: '本页目录' },
        lastUpdated: { text: '最后更新' },
        docFooter: { prev: '上一篇', next: '下一篇' },
        sidebarMenuLabel: '文档目录',
        returnToTopLabel: '返回顶部',
        langMenuLabel: '选择语言',
      },
    },
    en: {
      label: 'English',
      lang: 'en-US',
      link: '/en/',
      title: '7 Days to Die ServerAdmin Manual',
      themeConfig: {
        siteTitle: '7DTD ServerAdmin',
        nav: navEn,
        sidebar: sidebarEn,
        outline: { level: 'deep', label: 'On this page' },
        lastUpdated: { text: 'Last updated' },
        docFooter: { prev: 'Previous page', next: 'Next page' },
        sidebarMenuLabel: 'Documentation menu',
        returnToTopLabel: 'Return to top',
        langMenuLabel: 'Select language',
      },
    },
  },
})
