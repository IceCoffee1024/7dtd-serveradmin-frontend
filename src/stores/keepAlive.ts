import { defineStore } from 'pinia';

export const useKeepAliveStore = defineStore('keep-alive', () => {
  const cachedViews = ref<string[]>([]);

  function addCachedView(viewName: string) {
    if (!viewName)
      return;
    if (!cachedViews.value.includes(viewName)) {
      cachedViews.value.push(viewName);
    }
  }

  function removeCachedView(viewName: string) {
    const index = cachedViews.value.indexOf(viewName);
    if (index > -1) {
      cachedViews.value.splice(index, 1);
    }
  }

  return { cachedViews, addCachedView, removeCachedView };
});
