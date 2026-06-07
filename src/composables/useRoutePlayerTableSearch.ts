import type { Ref } from 'vue';
import { nextTick, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';

interface RouteTableSearchExpose {
  searchParam: Record<string, any>;
  reload: () => Promise<void> | void;
}

function getQueryString(value: unknown): string | undefined {
  const raw = Array.isArray(value) ? value[0] : value;
  if (typeof raw !== 'string') {
    return undefined;
  }

  const trimmed = raw.trim();
  return trimmed || undefined;
}

export function useRoutePlayerTableSearch(
  tableRef: Readonly<Ref<RouteTableSearchExpose | null | undefined>>,
  field = 'playerId',
) {
  const route = useRoute();

  async function applyRoutePlayerSearch() {
    const playerId = getQueryString(route.query.playerId);
    if (!playerId || !tableRef.value) {
      return;
    }

    tableRef.value.searchParam[field] = playerId;
    await nextTick();
    await tableRef.value.reload();
  }

  onMounted(applyRoutePlayerSearch);
  watch(() => route.query.playerId, () => {
    void applyRoutePlayerSearch();
  });
}
