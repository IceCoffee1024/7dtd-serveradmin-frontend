<script setup lang="ts">
import ContextMenu from '@imengyu/vue3-context-menu';
import { useI18n } from 'vue-i18n';
import { useTheme } from '~/composables';
import { useNavTabStore } from '~/stores/navTab';
import { markIcon } from '~/utils';

type TabStyle = App.ThemeSettings['layout']['tab']['style'];

interface Props {
  tabStyle?: TabStyle;
  showIcon?: boolean;
}

withDefaults(defineProps<Props>(), {
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
        label: t('layout.tabs.close'),
        disabled: navTabStore.tabsList.length === 1,
        onClick: () => {
          navTabStore.removeTab(tabName);
        },
      },
      {
        icon: h(markIcon(() => import('~icons/line-md/close-circle'))),
        label: t('layout.tabs.closeOthers'),
        disabled: navTabStore.tabsList.length === 1,
        onClick: () => {
          navTabStore.closeOtherTabs(tabName);
        },
      },
      {
        icon: h(markIcon(() => import('~icons/line-md/arrow-close-left'))),
        label: t('layout.tabs.closeLeft'),
        disabled: navTabStore.tabsList.length === 1 || navTabStore.tabsList[0] === tabName,
        onClick: () => {
          navTabStore.closeLeftTabs(tabName);
        },
      },
      {
        icon: h(markIcon(() => import('~icons/line-md/arrow-close-right'))),
        label: t('layout.tabs.closeRight'),
        disabled: navTabStore.tabsList.length === 1 || navTabStore.tabsList.at(-1) === tabName,
        onClick: () => {
          navTabStore.closeRightTabs(tabName);
        },
      },
      {
        icon: h(markIcon(() => import('~icons/line-md/close-circle-filled'))),
        label: t('layout.tabs.closeAll'),
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
  <div class="nav-tab-shell">
    <div class="tabs-wrapper" :class="`style-${tabStyle}`">
      <el-tabs
        v-model="navTabStore.activeTab"
        type="card"
        class="layout-nav-tabs w-full"
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
  </div>
</template>

<style lang="scss" scoped>
.nav-tab-shell {
  display: flex;
  align-items: center;
  width: 100%;
  height: 100%;
  min-height: 0;
  box-sizing: border-box;
}

.tabs-wrapper {
  display: flex;
  align-items: center;
  width: 100%;
  height: 100%;
  min-height: 0;
  box-sizing: border-box;
  padding: 0.2rem 0.25rem;
  overflow: hidden;
  border-radius: 18px;
  background:
    linear-gradient(180deg, color-mix(in srgb, var(--el-bg-color) 92%, white 8%), var(--el-bg-color)),
    radial-gradient(circle at top right, color-mix(in srgb, var(--colors-primary) 8%, transparent), transparent 34%);
  border: 1px solid color-mix(in srgb, var(--el-border-color-light) 68%, white 32%);
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.04);

  .tab-content {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    max-width: 180px;
    min-width: 0;
  }

  :deep(.el-tabs__header) {
    height: 100%;
    margin: 0;
    border: none;
    width: 100%;
  }
  :deep(.el-tabs__content) {
    display: none;
  }
  :deep(.el-tabs__nav) {
    display: flex;
    align-items: center;
    height: 100%;
    border: none !important;
  }
  :deep(.el-tabs__nav-scroll) {
    height: 100%;
    padding: 0;
  }
  :deep(.el-tabs__nav-wrap) {
    height: 100%;
  }
  :deep(.el-tabs__nav-wrap)::after {
    display: none;
  }
  :deep(.el-tabs__item) {
    border: none !important;
    font-weight: 600;
    color: var(--el-text-color-secondary);
    transition:
      color 0.2s ease,
      background-color 0.2s ease,
      border-color 0.2s ease,
      box-shadow 0.2s ease;

    .tab-icon {
      width: 14px;
      flex-shrink: 0;
    }

    &:hover {
      color: var(--colors-primary);
    }

    &.is-active {
      color: var(--colors-primary);
    }
  }

  :deep(.el-tabs__new-tab) {
    display: none;
  }
}

.tabs-wrapper.style-google {
  :deep(.el-tabs__item) {
    height: 30px;
    line-height: 30px;
    padding: 0 12px !important;
    margin: 0 0.2rem;
    border-radius: 999px;
    position: relative;
    background: transparent;

    &.is-active {
      background: linear-gradient(
        90deg,
        color-mix(in srgb, var(--colors-primary) 14%, transparent),
        color-mix(in srgb, var(--el-color-info) 8%, transparent)
      );
      box-shadow: 0 8px 18px color-mix(in srgb, var(--colors-primary) 12%, transparent);
    }
  }
}

.tabs-wrapper.style-button {
  :deep(.el-tabs__item) {
    height: 30px;
    line-height: 28px;
    margin-right: 0.45rem;
    border: 1px solid color-mix(in srgb, var(--el-border-color-light) 70%, white 30%) !important;
    border-radius: 14px;
    padding: 0 12px !important;
    background: color-mix(in srgb, var(--el-bg-color) 96%, white 4%);

    &:hover {
      border-color: color-mix(in srgb, var(--colors-primary) 40%, white 60%) !important;
    }

    &.is-active {
      border-color: color-mix(in srgb, var(--colors-primary) 48%, white 52%) !important;
      background: color-mix(in srgb, var(--colors-primary) 12%, transparent);
      box-shadow: 0 8px 18px color-mix(in srgb, var(--colors-primary) 10%, transparent);
    }
  }
}

.tabs-wrapper.style-smooth {
  :deep(.el-tabs__item) {
    height: 30px;
    line-height: 30px;
    margin-right: 0.35rem;
    padding: 0 16px !important;
    border-radius: 14px 14px 999px 999px;

    &.is-active {
      background: color-mix(in srgb, var(--colors-primary) 10%, transparent);
      box-shadow: inset 0 -2px 0 var(--colors-primary);
    }
  }
}
</style>
