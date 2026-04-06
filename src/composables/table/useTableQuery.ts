import type { MaybeRef } from 'vue';
import type { MyTableColumn, MyTableFetchParams } from './types';
import { computed, ref, toValue, watchEffect } from 'vue';

/**
 * Converts table search state into a backend-friendly plain object.
 */
export function applySearchTransform<T extends Record<string, any>>(
  columns: MyTableColumn<T>[],
  searchParam: Record<string, any>,
): Record<string, any> {
  const result: Record<string, any> = { ...searchParam };

  for (const col of columns) {
    const transform = col.search?.transform;
    if (!transform || !col.prop)
      continue;

    const key = col.prop as string;
    const rawVal = result[key];
    const transformed = transform(rawVal);
    Object.assign(result, transformed);
    delete result[key];
  }

  return result;
}

/**
 * Query-layer options for table orchestration.
 */
export interface UseTableQueryOptions<T extends Record<string, any>> {
  columns: MaybeRef<MyTableColumn<T>[]>;
  defaultPageSize?: number;
}

/**
 * Owns paging, sorting, search state and produces the fetch parameter snapshot.
 */
export function useTableQuery<T extends Record<string, any>>(options: UseTableQueryOptions<T>) {
  const { columns, defaultPageSize = 20 } = options;

  const searchParam = ref<Record<string, any>>({});
  const lastTransformedSearch = ref<Record<string, any>>({});
  const currentPage = ref(1);
  const rowsPerPage = ref(defaultPageSize);
  const sortField = ref<string | undefined>(undefined);
  const sortOrder = ref<'ascending' | 'descending' | null>(null);

  const allColumns = computed<MyTableColumn<T>[]>(() =>
    (toValue(columns) ?? []).filter(col => col.isShow !== false),
  );

  const selectedColumns = ref<MyTableColumn<T>[]>([]);

  watchEffect(() => {
    selectedColumns.value = allColumns.value;
  });

  function initDefaultSearchParam() {
    const cols = toValue(columns) ?? [];
    for (const col of cols) {
      if (col.search?.defaultValue !== undefined && col.prop) {
        const key = col.prop as string;
        if (!(key in searchParam.value)) {
          searchParam.value[key] = col.search.defaultValue;
        }
      }
    }
  }

  function syncTransformedSearch() {
    lastTransformedSearch.value = applySearchTransform(toValue(columns) ?? [], searchParam.value);
  }

  initDefaultSearchParam();
  syncTransformedSearch();

  watchEffect(() => {
    initDefaultSearchParam();
    syncTransformedSearch();
  });

  function onToggleColumns(cols: MyTableColumn<T>[]) {
    selectedColumns.value = cols;
  }

  function onSearch(transformed: Record<string, any>) {
    currentPage.value = 1;
    lastTransformedSearch.value = transformed;
  }

  function onReset() {
    const cols = toValue(columns) ?? [];
    searchParam.value = {};

    for (const col of cols) {
      if (col.search?.defaultValue !== undefined && col.prop) {
        searchParam.value[col.prop as string] = col.search.defaultValue;
      }
    }

    currentPage.value = 1;
    lastTransformedSearch.value = applySearchTransform(cols, searchParam.value);
  }

  function onCurrentPageChange(pageNumber: number) {
    currentPage.value = pageNumber;
  }

  function onPageSizeChange(size: number) {
    rowsPerPage.value = size;
    currentPage.value = 1;
  }

  function onSort({ prop, order }: { prop: string | null; order: 'ascending' | 'descending' | null }) {
    sortField.value = order === null ? undefined : (prop ?? undefined);
    sortOrder.value = order;
  }

  function getFetchParams(): MyTableFetchParams {
    return {
      pageNumber: currentPage.value,
      pageSize: rowsPerPage.value,
      sortField: sortField.value,
      sortOrder: sortOrder.value,
      search: lastTransformedSearch.value,
    };
  }

  return {
    searchParam,
    lastTransformedSearch,
    currentPage,
    rowsPerPage,
    sortField,
    sortOrder,
    allColumns,
    selectedColumns,
    onToggleColumns,
    onSearch,
    onReset,
    onCurrentPageChange,
    onPageSizeChange,
    onSort,
    getFetchParams,
    syncTransformedSearch,
  };
}
