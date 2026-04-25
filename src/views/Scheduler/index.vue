<script setup lang="ts">
import History from './History/index.vue';
import Settings from './Settings/index.vue';
import Tasks from './Tasks/index.vue';

defineOptions({ name: 'SchedulerPage' });

const activeTab = ref('tasks');
</script>

<template>
  <el-card class="h-full" shadow="never">
    <el-tabs v-model="activeTab">
      <el-tab-pane :label="$t('views.scheduler.tabs.tasks')" name="tasks">
        <Tasks />
      </el-tab-pane>
      <el-tab-pane :label="$t('views.scheduler.tabs.history')" name="history">
        <History />
      </el-tab-pane>
      <el-tab-pane :label="$t('views.scheduler.tabs.settings')" name="settings">
        <Settings />
      </el-tab-pane>
    </el-tabs>
  </el-card>
</template>
