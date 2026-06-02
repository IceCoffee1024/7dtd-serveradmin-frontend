<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { useMenus, usePopup, useTheme } from '~/composables';
import { useUserInfoStore } from '~/stores/userInfo';
import MenuTree from '../MenuTree/index.vue';
import AppearanceModeToggler from './AppearanceModeToggler/index.vue';
import Breadcrumb from './Breadcrumb/index.vue';
import FullscreenToggler from './FullscreenToggler/index.vue';
import LanguageSwitch from './LanguageSwitch/index.vue';
import Logo from './Logo/index.vue';
import MenuCollapse from './MenuCollapse/index.vue';
import ThemeConfig from './ThemeConfig/index.vue';

const { currentTheme } = useTheme();
const { menus } = useMenus();

const isTopMenu = computed(() => currentTheme.value.layout.mode === 'top-menu');

const topMenuAlignmentClass = computed(() => {
  switch (currentTheme.value.layout.header.topMenuAlignment) {
    case 'center':
      return 'justify-center';
    case 'right':
      return 'justify-end';
    case 'left':
    default:
      return 'justify-start';
  }
});

const { locale } = useI18n();
const isChinese = computed(() => locale.value === 'zh-cn');

const userInfoStore = useUserInfoStore();
const { confirm } = usePopup();

async function handleCommand(command: string) {
  if (command === 'logout') {
    if (await confirm()) {
      await userInfoStore.signOut();
    }
  }
}
</script>

<template>
  <div class="header-shell">
    <div class="header-brand">
      <Logo :show-logo="currentTheme.layout.header.showLogo" :show-title="currentTheme.layout.header.showTitle" />
      <MenuCollapse
        v-if="currentTheme.layout.header.showMenuCollapseBtn && !isTopMenu"
        v-model:collapsed="currentTheme.layout.sidebar.collapsed" class="ms-12px"
      />
      <div v-if="currentTheme.layout.header.showBreadcrumb && !isTopMenu" class="header-breadcrumb">
        <Breadcrumb :show-icon="currentTheme.layout.header.showBreadcrumbIcon" />
      </div>
    </div>

    <div v-if="isTopMenu" class="header-menu" :class="topMenuAlignmentClass">
      <MenuTree
        :menus="menus"
        mode="horizontal"
        :ellipsis="false"
        :alignment="currentTheme.layout.header.topMenuAlignment"
      />
    </div>

    <div class="header-actions" :class="{ 'header-actions--stretch': !isTopMenu }">
      <div class="header-action-group">
        <IconButton

          a-tag round border
          href="https://github.com/IceCoffee1024/7dtd-serveradmin-frontend"
          :tooltip-content="$t('layout.header.github')"
        >
          <icon-mdi:github />
        </IconButton>
        <IconButton

          a-tag round border
          :href="
            isChinese
              ? 'https://qm.qq.com/cgi-bin/qm/qr?k=p3TKGDnBAxxyVsR79pF-WYHI3BjsYiHe&jump_from=webapi&authKey=wTpnGpOGOsAaNTD4TqL4kukLQnxT+TmDFQx803v+Q2zWU0E7LYuSkBQQI+WhrqFB'
              : 'https://discord.gg/zdnmngsBK4'
          "
          :tooltip-content="$t('layout.header.community')"
        >
          <icon-mdi:qqchat v-if="isChinese" />
          <icon-ic:baseline-discord v-else />
        </IconButton>
      </div>

      <div class="header-action-group">
        <FullscreenToggler v-if="currentTheme.layout.header.showFullscreenBtn" />
        <LanguageSwitch v-if="currentTheme.layout.header.showLanguageSwitchBtn" />
        <AppearanceModeToggler />
        <ThemeConfig v-if="currentTheme.layout.header.showThemeConfigBtn" />
      </div>

      <el-dropdown trigger="click" @command="handleCommand">
        <span class="header-user">
          <IconButton round border :tooltip-content="$t('layout.header.userMenu')">
            <icon-mdi:account-circle />
          </IconButton>
        </span>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="logout">
              <icon-mdi:logout />{{ $t('layout.header.logout') }}
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.header-shell {
  display: flex;
  align-items: center;
  gap: 1rem;
  width: 100%;
  min-height: 0;
  box-sizing: border-box;
}

.header-brand {
  display: flex;
  flex: 0 1 auto;
  align-items: center;
  justify-content: flex-start;
  gap: 0.25rem;
  min-width: 0;
}

.header-breadcrumb {
  display: flex;
  align-items: center;
  padding: 0.3rem 0.8rem;
  margin-left: 0.25rem;
  border-radius: 999px;
  background: color-mix(in srgb, var(--el-bg-color) 88%, white 12%);
  border: 1px solid color-mix(in srgb, var(--el-border-color-light) 68%, white 32%);
}

.header-menu {
  flex: 1 1 auto;
  display: flex;
  min-width: 0;
  margin-inline: 0.25rem;
  overflow: hidden;
}

.header-menu :deep(.menu-tree) {
  width: 100%;
  min-width: 0;
}

.header-actions {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: flex-end;
  gap: 0.75rem;
  min-width: 0;
}

.header-actions--stretch {
  margin-left: auto;
}

.header-action-group {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.25rem;
  border-radius: 999px;
  background: color-mix(in srgb, var(--el-bg-color) 84%, white 16%);
  border: 1px solid color-mix(in srgb, var(--el-border-color-light) 68%, white 32%);
  box-shadow: 0 8px 20px rgba(15, 23, 42, 0.04);
}

.header-user {
  display: inline-flex;
  align-items: center;
}

@media (max-width: 1280px) {
  .header-shell {
    gap: 0.75rem;
  }

  .header-action-group {
    gap: 0.2rem;
  }
}

@media (max-width: 960px) {
  .header-breadcrumb {
    display: none;
  }
}
</style>
