<script setup lang="ts">
import { useTheme } from '~/composables';
import { useAppStore } from '~/stores/app';
import ColorPalette from './ColorPalette/index.vue';
import LayoutModeItem from './LayoutModeItem/index.vue';
import PresetItem from './PresetItem/index.vue';

const drawer = ref(false);
const activeTabName = ref('first');

const { getThemePresets } = useAppStore();
const { currentTheme } = useTheme();
const themePresets = getThemePresets();

const isTopMenu = computed(() => currentTheme.value.layout.mode === 'top-menu');
</script>

<template>
  <div>
    <IconButton
      :tooltip-content="$t('layout.header.themeConfiguration')"
      tooltip-placement="bottom"
      @click="drawer = true"
    >
      <icon-mdi:theme />
    </IconButton>
    <el-drawer
      v-model="drawer"
      :title="$t('layout.header.themeConfiguration')"
      direction="rtl"
      class="!w-400px"
      append-to-body
    >
      <el-tabs
        v-model="activeTabName"
        type="card"
        class="text-sm"
      >
        <el-tab-pane :label="$t('layout.header.appearance')" name="first">
          <el-divider>
            {{ $t('layout.header.themeScheme') }}
          </el-divider>
          <div class="setting-section">
            <div class="!justify-center">
              <el-button-group>
                <el-button type="primary" class="w-64px" :plain="currentTheme.appearance.mode !== 'light'" @click="currentTheme.appearance.mode = 'light'">
                  <el-icon><icon-mdi:weather-sunny /></el-icon>
                </el-button>
                <el-button type="primary" class="w-64px" :plain="currentTheme.appearance.mode !== 'dark'" @click="currentTheme.appearance.mode = 'dark'">
                  <el-icon><icon-mdi:weather-night /></el-icon>
                </el-button>
                <el-button type="primary" class="w-64px" :plain="currentTheme.appearance.mode !== 'system'" @click="currentTheme.appearance.mode = 'system'">
                  <el-icon><icon-mdi:alpha-a-circle /></el-icon>
                </el-button>
              </el-button-group>
            </div>
            <div>
              <div>
                {{ $t('layout.header.grayscale') }}
              </div>
              <el-switch v-model="currentTheme.appearance.grayscale" />
            </div>
            <div>
              <div>
                {{ $t('layout.header.colorWeakness') }}
              </div>
              <el-switch v-model="currentTheme.appearance.colorWeakness" />
            </div>
          </div>
          <el-divider>
            {{ $t('layout.header.themeColor') }}
          </el-divider>
          <div class="setting-section">
            <div>
              <div>
                {{ $t('layout.header.primaryColor') }}
              </div>
              <ColorPalette v-model:semantic-color="currentTheme.appearance.colors.primary" button-type="primary" />
            </div>
            <div>
              <div>
                {{ $t('layout.header.infoColor') }}
              </div>
              <ColorPalette v-model:semantic-color="currentTheme.appearance.colors.info" button-type="info" />
            </div>
            <div>
              <div>
                {{ $t('layout.header.successColor') }}
              </div>
              <ColorPalette v-model:semantic-color="currentTheme.appearance.colors.success" button-type="success" />
            </div>
            <div>
              <div>
                {{ $t('layout.header.warningColor') }}
              </div>
              <ColorPalette v-model:semantic-color="currentTheme.appearance.colors.warning" button-type="warning" />
            </div>
            <div>
              <div>
                {{ $t('layout.header.dangerColor') }}
              </div>
              <ColorPalette v-model:semantic-color="currentTheme.appearance.colors.danger" button-type="danger" />
            </div>
            <div>
              <div>
                {{ $t('layout.header.surfaceColor') }}
              </div>
              <ColorPalette v-model:surface-color="currentTheme.appearance.colors.surface" button-type="surface" />
            </div>
          </div>
        </el-tab-pane>
        <el-tab-pane :label="$t('layout.header.layout')" name="second">
          <el-divider>
            {{ $t('layout.header.layoutMode') }}
          </el-divider>
          <div class="grid grid-cols-2">
            <div class="flex-center flex-col">
              <LayoutModeItem :active="currentTheme.layout.mode === 'side-menu'" @click="currentTheme.layout.mode = 'side-menu'">
                <icon-custom-side-menu />
              </LayoutModeItem>
              <div class="mt-8px">
                {{ $t('layout.header.verticalMode') }}
              </div>
            </div>
            <div class="flex-center flex-col">
              <LayoutModeItem :active="currentTheme.layout.mode === 'top-menu'" @click="currentTheme.layout.mode = 'top-menu'">
                <icon-custom-top-menu />
              </LayoutModeItem>
              <div class="mt-8px">
                {{ $t('layout.header.horizontalMode') }}
              </div>
            </div>
          </div>
          <el-divider>
            {{ $t('layout.header.headerSettings') }}
          </el-divider>
          <div class="setting-section">
            <div>
              <div>
                {{ $t('layout.header.headerHeight') }}
              </div>
              <el-input-number v-model="currentTheme.layout.header.height" :min="0" />
            </div>
            <div>
              <div>
                {{ $t('layout.header.showLogo') }}
              </div>
              <el-switch v-model="currentTheme.layout.header.showLogo" />
            </div>
            <div>
              <div>
                {{ $t('layout.header.showTitle') }}
              </div>
              <el-switch v-model="currentTheme.layout.header.showTitle" />
            </div>
            <div>
              <div>
                {{ $t('layout.header.showMenuCollapseBtn') }}
              </div>
              <el-switch :model-value="currentTheme.layout.header.showMenuCollapseBtn" :disabled="isTopMenu" />
            </div>
            <div>
              <div>
                {{ $t('layout.header.showBreadcrumb') }}
              </div>
              <el-switch v-model="currentTheme.layout.header.showBreadcrumb" :disabled="isTopMenu" />
            </div>
            <div>
              <div>
                {{ $t('layout.header.showBreadcrumbIcon') }}
              </div>
              <el-switch v-model="currentTheme.layout.header.showBreadcrumbIcon" :disabled="isTopMenu" />
            </div>
            <div>
              <div>
                {{ $t('layout.header.topMenuAlignment') }}
              </div>
              <el-select v-model="currentTheme.layout.header.topMenuAlignment" class="w-150px" :disabled="!isTopMenu">
                <el-option :label="$t('layout.header.left')" value="left" />
                <el-option :label="$t('layout.header.center')" value="center" />
                <el-option :label="$t('layout.header.right')" value="right" />
              </el-select>
            </div>
            <div>
              <div>
                {{ $t('layout.header.showFullscreenBtn') }}
              </div>
              <el-switch v-model="currentTheme.layout.header.showFullscreenBtn" />
            </div>
            <div>
              <div>
                {{ $t('layout.header.showLanguageSwitchBtn') }}
              </div>
              <el-switch v-model="currentTheme.layout.header.showLanguageSwitchBtn" />
            </div>
            <div>
              <div>
                {{ $t('layout.header.showThemeConfigBtn') }}
              </div>
              <el-switch v-model="currentTheme.layout.header.showThemeConfigBtn" disabled />
            </div>
          </div>
          <el-divider>
            {{ $t('layout.header.sidebarSettings') }}
          </el-divider>
          <div class="setting-section">
            <div>
              <div>
                {{ $t('layout.header.sidebarWidth') }}
              </div>
              <el-input-number v-model="currentTheme.layout.sidebar.width" :min="0" />
            </div>
            <div>
              <div>
                {{ $t('layout.header.sidebarCollapsedWidth') }}
              </div>
              <el-input-number v-model="currentTheme.layout.sidebar.collapsedWidth" :min="0" />
            </div>
          </div>
          <el-divider>
            {{ $t('layout.header.tabSettings') }}
          </el-divider>
          <div class="setting-section">
            <div>
              <div>
                {{ $t('layout.header.showTab') }}
              </div>
              <el-switch v-model="currentTheme.layout.tab.visible" />
            </div>
            <div>
              <div>
                {{ $t('layout.header.tabHeight') }}
              </div>
              <el-input-number v-model="currentTheme.layout.tab.height" :min="0" />
            </div>
            <div>
              <div>
                {{ $t('layout.header.showTabIcon') }}
              </div>
              <el-switch v-model="currentTheme.layout.tab.showIcon" />
            </div>
            <div>
              <div>
                {{ $t('layout.header.tabStyle') }}
              </div>
              <el-select v-model="currentTheme.layout.tab.style" class="w-150px">
                <el-option :label="$t('layout.header.googleStyle')" value="google" />
                <el-option :label="$t('layout.header.buttonStyle')" value="button" />
                <el-option :label="$t('layout.header.smoothStyle')" value="smooth" />
              </el-select>
            </div>
          </div>
          <el-divider>
            {{ $t('layout.header.footerSettings') }}
          </el-divider>
          <div class="setting-section">
            <div>
              <div>
                {{ $t('layout.header.showFooter') }}
              </div>
              <el-switch v-model="currentTheme.layout.footer.visible" />
            </div>
            <div>
              <div>
                {{ $t('layout.header.footerHeight') }}
              </div>
              <el-input-number v-model="currentTheme.layout.footer.height" :min="0" />
            </div>
          </div>
        </el-tab-pane>
        <el-tab-pane :label="$t('layout.header.general')" name="third">
          <div class="setting-section">
            <div>
              <div>
                {{ $t('layout.header.showTransitionAnimation') }}
              </div>
              <el-switch v-model="currentTheme.general.showTransitionAnimation" />
            </div>
            <div>
              <div>
                {{ $t('layout.header.tableSize') }}
              </div>
              <el-select v-model="currentTheme.general.tableSize" class="w-150px">
                <el-option :label="$t('layout.header.small')" value="small" />
                <el-option :label="$t('layout.header.default')" value="default" />
                <el-option :label="$t('layout.header.large')" value="large" />
              </el-select>
            </div>
            <div>
              <div>
                {{ $t('layout.header.scrollMode') }}
              </div>
              <el-select v-model="currentTheme.general.scrollMode" class="w-150px">
                <el-option :label="$t('layout.header.outerScroll')" value="outer" />
                <el-option :label="$t('layout.header.innerScroll')" value="inner" />
              </el-select>
            </div>
            <div>
              <div>
                {{ $t('layout.header.contextMenuStyle') }}
              </div>
              <el-select v-model="currentTheme.general.contextMenuStyle" class="w-150px">
                <el-option :label="$t('layout.header.defaultStyle')" value="default" />
                <el-option :label="$t('layout.header.flatStyle')" value="flat" />
                <el-option :label="$t('layout.header.win10Style')" value="win10" />
                <el-option :label="$t('layout.header.macStyle')" value="mac" />
              </el-select>
            </div>
            <div>
              <div>
                {{ $t('layout.header.popBoxStyle') }}
              </div>
              <el-select v-model="currentTheme.general.popBoxStyle" class="w-150px">
                <el-option :label="$t('layout.header.elementPlusStyle')" value="element-plus" />
                <el-option :label="$t('layout.header.sweetAlert2Style')" value="sweetalert2" />
                <el-option :label="$t('layout.header.bootstrap5Style')" value="bootstrap-5" />
                <el-option :label="$t('layout.header.bootstrap4Style')" value="bootstrap-4" />
                <el-option :label="$t('layout.header.materialUIStyle')" value="material-ui" />
                <el-option :label="$t('layout.header.bulmaStyle')" value="bulma" />
              </el-select>
            </div>
          </div>
        </el-tab-pane>
        <el-tab-pane :label="$t('layout.header.preset')" name="fourth">
          <PresetItem
            v-for="name in Object.keys(themePresets)"
            :key="name"
            :preset-name="name"
            :colors="themePresets[name].appearance.colors"
            class="my-16px"
            @apply="currentTheme = themePresets[name]"
          />
        </el-tab-pane>
      </el-tabs>
    </el-drawer>
  </div>
</template>

<style lang="scss" scoped>
:deep(.el-tabs__nav) {
  width: 100%;
  .el-tabs__item {
    width: 25%;
  }
}
:deep(.el-tab-pane) {
  overflow: auto;
  max-height: calc(100vh - 180px);
  padding-inline: 4px;
}

.setting-section {
  --uno: flex flex-col gap-12px items-stretch;
  & > div {
    --uno: flex items-center justify-between;
  }
}

.el-divider {
  margin-top: 32px;
}
</style>
