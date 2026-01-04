<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useRoute, useRouter } from 'vue-router';
import { useTheme } from '~/composables';
import { useKeepAliveStore } from '~/stores/keep-alive';

const route = useRoute();
const router = useRouter();
const { currentTheme } = useTheme();
const keepAliveStore = useKeepAliveStore();

const { cachedViews } = storeToRefs(keepAliveStore);

watch(
  () => route.name,
  (name) => {
    if (route.meta?.keepAlive !== false && name) {
      keepAliveStore.addCachedView(name as string);
    }
  },
  { immediate: true },
);

const transitionName = ref('slide-left');
let lastPosition = 0;

router.beforeEach(() => {
  const toPosition = window.history.state?.position as number;
  if (toPosition !== undefined) {
    transitionName.value = toPosition < lastPosition ? 'slide-right' : 'slide-left';
  }
});
router.afterEach(() => {
  lastPosition = window.history.state?.position || 0;
});
</script>

<template>
  <router-view v-slot="{ Component }">
    <transition :name="currentTheme.general.showTransitionAnimation ? transitionName : undefined" mode="out-in">
      <keep-alive :include="cachedViews">
        <component :is="Component" :key="route.fullPath" />
      </keep-alive>
    </transition>
  </router-view>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-left-enter-active,
.slide-right-enter-active {
  transition: all 0.3s ease-out;
}

.slide-left-leave-active,
.slide-right-leave-active {
  transition: all 0.2s ease-in;
}

.slide-left-enter-from {
  opacity: 0;
  transform: translateX(20px);
}
.slide-left-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}
.slide-right-enter-from {
  opacity: 0;
  transform: translateX(-20px);
}
.slide-right-leave-to {
  opacity: 0;
  transform: translateX(20px);
}
</style>
