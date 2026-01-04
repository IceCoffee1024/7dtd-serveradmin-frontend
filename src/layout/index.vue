<script setup>
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

const isTopMenu = computed(() => currentTheme.value.layout.mode === 'top-menu');

const isTransparentBorder = computed(() => {
  return currentTheme.value.general.scrollMode === 'outer' && !currentTheme.value.layout.tab.visible && !isScrolled.value;
});
</script>

<template>
  <div class="flex flex-col h-full">
    <div class="header-container" :style="{ height: headerContainerHeight }" :class="{ '!border-transparent': isTransparentBorder }">
      <Header :style="{ height: headerHeight }" class="header" />
      <NavTab
        v-if="currentTheme.layout.tab.visible" class="nav-tab" :style="{
          marginLeft: isTopMenu ? 0 : sidebarWidth,
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
        marginLeft: isTopMenu ? 0 : sidebarWidth,
        marginTop: currentTheme.layout.tab.visible ? addUnit(currentTheme.layout.tab.height + currentTheme.layout.header.height) : headerHeight,
      }"
      :class="{ 'overflow-y-auto overflow-x-hidden': currentTheme.general.scrollMode === 'inner' }"
    >
      <div class="main">
        <Main />
      </div>
      <div v-if="currentTheme.layout.footer.visible" class="footer" :style="{ minHeight: addUnit(currentTheme.layout.footer.height) }">
        <Footer />
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.header-container {
  --uno: border-b border-card transition-all-300 inset-x-0 top-0 fixed z-1 backdrop-blur-md;
  .header {
    --uno: transition-all-300 px-16px;
  }
  .nav-tab {
    --uno: transition-all-300 px-16px border-t border-base;
  }
}

.sidebar {
  --uno: left-0 bottom-0 overflow-y-auto fixed shadow-card transition-all-300 bg-base z-2;
}

.content {
  --uno: flex flex-col h-full transition-all-300;

  .main {
    --uno: p-16px;
  }

  .footer {
    --uno: mt-auto;
  }
}
</style>
