<script setup lang="ts" generic="T extends Record<string, any>">
/**
 * MyTable is a generic table wrapper built on top of Element Plus.
 *
 * It is designed for server-side pagination, remote sorting, searchable
 * columns, batch actions, and row context menus.
 *
 * Highlights:
 * - Generic row type T is forwarded to slots for full type safety.
 * - Search fields are generated from column metadata and can be transformed
 *   before request submission.
 * - Enum columns render as ElTag automatically.
 * - Column visibility can be toggled from the toolbar.
 * - Built-in pagination supports remote sorting.
 * - Row context menus and batch menus are both supported.
 * - Auto refresh can be enabled with a polling interval.
 * - CSV export uses the current page data.
 *
 * Slots:
 * - `toolbar-left`: left side of the toolbar; renders the add button by default.
 * - `toolbar-right`: right side of the toolbar, placed before the column selector.
 * - `footer-left`: left side of the footer, before pagination.
 * - `[col.slot]`: custom cell rendering for a column.
 * - `operation`: custom content for the operation column.
 *
 * Exposed API:
 * - `currentRow`: the currently active row, usually used by row actions or
 *   context menus.
 * - `reload()`: reload the table with the last search state.
 * - `searchParam`: raw search parameters, readable and writable from the parent.
 * - `clearSelection()`: clears the current selection.
 *
 * @example
 * ```vue
 * <MyTable :columns="columns" :fetch-data="fetchApi" v-model:selection="selected">
 *   <template #name-cell="{ row }">
 *     <el-link>{{ row.name }}</el-link>
 *   </template>
 *   <template #operation="{ row }">
 *     <el-button size="small" @click="handleEdit(row)">Edit</el-button>
 *   </template>
 * </MyTable>
 * ```
 */

import type { ElTable } from 'element-plus';
import type {
  BatchActionItem,
  MyTableColumn,
  MyTableFetchParams,
  MyTableFetchResult,
} from '~/composables/table';
import type { ContextMenuOption } from '~/plugins/contextMenu';
import { computed, ref, toRef, toValue, useAttrs } from 'vue';
import { useI18n } from 'vue-i18n';
import { usePopup, useTheme } from '~/composables';
// Search rendering is delegated to SearchForm instead of a local component map.
// SearchForm also applies the transform step, so MyTable no longer calls it directly.
import { useMyTable } from '~/composables/table';
import { showCustomContextMenu } from '~/plugins/contextMenu';
// SearchForm replaces the old inline search-area template.
import SearchForm from './SearchForm.vue';

type FetchDataResult = MyTableFetchResult<T> | T[];

// ─────────────────────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────────────────────
type ElTableProps = InstanceType<typeof ElTable>['$props'];
interface Props extends /* @vue-ignore */ ElTableProps {
  /** Column definitions. The generic row type keeps prop values aligned with the table data. */
  columns?: MyTableColumn<T>[];
  /** Table density. Falls back to the global theme's general.tableSize when omitted. */
  size?: App.ThemeSettings['general']['tableSize'];
  /** Data loader supplied by the parent component.
   * Receives normalized MyTableFetchParams, including pagination, sorting,
   * and already-transformed search parameters.
   */
  fetchData: (params: MyTableFetchParams) => Promise<FetchDataResult> | FetchDataResult;
  /** Shows the selection column when true. */
  selectable?: boolean;
  /** Shows a continuous row index column across pages when true. */
  showIndex?: boolean;
  /** Shows the default add button on the left side of the toolbar. */
  showAddBtn?: boolean;
  /** Shows the default edit button inside the fallback operation column.
   * @deprecated Use the `operation` slot instead.
   */
  showEditBtn?: boolean;
  /** Shows the default delete button inside the fallback operation column.
   * @deprecated Use the `operation` slot instead.
   */
  showDeleteBtn?: boolean;
  /** Batch action menu items.
   * When rows are selected, the toolbar shows a More menu that opens this list.
   */
  batchMenuItems?: BatchActionItem[];
  /** Row context menu items.
   * Once configured, users can open the custom menu by right-clicking a row
   * or by clicking the trailing More button.
   */
  contextMenuItems?: ContextMenuOption<T>[];
  /** Auto refresh interval in seconds. A value greater than 0 enables polling. */
  autoRefreshInterval?: number;
  /** Shows the top search area.
   * If no columns declare a search field, SearchForm renders nothing.
   */
  showSearch?: boolean;
  /** Renders the operation column on the far right.
   * Set to false to hide the operation column entirely.
   */
  showOperationColumn?: boolean;
  /** Operation column width in pixels or any CSS width string.
   * Increase it when the `operation` slot contains many buttons.
   */
  operationColumnWidth?: number | string;
  /** Enables global auto column width calculation.
   * When enabled, columns without an explicit width get a dynamic min-width.
   */
  autoColumnWidth?: boolean;
  /** Wraps the search area in a collapsible filter panel.
   * When enabled, the panel shows a title bar and a collapse toggle.
   */
  searchCollapsible?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  columns: () => [],
  size: undefined,
  selectable: true,
  showIndex: false,
  showAddBtn: true,
  showEditBtn: true,
  showDeleteBtn: true,
  batchMenuItems: () => [],
  autoRefreshInterval: 0,
  showSearch: true,
  showOperationColumn: true,
  operationColumnWidth: 160,
  autoColumnWidth: false, // Disabled by default to preserve backward compatibility.
  searchCollapsible: false,
});

const emits = defineEmits<{
  /** Fired when the default add button is clicked. */
  add: [];
  /** Fired when the default edit button is clicked. */
  edit: [row: T];
  /** Fired after the delete confirmation succeeds. */
  delete: [row: T];
}>();

const NON_LATIN_CHAR_PATTERN = /[\u4E00-\u9FA5\uFF00-\uFFEF]/g;

const { confirm } = usePopup();
const { currentTheme } = useTheme();
const { t } = useI18n();
const attrs = useAttrs();

const resolvedTableSize = computed<App.ThemeSettings['general']['tableSize']>(() =>
  props.size ?? currentTheme.value.general.tableSize,
);

// ─────────────────────────────────────────────────────────────────────────────
// v-model:selection - selected-row binding
// ─────────────────────────────────────────────────────────────────────────────

const selectionModel = defineModel<T[]>('selection', { default: () => [] });

// ─────────────────────────────────────────────────────────────────────────────
// useMyTable - core table state and actions
// ─────────────────────────────────────────────────────────────────────────────

const {
  allColumns,
  selectedColumns,
  searchParam,
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
  // onSearch now receives the transformed payload emitted by SearchForm.
  onSearch,
  onReset,
  getRowIndex,
  onBatchMenuCommand,
  onExportCSV,
} = useMyTable<T>({
  columns: computed(() => props.columns),
  fetchData: params => Promise.resolve(props.fetchData(params)),
  autoRefreshInterval: toRef(props, 'autoRefreshInterval'),
  exportCSVLabel: computed(() => t('components.myTable.exportCSV')),
  onExportNoData: () => ElMessage.warning(t('components.myTable.noData')),
  resetSelection: () => { selectionModel.value = []; },
});

type RenderableColumn = Omit<MyTableColumn<T>, 'prop'> & { prop?: string };

const renderableSelectedColumns = computed<RenderableColumn[]>(() =>
  selectedColumns.value as RenderableColumn[],
);

// Search columns and value accessors now live inside SearchForm.

// ─────────────────────────────────────────────────────────────────────────────
// Enum helpers
// ─────────────────────────────────────────────────────────────────────────────

function getTagType(
  col: RenderableColumn,
  value: any,
): 'success' | 'info' | 'warning' | 'danger' | undefined {
  if (!col.enum)
    return 'info';
  const enums = toValue(col.enum);
  return enums.find(item => item.value === value)?.tagType ?? 'info';
}

function getEnumLabel(col: RenderableColumn, value: any): string {
  if (!col.enum)
    return String(value ?? '');
  const enums = toValue(col.enum);
  return enums.find(item => item.value === value)?.label ?? String(value ?? '');
}

// ─────────────────────────────────────────────────────────────────────────────
// Row interactions: selection, click, and context menu
// ─────────────────────────────────────────────────────────────────────────────

function onSelectionChange(val: T[]) {
  selectionModel.value = val;
}

const currentRow = ref<T | null>(null);

function onRowClick(rowData: T) {
  currentRow.value = rowData;
}

const showContextMenu = computed(() => !!(props.contextMenuItems?.length));

function onRowContextMenu(rowData: T, _column: unknown, event: MouseEvent) {
  currentRow.value = rowData;
  if (props.contextMenuItems?.length) {
    event.preventDefault();
    showCustomContextMenu(event, props.contextMenuItems, rowData);
  }
}

function onToggleContextMenu(event: MouseEvent, rowData: T) {
  currentRow.value = rowData;
  if (props.contextMenuItems?.length) {
    event.preventDefault();
    showCustomContextMenu(event, props.contextMenuItems, rowData);
  }
}

async function onConfirmDelete(rowData: T) {
  if (await confirm()) {
    emits('delete', rowData);
  }
}

function getCellValue(row: T, col: RenderableColumn): unknown {
  if (!col.prop)
    return undefined;

  return (row as Record<string, unknown>)[col.prop];
}

// ─────────────────────────────────────────────────────────────────────────────
// attrs passthrough handling
// ─────────────────────────────────────────────────────────────────────────────

const tableAttrs = computed(() => {
  const { dataKey, selection, selectedRows, ...rest } = attrs as Record<string, any>;
  return rest;
});

const rowKey = computed(() => {
  const raw = attrs as Record<string, any>;
  return raw.rowKey ?? raw['row-key'] ?? 'id';
});

function toColumnProps(col: RenderableColumn) {
  const {
    slot: _slot,
    show: _show,
    search: _search,
    enum: _enum,
    exportable: _exportable,
    // Strip custom fields to avoid Vue warnings on el-table-column.
    autoWidth: _autoWidth,
    autoWidthMax: _autoWidthMax,
    // Width is controlled in the template, so remove it from v-bind passthrough.
    width: _width,
    ...rest
  } = col;
  return {
    ...rest,
    prop: col.prop != null ? String(col.prop) : undefined,
  };
}
// Detect whether the table actually has searchable columns.
const hasSearchColumns = computed(() =>
  props.columns.some(col => col.search?.el && col.prop != null),
);

/** Returns true when the table can use the compact single-input search toolbar. */
const isCompactSearch = computed(() => {
  const searchCols = props.columns.filter(col => col.search?.el && col.prop != null);
  return searchCols.length === 1 && searchCols[0]?.search?.el === 'el-input';
});

// ─────────────────────────────────────────────────────────────────────────────
// Auto column width
// ─────────────────────────────────────────────────────────────────────────────

/** Cache for dynamic column widths, keyed by col.prop and stored as CSS lengths. */
const dynamicColumnWidths = ref<Record<string, string>>({});

/**
 * Estimates the visual width of a string.
 * Chinese and full-width characters count as two units; other characters count as one.
 */
function estimateCharWidth(str: string): number {
  // \u4e00-\u9fa5 covers basic CJK characters; \uff00-\uffef covers full-width forms.

  let scale: number; // Smaller table sizes use slightly tighter spacing.
  switch (resolvedTableSize.value) {
    case 'small':
      scale = 7;
      break;
    case 'large':
      scale = 8.3;
      break;
    default:
      scale = 8.3;
      break;
  }
  return str.replace(NON_LATIN_CHAR_PATTERN, 'aa').length * scale;
}

/**
 * Recomputes auto-width columns whenever the current page data changes.
 * A shallow watch is enough because tableData is replaced as a whole.
 */
watch([tableData, resolvedTableSize], ([newData, newSize]) => {
  const autoCols = renderableSelectedColumns.value.filter(c =>
    c.prop
    && (props.autoColumnWidth || c.autoWidth)
    && !c.width);

  // Clear cached widths when the current page becomes empty.
  if (!autoCols.length || !newData.length) {
    autoCols.forEach((c) => {
      if (c.prop)
        delete dynamicColumnWidths.value[c.prop as string];
    });
    return;
  }

  const paddingMap = {
    small: 16,
    default: 24,
    large: 32,
  };

  autoCols.forEach((col) => {
    const prop = col.prop as string;
    const maxPx = col.autoWidthMax ?? 400;
    const minPx = 80;

    // Header width: text estimate + sort icon + horizontal padding.
    let maxWidth = estimateCharWidth(col.label) + (col.sortable ? 24 : 0) + paddingMap[newSize];

    // Inspect the current page and measure the widest cell value.
    for (const row of newData) {
      // Enum columns use the displayed label; other columns use the raw value.
      const cellText = col.enum
        ? getEnumLabel(col, (row as any)[prop])
        : String((row as any)[prop] ?? '');

      // Cell padding contributes roughly 32px.
      const cellWidth = estimateCharWidth(cellText) + paddingMap[resolvedTableSize.value];
      if (cellWidth > maxWidth)
        maxWidth = cellWidth;
    }

    dynamicColumnWidths.value[prop] = `${Math.min(Math.max(maxWidth, minPx), maxPx)}px`;
  });
}, { immediate: true });

// Recalculate widths when the visible column set changes.
watch(selectedColumns, () => {
  // Reuse the same calculation path by nudging the tableData watcher.
  if (tableData.value.length) {
    // Shallow clone to retrigger the tableData watcher.
    tableData.value = [...tableData.value];
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// API exposed to the parent component
// ─────────────────────────────────────────────────────────────────────────────

// Collapsible filter panel state; unused when searchCollapsible is false.
const searchCollapsed = ref(true);

defineExpose({
  currentRow,
  reload: loadLazyData,
  searchParam,
  clearSelection: () => { selectionModel.value = []; },
});
</script>

<template>
  <div class="flex flex-col size-full">
    <el-card
      shadow="never"
      class="table-main-card flex-1 b-none!"
      :body-style="{
        padding: '16px',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }"
    >
      <!-- Search panel wrapper adds visual separation from the table below. -->
      <div
        v-if="showSearch && hasSearchColumns && !isCompactSearch"
        class="mb-3 border border-gray-200 rounded-xl bg-gray-50 overflow-hidden dark:border-gray-700 dark:bg-gray-800/50"
      >
        <!-- Collapsible header row, shown only when searchCollapsible is enabled. -->
        <div
          v-if="searchCollapsible"
          class="px-4 py-2.5 flex cursor-pointer select-none transition-colors items-center justify-between hover:bg-gray-100/80 dark:hover:bg-gray-700/30"
          :class="{ 'border-b border-gray-200 dark:border-gray-700': !searchCollapsed }"
          @click="searchCollapsed = !searchCollapsed"
        >
          <span class="text-sm text-gray-600 font-medium inline-flex gap-1.5 items-center dark:text-gray-400">
            <el-icon :size="14"><icon-mdi:filter-outline /></el-icon>
            {{ $t('components.myTable.filters') }}
          </span>
          <span class="text-xs text-gray-400 inline-flex gap-1 items-center dark:text-gray-500">
            {{ searchCollapsed ? $t('components.myTable.expand') : $t('components.myTable.collapse') }}
            <el-icon
              class="transition-transform duration-200"
              :class="{ 'rotate-180': searchCollapsed }"
            >
              <icon-mdi:chevron-up />
            </el-icon>
          </span>
        </div>

        <!-- Search form content. collapse-transition keeps hide/show animation smooth. -->
        <el-collapse-transition>
          <div
            v-show="!searchCollapsible || !searchCollapsed"
            class="px-4 pb-3 pt-3"
          >
            <SearchForm
              v-model="searchParam"
              :columns="props.columns"
              :loading="loading"
              :size="resolvedTableSize"
              @search="onSearch"
              @reset="onReset"
            />
          </div>
        </el-collapse-transition>
      </div>

      <!-- Toolbar -->
      <div class="mb-3 flex items-center justify-between">
        <div class="flex gap-2">
          <slot name="toolbar-left" :table-size="resolvedTableSize">
            <IconButton
              v-if="showAddBtn"
              :button-size="resolvedTableSize"
              circle
              border
              :tooltip-content="$t('components.myTable.add')"
              @click="$emit('add')"
            >
              <icon-mdi:plus />
            </IconButton>
          </slot>

          <el-dropdown
            v-if="batchMenuItems.length > 0 && selectionModel.length > 0"
            trigger="click"
          >
            <IconButton :button-size="resolvedTableSize" circle border :tooltip-content="$t('components.myTable.batchActions')">
              <icon-ic:baseline-more-vert />
            </IconButton>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item
                  v-for="item in batchMenuItems"
                  :key="item.label"
                  :divided="item.divided"
                  :disabled="typeof item.disabled === 'function' ? item.disabled() : item.disabled"
                  @click="onBatchMenuCommand(item)"
                >
                  <component :is="item.icon" v-if="item.icon" class="mr-1" />
                  {{ item.label }}
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>

          <IconButton
            :button-size="resolvedTableSize"
            circle
            border
            :loading="loading"
            :tooltip-content="$t('components.myTable.refresh')"
            @click="loadLazyData()"
          >
            <icon-mdi:refresh />
          </IconButton>

          <!-- Compact single-keyword search: rendered inline in the toolbar (no separate panel) -->
          <SearchForm
            v-if="isCompactSearch && showSearch && hasSearchColumns"
            v-model="searchParam"
            :columns="props.columns"
            :loading="loading"
            :size="resolvedTableSize"
            @search="onSearch"
            @reset="onReset"
          />
        </div>

        <div class="flex gap-2">
          <slot name="toolbar-right" :table-size="resolvedTableSize" />

          <IconButton
            :button-size="resolvedTableSize"
            circle
            border
            :tooltip-content="$t('components.myTable.exportCSV')"
            @click="onExportCSV"
          >
            <icon-mdi:download />
          </IconButton>

          <el-select
            :model-value="selectedColumns"
            :size="resolvedTableSize"
            value-key="prop"
            multiple
            collapse-tags
            collapse-tags-tooltip
            :placeholder="$t('components.myTable.view')"
            style="width: 200px"
            @update:model-value="onToggleColumns"
          >
            <el-option
              v-for="col in allColumns"
              :key="String(col.prop)"
              :label="col.label"
              :value="col"
            />
          </el-select>
        </div>
      </div>

      <div class="flex-1 min-h-0">
        <el-table
          v-loading="loading"
          :data="tableData"
          :size="resolvedTableSize"
          :border="true"
          height="100%"
          :row-key="rowKey"
          v-bind="tableAttrs"
          @selection-change="onSelectionChange"
          @sort-change="onSort"
          @row-click="onRowClick"
          @row-contextmenu="onRowContextMenu"
        >
          <template #empty>
            <el-empty
              :description="$t('components.myTable.noData')"
              :image-size="80"
            />
          </template>

          <el-table-column
            v-if="selectable"
            type="selection"
            width="48"
            fixed="left"
            align="center"
          />

          <el-table-column
            v-if="showIndex"
            label="#"
            width="60"
            fixed="left"
            align="center"
          >
            <template #default="scope">
              {{ getRowIndex(scope.$index) }}
            </template>
          </el-table-column>

          <template v-for="col in renderableSelectedColumns" :key="String(col.prop)">
            <el-table-column
              v-bind="toColumnProps(col)"
              :min-width="(autoColumnWidth || col.autoWidth) && !col.width && !col.minWidth ? dynamicColumnWidths[col.prop as string] : col.minWidth"
              :show-overflow-tooltip="(autoColumnWidth || col.autoWidth) || col.showOverflowTooltip"
            >
              <template #default="scope">
                <slot v-if="col.slot" :name="col.slot" v-bind="scope" />

                <el-tag
                  v-else-if="col.enum"
                  :type="getTagType(col, getCellValue(scope.row, col))"
                >
                  {{ getEnumLabel(col, getCellValue(scope.row, col)) }}
                </el-tag>

                <span v-else>
                  {{ getCellValue(scope.row, col) ?? '' }}
                </span>
              </template>
            </el-table-column>
          </template>

          <el-table-column
            v-if="showOperationColumn"
            :label="$t('components.myTable.operation')"
            fixed="right"
            :width="operationColumnWidth"
            align="center"
          >
            <template #default="scope">
              <div class="flex gap-1 items-center justify-center">
                <slot name="operation" :row="scope.row" :table-size="resolvedTableSize">
                  <IconButton
                    v-if="showEditBtn"
                    circle
                    :button-size="resolvedTableSize"
                    :tooltip-content="$t('common.edit')"
                    @click="$emit('edit', scope.row)"
                  >
                    <icon-mdi:pencil />
                  </IconButton>
                  <IconButton
                    v-if="showDeleteBtn"
                    circle
                    :button-size="resolvedTableSize"
                    type="danger"
                    :tooltip-content="$t('common.delete')"
                    @click="onConfirmDelete(scope.row)"
                  >
                    <icon-mdi:delete />
                  </IconButton>
                </slot>

                <IconButton
                  v-if="showContextMenu"
                  circle
                  :button-size="resolvedTableSize"
                  :tooltip-content="$t('components.myTable.moreActions')"
                  @click="onToggleContextMenu($event, scope.row)"
                >
                  <icon-ic:baseline-more-horiz />
                </IconButton>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <div class="mt-3 flex gap-3 items-center justify-between">
        <div class="flex gap-3 min-w-0 items-center">
          <slot name="footer-left" :table-size="resolvedTableSize" />
        </div>

        <el-pagination
          :size="resolvedTableSize"
          :current-page="currentPage"
          :page-size="rowsPerPage"
          :page-sizes="[10, 20, 50, 100, 1000]"
          :total="totalRecords"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="onPageSizeChange"
          @current-change="onCurrentPageChange"
        />
      </div>
    </el-card>
  </div>
</template>

<style scoped>
.search-area {
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.table-main-card :deep(.el-card__body) {
  height: 100%;
}
</style>
