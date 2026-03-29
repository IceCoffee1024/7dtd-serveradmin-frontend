<script setup lang="ts">
import Ban from './Ban/index.vue';
import Whitelist from './Whitelist/index.vue';

defineOptions({
  name: 'BanWhitelist',
});

const activeTab = ref('ban');
</script>

<template>
  <el-card class="h-full" shadow="never">
    <el-tabs v-model="activeTab">
      <el-tab-pane :label="$t('views.banWhitelist.ban')" name="ban">
        <Ban />
      </el-tab-pane>
      <el-tab-pane :label="$t('views.banWhitelist.whitelist')" name="whitelist">
        <Whitelist />
      </el-tab-pane>
    </el-tabs>
  </el-card>
</template>
