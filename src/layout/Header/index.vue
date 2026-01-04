<script setup>
import { useMenus, useTheme } from '~/composables';
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
      <FullscreenToggler v-if="currentTheme.layout.header.showFullscreenBtn" />
      <LanguageSwitch v-if="currentTheme.layout.header.showLanguageSwitchBtn" />
      <AppearanceModeToggler />
      <ThemeConfig v-if="currentTheme.layout.header.showThemeConfigBtn" />
    </div>
  </div>
</template>
