<script setup lang="ts">
import ContextMenu from '@imengyu/vue3-context-menu';
import { useI18n } from 'vue-i18n';
import { useTheme } from '~/composables';
import { useNavTabStore } from '~/stores/nav-tab';
import { markIcon } from '~/utils';

type TabStyle = App.ThemeSettings['layout']['tab']['style'];

interface Props {
  tabStyle?: TabStyle;
  showIcon?: boolean;
}

withDefaults (defineProps<Props>(), {
  tabStyle: 'google',
  showIcon: true,
});

const { t } = useI18n();
const { currentTheme, isDark } = useTheme();
const navTabStore = useNavTabStore();

function handleContextMenu(event: MouseEvent, tabName: string) {
  event.preventDefault();
  ContextMenu.showContextMenu({
    x: event.x,
    y: event.y + 20,
    theme: isDark.value ? `${currentTheme.value.general.contextMenuStyle} dark` : currentTheme.value.general.contextMenuStyle,
    items: [
      {
        icon: h(markIcon(() => import('~icons/line-md/close'))),
        label: t('layout.header.close'),
        disabled: navTabStore.tabsList.length === 1,
        onClick: () => {
          navTabStore.removeTab(tabName);
        },
      },
      {
        icon: h(markIcon(() => import('~icons/line-md/close-circle'))),
        label: t('layout.header.closeOthers'),
        disabled: navTabStore.tabsList.length === 1,
        onClick: () => {
          navTabStore.closeOtherTabs(tabName);
        },
      },
      {
        icon: h(markIcon(() => import('~icons/line-md/arrow-close-left'))),
        label: t('layout.header.closeLeft'),
        disabled: navTabStore.tabsList.length === 1 || navTabStore.tabsList[0] === tabName,
        onClick: () => {
          navTabStore.closeLeftTabs(tabName);
        },
      },
      {
        icon: h(markIcon(() => import('~icons/line-md/arrow-close-right'))),
        label: t('layout.header.closeRight'),
        disabled: navTabStore.tabsList.length === 1 || navTabStore.tabsList[navTabStore.tabsList.length - 1] === tabName,
        onClick: () => {
          navTabStore.closeRightTabs(tabName);
        },
      },
      {
        icon: h(markIcon(() => import('~icons/line-md/close-circle-filled'))),
        label: t('layout.header.closeAll'),
        disabled: navTabStore.tabsList.length === 1,
        onClick: () => {
          navTabStore.closeAllTabs();
        },
      },
    ],
  });
}
</script>

<template>
  <div class="tabs-wrapper" :class="`style-${tabStyle}`">
    <el-tabs
      v-model="navTabStore.activeTab"
      type="card"
      class="w-full"
      @tab-remove="(name) => navTabStore.removeTab(name as string)"
      @tab-click="(context) => navTabStore.activeTab = context.props.name as string"
    >
      <el-tab-pane
        v-for="item in navTabStore.getOpenedTabs()"
        :key="item.name"
        :name="item.name"
        :closable="item.closable"
      >
        <template #label>
          <span class="tab-content" @contextmenu="handleContextMenu($event, item.name)">
            <component :is="item.icon" v-if="showIcon && item.icon" class="tab-icon" />
            <span>{{ item.title }}</span>
          </span>
        </template>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<style lang="scss" scoped>
$theme-color: var(--colors-primary);

.tabs-wrapper {
  display: flex;
  align-items: center;

  .tab-content {
    display: flex;
    align-items: center;
  }

  :deep(.el-tabs__header) {
    margin: 0;
    border: none;
  }
  :deep(.el-tabs__nav) {
    border: none !important;
  }
  :deep(.el-tabs__item) {
    border: none !important;
    font-weight: normal;
    transition: all 0.2s;

    .tab-icon {
      margin-right: 4px;
      vertical-align: -2px;
      width: 14px;
    }

    &:hover {
      color: $theme-color;
    }

    &.is-active {
      background-color: var(--colors-primary-100);
      .dark & {
        background-color: var(--colors-primary-950);
      }
      color: $theme-color;
    }
  }
}

.tabs-wrapper.style-google {
  :deep(.el-tabs__item) {
    height: 34px;
    line-height: 34px;
    padding: 0 16px !important;
    margin: 0 2px;
    border-radius: 4px;
    position: relative;

    &::after {
      content: '|';
      color: var(--el-text-color-primary);
      position: absolute;
      right: -8px;
      top: 50%;
      transform: translateY(-50%);
      font-size: 12px;
      pointer-events: none;
    }

    &:last-child::after,
    &.is-active::after {
      display: none;
    }

    &.is-active {
      font-weight: bold;
    }
  }
}

.tabs-wrapper.style-button {
  :deep(.el-tabs__item) {
    height: 32px;
    line-height: 30px;
    margin-top: 1px;
    margin-right: 8px;
    border: 1px solid var(--el-border-color) !important;
    border-radius: 4px;
    padding: 0 12px !important;

    &:hover {
      border-color: rgba($theme-color, 0.5) !important;
      color: $theme-color;
    }

    &.is-active {
      border-color: $theme-color !important;
    }
  }
}

.tabs-wrapper.style-smooth {
  :deep(.el-tabs__item) {
    height: 34px;
    line-height: 34px;
    margin-right: 4px;
    padding: 0 16px !important;
    border-radius: 4px 4px 0 0;

    &.is-active {
      border-bottom: 2px solid $theme-color !important;
    }
  }
}
</style>
