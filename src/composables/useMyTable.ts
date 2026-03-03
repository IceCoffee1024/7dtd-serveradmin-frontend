import type { ContextMenuOption } from '~/plugins/contextMenu';
import { useIntervalFn } from '@vueuse/core';

/**
 * Generic column schema consumed by MyTable.
 */
export interface MyTableColumn {
  field: string;
  header?: string;
  sortable?: boolean;
  [key: string]: unknown;
}

/**
 * Parameters expected by the table data loader.
 */
export interface MyTableFetchParams {
  pageNumber: number;
  pageSize: number;
  order: string | null;
  desc: boolean;
  keyword: string;
}

/**
 * Normalized paged response for table requests.
 */
export interface MyTableFetchResult<Row extends Record<string, unknown> = Record<string, unknown>> {
  items?: Row[];
  total?: number;
}

/**
 * Options for `useMyTable`.
 */
export interface UseMyTableOptions<
  Column extends MyTableColumn,
  Row extends Record<string, unknown> = Record<string, unknown>,
> {
  columns: Readonly<Ref<Column[]>>;
  fetchData: (params: MyTableFetchParams) => Promise<MyTableFetchResult<Row> | Row[]> | MyTableFetchResult<Row> | Row[];
  autoRefreshInterval?: Readonly<Ref<number>>;
  resetSelection: () => void;
  batchMenuItems?: Readonly<Ref<ContextMenuOption<Row>[]>>;
  exportCSVLabel?: Readonly<Ref<string>>;
  onExportNoData?: () => void;
  exportFileName?: () => string;
}

/**
 * Type guard for paged payloads returned by `fetchData`.
 * @param value - Unknown response payload.
 * @returns Whether the payload matches `MyTableFetchResult`.
 */
function isFetchResult<Row extends Record<string, unknown> = Record<string, unknown>>(
  value: unknown,
): value is MyTableFetchResult<Row> {
  return typeof value === 'object' && value !== null && ('items' in value || 'total' in value);
}

/**
 * Encapsulates MyTable data flow: request, pagination and column visibility.
 * @param options - Runtime options bound from MyTable props and state.
 * @returns Reactive state and handlers consumed by the table view.
 */
export function useMyTable<
  Column extends MyTableColumn,
  Row extends Record<string, unknown> = Record<string, unknown>,
>(options: UseMyTableOptions<Column, Row>) {
  const allColumns = computed<Column[]>(() => options.columns.value || []);

  const selectedColumns = ref<Column[]>([]);
  watch(
    () => options.columns.value,
    (val) => {
      selectedColumns.value = val;
    },
    { immediate: true },
  );

  const searchQuery = ref('');
  const loading = ref(false);
  const tableData = ref<Row[]>([]);
  const totalRecords = ref(0);
  const rowsPerPage = ref(10);
  const currentPage = ref(1);
  const sortField = ref<string | null>(null);
  const sortOrder = ref<number | null>(null);

  function csvEscape(value: unknown) {
    if (value === null || value === undefined) {
      return '';
    }
    const str = String(value).replace(/"/g, '""');
    return /[",\n]/.test(str) ? `"${str}"` : str;
  }

  function exportCSV() {
    if (!tableData.value.length) {
      options.onExportNoData?.();
      return;
    }

    const exportColumns = selectedColumns.value.filter(col => col.field);
    const headers = exportColumns.map(col => csvEscape(col.header));
    const rows = tableData.value.map(row => exportColumns
      .map(col => csvEscape(row[col.field]))
      .join(','));

    const content = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([`\uFEFF${content}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = options.exportFileName?.() ?? `table-${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  const batchMenuItems = computed<ContextMenuOption<Row>[]>(() => {
    let items = [...(options.batchMenuItems?.value ?? [])] as ContextMenuOption<Row>[];
    if (options.exportCSVLabel?.value) {
      items = items.concat({
        divided: items.length > 0,
        label: options.exportCSVLabel.value,
        command: exportCSV,
      });
    }
    return items;
  });

  function onBatchMenuCommand(item: ContextMenuOption<Row>) {
    if (typeof item?.command === 'function') {
      void item.command();
    }
  }

  function onToggleColumns(val: Column[]) {
    const fields = val.map(col => col.field);
    selectedColumns.value = allColumns.value.filter(col => fields.includes(col.field));
  }

  async function loadLazyData() {
    options.resetSelection();
    loading.value = true;
    try {
      const params: MyTableFetchParams = {
        pageNumber: currentPage.value,
        pageSize: rowsPerPage.value,
        order: sortField.value,
        desc: sortOrder.value === -1,
        keyword: searchQuery.value,
      };

      const data = await Promise.resolve(options.fetchData(params));

      if (isFetchResult<Row>(data) && data.items && Array.isArray(data.items)) {
        tableData.value = data.items;
        totalRecords.value = data.total || 0;
      }
      else {
        tableData.value = Array.isArray(data) ? data : [];
        totalRecords.value = Array.isArray(data) ? data.length : 0;
      }
    }
    finally {
      loading.value = false;
    }
  }

  async function onCurrentPageChange(page: number) {
    currentPage.value = page;
    await loadLazyData();
  }

  async function onPageSizeChange(size: number) {
    rowsPerPage.value = size;
    currentPage.value = 1;
    await loadLazyData();
  }

  async function onSort(event: { prop: string | null; order: 'ascending' | 'descending' | null }) {
    sortField.value = event.prop;
    sortOrder.value = event.order === 'descending' ? -1 : event.order === 'ascending' ? 1 : null;
    currentPage.value = 1;
    await loadLazyData();
  }

  async function onSearch() {
    currentPage.value = 1;
    sortField.value = null;
    sortOrder.value = null;
    await loadLazyData();
  }

  function getRowIndex(index: number) {
    return (currentPage.value - 1) * rowsPerPage.value + index + 1;
  }

  void loadLazyData();

  const intervalSource = computed(() => {
    if (!options.autoRefreshInterval) {
      return 0;
    }
    return options.autoRefreshInterval.value * 1000;
  });
  const { pause, resume } = useIntervalFn(loadLazyData, () => intervalSource.value);
  onActivated(resume);
  onDeactivated(pause);

  return {
    allColumns,
    selectedColumns,
    searchQuery,
    loading,
    tableData,
    totalRecords,
    rowsPerPage,
    currentPage,
    onToggleColumns,
    loadLazyData,
    onCurrentPageChange,
    onPageSizeChange,
    onSort,
    onSearch,
    getRowIndex,
    batchMenuItems,
    onBatchMenuCommand,
    exportCSV,
  };
}
