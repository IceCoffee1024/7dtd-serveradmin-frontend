import { PiniaColada, useQueryCache } from '@pinia/colada';
import { createApp, nextTick } from 'vue';
import { createPinia, setActivePinia } from 'pinia';
import { describe, expect, it, vi } from 'vitest';
import { clearQueryCache } from './pinia';

function setupQueryCache() {
  const app = createApp({});
  const pinia = createPinia();
  app.use(pinia);
  app.use(PiniaColada);
  setActivePinia(pinia);

  return useQueryCache();
}

describe('pinia plugin helpers', () => {
  it('clears all query cache entries and cancels pending requests', async () => {
    const queryCache = setupQueryCache();
    const neverResolve = vi.fn(() => new Promise<string>(() => {}));
    const inactiveEntry = queryCache.ensure({
      key: ['inactive'],
      query: async () => 'cached',
    });
    const pendingEntry = queryCache.ensure({
      key: ['pending'],
      query: neverResolve,
    });

    await queryCache.fetch(inactiveEntry);
    queryCache.fetch(pendingEntry).catch(() => {});
    await nextTick();

    expect(queryCache.getEntries()).toHaveLength(2);
    expect(pendingEntry.pending).not.toBeNull();

    clearQueryCache();

    expect(queryCache.getEntries()).toHaveLength(0);
    expect(pendingEntry.pending).toBeNull();
  });
});
