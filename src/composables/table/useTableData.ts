import type { MaybeRef } from 'vue';
import type { MyTableColumn, MyTableFetchParams, MyTableFetchResult } from './types';
import { useIntervalFn } from '@vueuse/core';
import { computed, ref, toValue, watchEffect } from 'vue';

/**
 * Data-layer options for table orchestration.
 */
export interface UseTableDataOptions<T extends Record<string, any>> {
  columns: MaybeRef<MyTableColumn<T>[]>;
  fetchData: (params: MyTableFetchParams) => Promise<MyTableFetchResult<T> | T[]>;
  getFetchParams: () => MyTableFetchParams;
  autoRefreshInterval?: MaybeRef<number>;
  exportCSVLabel?: MaybeRef<string>;
  onExportNoData?: () => void;
}

/**
 * Owns fetch execution, loading state, auto refresh and CSV export.
 */
export function useTableData<T extends Record<string, any>>(options: UseTableDataOptions<T>) {
  const {
    columns,
    fetchData,
    getFetchParams,
    autoRefreshInterval,
    exportCSVLabel,
    onExportNoData,
  } = options;

  const loading = ref(false);
  const tableData = ref<T[]>([]);
  const totalRecords = ref(0);

  async function loadLazyData() {
    loading.value = true;

    try {
      const result = await fetchData(getFetchParams());
      if (Array.isArray(result)) {
        tableData.value = result;
        totalRecords.value = result.length;
      }
      else {
        tableData.value = result.list;
        totalRecords.value = result.total;
      }
    }
    catch (fetchError) {
      console.error('[useMyTable] fetchData error:', fetchError);
    }
    finally {
      loading.value = false;
    }
  }

  const autoRefreshIntervalMs = computed(() => {
    const interval = toValue(autoRefreshInterval) ?? 0;
    return interval > 0 ? interval * 1000 : 0;
  });

  const { pause: pauseAutoRefresh, resume: resumeAutoRefresh } = useIntervalFn(
    loadLazyData,
    autoRefreshIntervalMs,
    { immediate: false },
  );

  watchEffect((onCleanup) => {
    if (autoRefreshIntervalMs.value > 0) {
      resumeAutoRefresh();
    }
    else {
      pauseAutoRefresh();
    }

    onCleanup(() => {
      pauseAutoRefresh();
    });
  });

  function onExportCSV() {
    if (!tableData.value.length) {
      onExportNoData?.();
      return;
    }

    const cols = (toValue(columns) ?? []).filter(c => c.prop && c.exportable !== false);
    const headers = cols.map(c => escapeCsvCell(c.label)).join(',');

    function escapeCsvCell(val: unknown): string {
      const str = String(val ?? '');
      if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
        // eslint-disable-next-line e18e/prefer-static-regex
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    }

    const resolvePath = (obj: unknown, path: string): unknown => path.split('.').reduce<unknown>((current, segment) => {
      if (current != null && typeof current === 'object' && segment in current)
        return (current as Record<string, unknown>)[segment];
      return undefined;
    }, obj);

    const normalizeCsvValue = (val: unknown): string => {
      if (val == null)
        return '';
      if (typeof val === 'string')
        return val;
      if (typeof val === 'number' || typeof val === 'boolean' || typeof val === 'bigint')
        return String(val);
      if (val instanceof Date)
        return val.toISOString();
      if (typeof val === 'object')
        return JSON.stringify(val);
      return String(val);
    };

    const rows = tableData.value.map(row =>
      cols.map((c) => {
        const typedRow = row as T;
        const rawVal = resolvePath(typedRow, c.prop as string);
        let exportVal = c.exportFormatter ? c.exportFormatter(rawVal, typedRow) : rawVal;

        if (!c.exportFormatter && c.enum) {
          const enums = toValue(c.enum);
          const matched = enums.find(e => e.value === rawVal);
          if (matched)
            exportVal = matched.label;
        }

        return escapeCsvCell(normalizeCsvValue(exportVal));
      }).join(','),
    );

    const csv = [headers, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    document.body.appendChild(a);
    a.href = url;
    a.download = `${toValue(exportCSVLabel) || 'export'}.csv`;
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return {
    loading,
    tableData,
    totalRecords,
    loadLazyData,
    onExportCSV,
  };
}
