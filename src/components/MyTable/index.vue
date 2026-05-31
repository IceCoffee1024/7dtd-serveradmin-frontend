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
type TableSize = App.ThemeSettings['general']['tableSize'];

interface Slots {
  [name: string]: ((props: any) => any) | undefined;
  'toolbar-left'?: (props: { tableSize: TableSize }) => any;
  'toolbar-right'?: (props: { tableSize: TableSize }) => any;
  'footer-left'?: (props: { tableSize: TableSize }) => any;
  'operation'?: (props: { row: T; tableSize: TableSize }) => any;
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
  autoColumnWidth: true,
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

defineSlots<Slots>();

// ─────────────────────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────────────────────
interface Props {
  /** Column definitions. The generic row type keeps prop values aligned with the table data. */
  columns?: MyTableColumn<T>[];
  /** Table density. Falls back to the global theme's general.tableSize when omitted. */
  size?: TableSize;
  /** Data loader supplied by the parent component.
   * Receives normalized MyTableFetchParams, including pagination, sorting,
   * and already-transformed search parameters.
   */
  fetchData: (params: MyTableFetchParams) => Promise<FetchDataResult> | FetchDataResult;
  /** Shows the selection column when true. */
  selectable?: boolean;
  /** Backward-compatible alias for `selectable`. */
  isSelectable?: boolean;
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

const NON_LATIN_CHAR_PATTERN = /[\u4E00-\u9FA5\uFF00-\uFFEF]/g;

const { confirm } = usePopup();
const { currentTheme } = useTheme();
const { t } = useI18n();
const attrs = useAttrs();

const resolvedTableSize = computed<TableSize>(() =>
  props.size ?? currentTheme.value.general.tableSize,
);

const resolvedSelectable = computed(() => props.isSelectable ?? props.selectable);

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

function onSelectionChange(val: unknown[]) {
  selectionModel.value = val as T[];
}

const currentRow = ref<T | null>(null);

function onRowClick(rowData: unknown) {
  currentRow.value = rowData as T;
}

const showContextMenu = computed(() => !!(props.contextMenuItems?.length));

function onRowContextMenu(rowData: unknown, _column: unknown, event: MouseEvent) {
  const resolvedRow = rowData as T;
  currentRow.value = resolvedRow;
  if (props.contextMenuItems?.length) {
    event.preventDefault();
    showCustomContextMenu(event, props.contextMenuItems, resolvedRow);
  }
}

function onToggleContextMenu(event: MouseEvent, rowData: unknown) {
  const resolvedRow = rowData as T;
  currentRow.value = resolvedRow;
  if (props.contextMenuItems?.length) {
    event.preventDefault();
    showCustomContextMenu(event, props.contextMenuItems, resolvedRow);
  }
}

async function onConfirmDelete(rowData: unknown) {
  if (await confirm()) {
    emits('delete', rowData as T);
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
  <div class="my-table-root flex flex-col size-full min-h-0">
    <el-card
      shadow="never"
      class="table-main-card flex-1 min-h-0"
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
        class="table-search-panel"
      >
        <!-- Collapsible header row, shown only when searchCollapsible is enabled. -->
        <div
          v-if="searchCollapsible"
          class="table-search-panel__header"
          :class="{ 'table-search-panel__header--expanded': !searchCollapsed }"
          @click="searchCollapsed = !searchCollapsed"
        >
          <span class="table-search-panel__title">
            <el-icon :size="14"><icon-mdi:filter-outline /></el-icon>
            {{ $t('components.myTable.filters') }}
          </span>
          <span class="table-search-panel__toggle">
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
            class="table-search-panel__body"
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
      <div class="table-toolbar">
        <div class="table-toolbar__group">
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

        <div class="table-toolbar__group table-toolbar__group--right">
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
            class="table-toolbar__column-select"
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

      <div class="table-main-region flex-1 min-h-0">
        <el-table
          v-loading="loading"
          class="table-main"
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
            v-if="resolvedSelectable"
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

      <div class="table-footer">
        <div class="table-footer__left">
          <slot name="footer-left" :table-size="resolvedTableSize" />
        </div>

        <el-pagination
          class="table-footer__pagination"
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

<style scoped lang="scss">
.my-table-root {
  min-height: 0;
}

.table-main-card :deep(.el-card__body) {
  height: 100%;
  min-height: 0;
}

.table-main-card {
  min-height: 0;
  border: 1px solid color-mix(in srgb, var(--el-border-color-light) 70%, white 30%);
  border-radius: 28px;
  overflow: hidden;
  background:
    radial-gradient(circle at top right, color-mix(in srgb, var(--colors-primary) 7%, transparent), transparent 30%),
    linear-gradient(180deg, color-mix(in srgb, var(--el-bg-color) 96%, white 4%), var(--el-bg-color));
  box-shadow:
    0 18px 44px color-mix(in srgb, var(--colors-primary) 8%, transparent),
    0 6px 18px rgba(15, 23, 42, 0.04);
}

.table-search-panel {
  margin-bottom: 0.9rem;
  overflow: hidden;
  border: 1px solid color-mix(in srgb, var(--el-border-color-light) 68%, white 32%);
  border-radius: 22px;
  background:
    linear-gradient(180deg, color-mix(in srgb, var(--el-bg-color) 98%, white 2%), var(--el-bg-color)),
    radial-gradient(circle at top right, color-mix(in srgb, var(--colors-primary) 6%, transparent), transparent 38%);
}

.table-search-panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.85rem 1rem;
  cursor: pointer;
  user-select: none;
  transition: background-color 0.2s ease;
}

.table-search-panel__header:hover {
  background: color-mix(in srgb, var(--colors-primary) 6%, transparent);
}

.table-search-panel__header--expanded {
  border-bottom: 1px solid color-mix(in srgb, var(--el-border-color-light) 62%, white 38%);
}

.table-search-panel__title {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.88rem;
  font-weight: 700;
  color: var(--el-text-color-primary);
}

.table-search-panel__toggle {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.76rem;
  color: var(--el-text-color-secondary);
}

.table-search-panel__body {
  padding: 1rem 1rem 0.9rem;
}

.table-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 0.9rem;
  flex-wrap: wrap;
}

.table-toolbar__group {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  flex-wrap: wrap;
}

.table-toolbar__group--right {
  margin-left: auto;
}

.table-toolbar__column-select {
  :deep(.el-select__wrapper) {
    border-radius: 14px;
    box-shadow: none;
  }
}

.table-main-region {
  overflow: hidden;
}

.table-main {
  :deep(.el-table__inner-wrapper::before) {
    display: none;
  }

  :deep(.el-table__header-wrapper th) {
    background: var(--el-table-header-bg-color);
    color: var(--el-text-color-primary);
    font-weight: 700;
  }

  :deep(.el-table__header-wrapper th .cell) {
    color: inherit;
  }

  :deep(.el-table__cell) {
    border-bottom-color: color-mix(in srgb, var(--el-border-color-light) 62%, white 38%);
  }

  :deep(.el-table__row td) {
    background: transparent;
    transition: background-color 0.2s ease;
  }

  :deep(.el-table__body tr:hover > td.el-table__cell) {
    background: color-mix(in srgb, var(--colors-primary) 5%, transparent);
  }

  :deep(.el-tag) {
    border-radius: 999px;
    padding-inline: 0.6rem;
    font-weight: 600;
  }
}

.table-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin-top: 0.9rem;
  flex-wrap: wrap;
}

.table-footer__left {
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
  min-width: 0;
  flex-wrap: wrap;
}

.table-footer__pagination {
  margin-left: auto;
}

@media (max-width: 960px) {
  .table-toolbar__group--right,
  .table-footer__pagination {
    margin-left: 0;
  }
}
</style>
