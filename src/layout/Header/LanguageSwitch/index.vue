<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router';
import { useLocaleStore } from '~/stores/locale';

const route = useRoute();
const router = useRouter();
function changeLanguage(lang: string) {
  router.replace({
    params: {
      ...route.params,
      locale: lang,
    },
  });
}

const localeStore = useLocaleStore();

function handleCommand(command: string) {
  changeLanguage(command);
}
</script>

<template>
  <el-dropdown trigger="click" @command="handleCommand">
    <div>
      <IconButton
        :tooltip-content="$t('layout.header.switchLang')"
        tooltip-placement="left"
      >
        <icon-mdi:language />
      </IconButton>
    </div>
    <template #dropdown>
      <el-dropdown-menu>
        <el-dropdown-item
          v-for="item in localeStore.localeOptions"
          :key="item.value"
          :command="item.value"
          :disabled="localeStore.currentLocale === item.value"
        >
          {{ item.label }}
        </el-dropdown-item>
      </el-dropdown-menu>
    </template>
  </el-dropdown>
</template>
