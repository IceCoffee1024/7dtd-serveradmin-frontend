<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router';
import { useUserInfoStore } from '~/stores/userInfo';

defineOptions({ name: 'LoginFromSteam' });

const route = useRoute();
const router = useRouter();
const userInfoStore = useUserInfoStore();

onMounted(() => {
  const { playerName, accessToken, expiresIn, refreshToken, redirect } = route.query;

  if (!accessToken || !refreshToken) {
    router.replace('/login');
    return;
  }

  userInfoStore.signInByToken(
    playerName?.toString() ?? '',
    accessToken.toString(),
    Number(expiresIn),
    refreshToken.toString(),
  );

  const target = redirect?.toString() ?? '/';
  const safe = (target.startsWith('/') && !target.startsWith('//')) ? target : '/';
  router.replace(safe);
});
</script>

<template>
  <div v-loading.fullscreen.lock="true" class="size-screen" />
</template>
