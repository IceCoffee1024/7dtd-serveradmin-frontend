<script setup lang="ts">
import ColoredChatSettings from './ColoredChatSettings/index.vue';
import ColoredProfiles from './ColoredProfiles/index.vue';
import CommonChatSettings from './CommonChatSettings/index.vue';

defineOptions({
  name: 'ChatManagement',
});

const activeTab = ref('common-settings');
</script>

<template>
  <el-card class="h-full" shadow="never">
    <el-tabs v-model="activeTab">
      <el-tab-pane :label="$t('views.chatManagement.tabs.commonSettings')" name="common-settings">
        <CommonChatSettings />
      </el-tab-pane>
      <el-tab-pane :label="$t('views.chatManagement.tabs.coloredSettings')" name="colored-settings">
        <ColoredChatSettings />
      </el-tab-pane>
      <el-tab-pane :label="$t('views.chatManagement.tabs.coloredProfiles')" name="colored-profiles">
        <ColoredProfiles />
      </el-tab-pane>
    </el-tabs>
  </el-card>
</template>