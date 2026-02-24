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
  <div class="flex items-center">
    <div class="flex items-center justify-start">
      <Logo :show-logo="currentTheme.layout.header.showLogo" :show-title="currentTheme.layout.header.showTitle" />
      <MenuCollapse
        v-if="currentTheme.layout.header.showMenuCollapseBtn && !isTopMenu"
        v-model:collapsed="currentTheme.layout.sidebar.collapsed" class="ms-16px"
      />
      <Breadcrumb v-if="currentTheme.layout.header.showBreadcrumb && !isTopMenu" class="ms-16px" :show-icon="currentTheme.layout.header.showBreadcrumbIcon" />
    </div>
    <div v-if="isTopMenu" class="mx-16px flex flex-1" :class="topMenuAlignmentClass">
      <MenuTree :menus="menus" mode="horizontal" :ellipsis="false" />
    </div>
    <div class="flex gap-8px justify-end" :class="{ 'flex-1': !isTopMenu }">
      <IconButton a-tag href="https://github.com/IceCoffee1024/7dtd-serveradmin-frontend">
        <icon-mdi:github />
      </IconButton>
      <IconButton
        a-tag
        :href="
          isChinese
            ? 'https://qm.qq.com/cgi-bin/qm/qr?k=p3TKGDnBAxxyVsR79pF-WYHI3BjsYiHe&jump_from=webapi&authKey=wTpnGpOGOsAaNTD4TqL4kukLQnxT+TmDFQx803v+Q2zWU0E7LYuSkBQQI+WhrqFB'
            : 'https://discord.gg/zdnmngsBK4'
        "
      >
        <icon-mdi:qqchat v-if="isChinese" />
        <icon-ic:baseline-discord v-else />
      </IconButton>
      <FullscreenToggler v-if="currentTheme.layout.header.showFullscreenBtn" />
      <LanguageSwitch v-if="currentTheme.layout.header.showLanguageSwitchBtn" />
      <AppearanceModeToggler />
      <ThemeConfig v-if="currentTheme.layout.header.showThemeConfigBtn" />
      <el-dropdown trigger="click" @command="handleCommand">
        <span>
          <IconButton>
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

<style lang="scss">
.el-button + .el-button {
  margin-left: 0;
}
.el-button.is-text {
  color: var(--el-text-color-primary);
}
</style>
