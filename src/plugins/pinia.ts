import type { Store } from 'pinia';
import type { App } from 'vue';
import { PiniaColada, useQueryCache } from '@pinia/colada';
import { createPinia } from 'pinia';

const storeRegistry = new Map<string, Store>();

export function setupPinia(app: App) {
  const pinia = createPinia();
  pinia.use(({ store }) => {
    storeRegistry.set(store.$id, store);
  });
  app.use(pinia);

  app.use(PiniaColada, {
    queryOptions: {
      staleTime: 0,
      refetchOnWindowFocus: false,
    },
  });
};

export function resetAllStores() {
  storeRegistry.forEach((store) => {
    store.$reset();
  });
}

export function clearQueryCache() {
  const queryCache = useQueryCache();
  queryCache.cancelQueries();
  queryCache.getEntries().forEach((entry) => {
    queryCache.remove(entry);
  });
}

export function disposeAllStores() {
  clearQueryCache();
  storeRegistry.forEach((store) => {
    store.$dispose();
  });
  storeRegistry.clear();
}

export function getAllStores(): ReadonlyMap<string, Store> {
  return storeRegistry;
}

export function getStore(id: string): Store | undefined {
  return storeRegistry.get(id);
}
