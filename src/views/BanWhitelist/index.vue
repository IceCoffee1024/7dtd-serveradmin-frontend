<script setup lang="ts">
import Ban from './Ban/index.vue';
import Mute from './Mute/index.vue';
import Whitelist from './Whitelist/index.vue';

defineOptions({
  name: 'BanWhitelist',
});

const activeTab = ref('ban');
</script>

<template>
  <el-card class="ban-whitelist-shell h-full min-h-0" shadow="never">
    <el-tabs v-model="activeTab" class="ban-whitelist-shell__tabs">
      <el-tab-pane :label="$t('views.banWhitelist.ban')" name="ban">
        <Ban />
      </el-tab-pane>
      <el-tab-pane :label="$t('views.banWhitelist.whitelist')" name="whitelist">
        <Whitelist />
      </el-tab-pane>
      <el-tab-pane :label="$t('views.banWhitelist.mute')" name="mute">
        <Mute />
      </el-tab-pane>
    </el-tabs>
  </el-card>
</template>

<style scoped lang="scss">
.ban-whitelist-shell {
  border: 1px solid color-mix(in srgb, var(--el-border-color-light) 70%, white 30%);
  border-radius: 28px;
  overflow: hidden;
  background:
    radial-gradient(circle at top right, color-mix(in srgb, var(--colors-primary) 6%, transparent), transparent 34%),
    linear-gradient(180deg, color-mix(in srgb, var(--el-bg-color) 97%, white 3%), var(--el-bg-color));

  :deep(.el-card__body) {
    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: 0;
    padding: 1rem 1rem 0.85rem;
  }
}

.ban-whitelist-shell__tabs {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  height: 100%;
  min-height: 0;

  :deep(.el-tabs__header) {
    flex: 0 0 auto;
  }

  :deep(.el-tabs__content) {
    flex: 1 1 auto;
    min-height: 0;
  }

  :deep(.el-tab-pane) {
    height: 100%;
    min-height: 0;
  }
}
</style>
