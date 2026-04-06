import type { BatchActionItem, MyTableColumn, MyTableFetchParams, MyTableFetchResult, UseMyTableOptions } from './types';
import { useTableData } from './useTableData';
import { useTableQuery } from './useTableQuery';

export type {
  BatchActionItem,
  MyTableColumn,
  MyTableFetchParams,
  MyTableFetchResult,
  UseMyTableOptions,
} from './types';

/**
 * Thin facade that composes query orchestration and data execution for MyTable.
 */
export function useMyTable<T extends Record<string, any>>(options: UseMyTableOptions<T>) {
  const {
    columns,
    fetchData,
    autoRefreshInterval,
    exportCSVLabel,
    onExportNoData,
    resetSelection,
  } = options;

  const query = useTableQuery<T>({ columns });
  const data = useTableData<T>({
    columns,
    fetchData,
    getFetchParams: query.getFetchParams,
    autoRefreshInterval,
    exportCSVLabel,
    onExportNoData,
  });

  async function onSearch(transformed: Record<string, any>) {
    query.onSearch(transformed);
    await data.loadLazyData();
  }

  async function onReset() {
    query.onReset();
    await data.loadLazyData();
  }

  async function onCurrentPageChange(pageNumber: number) {
    query.onCurrentPageChange(pageNumber);
    await data.loadLazyData();
  }

  async function onPageSizeChange(size: number) {
    query.onPageSizeChange(size);
    await data.loadLazyData();
  }

  async function onSort({ prop, order }: { prop: string | null; order: 'ascending' | 'descending' | null }) {
    query.onSort({ prop, order });
    await data.loadLazyData();
  }

  async function onBatchMenuCommand(item: BatchActionItem) {
    try {
      await item.action?.();
      resetSelection?.();
    }
    catch (error) {
      console.error('[MyTable] Batch action failed:', error);
    }
  }

  function getRowIndex(index: number): number {
    return (query.currentPage.value - 1) * query.rowsPerPage.value + index + 1;
  }

  void data.loadLazyData();

  return {
    loading: data.loading,
    tableData: data.tableData,
    totalRecords: data.totalRecords,
    currentPage: query.currentPage,
    rowsPerPage: query.rowsPerPage,
    searchParam: query.searchParam,
    allColumns: query.allColumns,
    selectedColumns: query.selectedColumns,
    onToggleColumns: query.onToggleColumns,
    loadLazyData: data.loadLazyData,
    onSearch,
    onReset,
    onCurrentPageChange,
    onPageSizeChange,
    onSort,
    getRowIndex,
    onBatchMenuCommand,
    onExportCSV: data.onExportCSV,
  };
}
