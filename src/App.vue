<script setup lang="ts">
import { useGameEventConnection, useTheme } from '~/composables';
import { currentLanguage as elementLocale } from '~/plugins/elementPlus';
import { useUserInfoStore } from '~/stores/userInfo';

const { initTheme } = useTheme();
initTheme();

const gameEventConnection = useGameEventConnection();
const userInfoStore = useUserInfoStore();

watch(
  () => Boolean(userInfoStore.authData.accessToken),
  (isLoggedIn) => {
    if (isLoggedIn) {
      gameEventConnection.start();
    }
    else {
      gameEventConnection.dispose();
    }
  },
  { immediate: true },
);

onBeforeUnmount(() => {
  gameEventConnection.dispose();
});
</script>

<template>
  <el-config-provider :locale="elementLocale">
    <router-view />
  </el-config-provider>
</template>
