<script setup lang="ts">
import HistoryPlayer from './HistoryPlayer/index.vue';
import OnlinePlayer from './OnlinePlayer/index.vue';

defineOptions({ name: 'PlayerList' });

const activeTab = ref('online');
</script>

<template>
  <el-card class="h-full" shadow="never">
    <el-tabs v-model="activeTab">
      <el-tab-pane name="online" :label="$t('views.playerList.onlinePlayers')" lazy>
        <OnlinePlayer />
      </el-tab-pane>
      <el-tab-pane name="history" :label="$t('views.playerList.historyPlayers')" lazy>
        <HistoryPlayer />
      </el-tab-pane>
    </el-tabs>
  </el-card>
</template>
