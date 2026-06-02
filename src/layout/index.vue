<script setup lang="ts">
import { useWindowScroll } from '@vueuse/core';
import { addUnit } from 'element-plus/es/utils/index';
import { useTheme } from '~/composables';
import Footer from './Footer/index.vue';
import Header from './Header/index.vue';
import Main from './Main/index.vue';
import NavTab from './NavTab/index.vue';
import Sidebar from './Sidebar/index.vue';

const { y: windowScrollY } = useWindowScroll();
const isScrolled = computed(() => windowScrollY.value > 0);

const { currentTheme } = useTheme();

const FOOTER_VISUAL_MIN_HEIGHT = 96;

const sidebarWidth = computed(() => {
  if (currentTheme.value.layout.sidebar.collapsed) {
    return addUnit(currentTheme.value.layout.sidebar.collapsedWidth);
  }
  return addUnit(currentTheme.value.layout.sidebar.width);
});

const headerHeight = computed(() => {
  return addUnit(currentTheme.value.layout.header.height);
});

const headerContainerHeight = computed(() => {
  return currentTheme.value.layout.tab.visible
    ? addUnit(currentTheme.value.layout.header.height + currentTheme.value.layout.tab.height)
    : addUnit(currentTheme.value.layout.header.height);
});

const contentOffsetTop = computed(() => headerContainerHeight.value);

const footerHeight = computed(() => {
  return currentTheme.value.layout.footer.visible
    ? addUnit(Math.max(currentTheme.value.layout.footer.height, FOOTER_VISUAL_MIN_HEIGHT))
    : '0px';
});

const contentHeight = computed(() => `calc(100vh - ${contentOffsetTop.value})`);

const mainAvailableHeight = computed(() =>
  `calc(100vh - ${contentOffsetTop.value} - 32px)`,
);

const isTopMenu = computed(() => currentTheme.value.layout.mode === 'top-menu');
const isInnerScroll = computed(() => currentTheme.value.general.scrollMode === 'inner');

const isTransparentBorder = computed(() => {
  return currentTheme.value.general.scrollMode === 'outer' && !currentTheme.value.layout.tab.visible && !isScrolled.value;
});
</script>

<template>
  <div class="flex flex-col h-full">
    <div class="header-container" :style="{ height: headerContainerHeight }" :class="{ 'header-container--transparent': isTransparentBorder }">
      <Header :style="{ height: headerHeight }" class="header" />
      <NavTab
        v-if="currentTheme.layout.tab.visible" class="nav-tab" :style="{
          marginLeft: isTopMenu ? 0 : sidebarWidth,
          width: isTopMenu ? '100%' : `calc(100% - ${sidebarWidth})`,
          height: addUnit(currentTheme.layout.tab.height),
        }"
        :tab-style="currentTheme.layout.tab.style"
        :show-icon="currentTheme.layout.tab.showIcon"
      />
    </div>
    <div v-if="!isTopMenu" class="sidebar" :style="{ width: sidebarWidth, top: headerHeight }">
      <Sidebar :collapse="currentTheme.layout.sidebar.collapsed" />
    </div>
    <div
      class="content" :style="{
        'marginLeft': isTopMenu ? 0 : sidebarWidth,
        'marginTop': contentOffsetTop,
        'height': isInnerScroll ? contentHeight : undefined,
        'minHeight': contentHeight,
        '--layout-content-offset-top': contentOffsetTop,
        '--layout-footer-height': footerHeight,
        '--layout-main-padding-y': '32px',
        '--layout-main-available-height': mainAvailableHeight,
      }"
      :class="{ 'content--inner-scroll': isInnerScroll }"
    >
      <div class="main">
        <Main />
      </div>
      <div v-if="currentTheme.layout.footer.visible" class="footer" :style="{ minHeight: footerHeight }">
        <Footer />
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.header-container {
  @apply: transition-all-300 inset-x-0 top-0 fixed z-1 backdrop-blur-md;
  background:
    linear-gradient(
      180deg,
      color-mix(in srgb, var(--el-bg-color) 86%, white 14%),
      color-mix(in srgb, var(--el-bg-color) 80%, transparent)
    ),
    radial-gradient(circle at top left, color-mix(in srgb, var(--colors-primary) 8%, transparent), transparent 28%);
  border-bottom: 1px solid color-mix(in srgb, var(--el-border-color-light) 68%, white 32%);

  .header {
    @apply: transition-all-300 px-16px;
  }
  .nav-tab {
    @apply: transition-all-300 px-16px;
    box-sizing: border-box;
    overflow: hidden;
    border-top: 1px solid color-mix(in srgb, var(--el-border-color-light) 62%, white 38%);
  }
}

.header-container--transparent {
  border-bottom-color: transparent;
}

.sidebar {
  @apply: left-0 bottom-0 overflow-y-auto fixed transition-all-300 z-2;
  background: transparent;
}

.content {
  @apply: flex flex-col min-h-0 transition-all-300;

  .main {
    @apply: flex flex-col min-h-0 p-16px;
    box-sizing: border-box;
    flex: 1 0 auto;

    :deep(> .h-full),
    :deep(> .size-full) {
      height: var(--layout-main-available-height);
    }
  }

  .footer {
    @apply: mt-auto shrink-0;
  }
}

.content--inner-scroll {
  overflow-x: hidden;
  overflow-y: auto;
  overscroll-behavior-y: contain;
}
</style>
