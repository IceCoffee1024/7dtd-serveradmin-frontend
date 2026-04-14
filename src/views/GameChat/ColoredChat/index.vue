<script setup lang="ts">
import Profiles from './Profiles/index.vue';
import Settings from './Settings/index.vue';

defineOptions({ name: 'ColoredChat' });

const activeTab = ref('settings');
</script>

<template>
  <el-card class="h-full" shadow="never">
    <el-tabs v-model="activeTab">
      <el-tab-pane :label="$t('views.coloredChat.tabs.settings')" name="settings">
        <Settings />
      </el-tab-pane>
      <el-tab-pane :label="$t('views.coloredChat.tabs.profiles')" name="profiles">
        <Profiles />
      </el-tab-pane>
    </el-tabs>
  </el-card>
</template>
