import type { Store } from 'pinia';
import type { App } from 'vue';
import { createPinia } from 'pinia';

const storeRegistry = new Map<string, Store>();

export function setupPinia(app: App) {
  const pinia = createPinia();
  pinia.use(({ store }) => {
    storeRegistry.set(store.$id, store);
  });
  app.use(pinia);
};

export function resetAllStores() {
  storeRegistry.forEach((store) => {
    store.$reset();
  });
}

export function disposeAllStores() {
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
