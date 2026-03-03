<script setup lang="ts">
import type { MyTableColumn, MyTableFetchParams, MyTableFetchResult } from '~/composables/useMyTable';
import type { ContextMenuOption } from '~/plugins/contextMenu';
import { useI18n } from 'vue-i18n';
import { useMyTable, usePopup } from '~/composables';
import { showCustomContextMenu } from '~/plugins/contextMenu';

type TableRow = Record<string, unknown>;
type FetchDataResult = MyTableFetchResult<TableRow> | TableRow[];

/** Public props API for MyTable. */
interface Props {
  columns?: MyTableColumn[];
  fetchData: (params: MyTableFetchParams) => Promise<FetchDataResult> | FetchDataResult;
  isSelectable?: boolean;
  isShowIndex?: boolean;
  isShowAddBtn?: boolean;
  isShowEditBtn?: boolean;
  isShowDeleteBtn?: boolean;
  batchMenuItems?: ContextMenuOption<TableRow>[];
  contextMenuItems?: ContextMenuOption<TableRow>[];
  autoRefreshInterval?: number;
}

const props = withDefaults(defineProps<Props>(), {
  columns: () => [],
  isSelectable: true,
  isShowIndex: false,
  isShowAddBtn: true,
  isShowEditBtn: true,
  isShowDeleteBtn: true,
  batchMenuItems: () => [],
  autoRefreshInterval: 0,
});

const emits = defineEmits(['add', 'edit', 'delete']);

const { confirm } = usePopup();

const isShowContextMenu = computed(() => {
  return !!(props.contextMenuItems && props.contextMenuItems.length);
});

const attrs = useAttrs();

const selectedRowsModel = defineModel<TableRow[]>('selectedRows', {
  type: Array,
  default: () => [],
});
const selectionModel = defineModel<TableRow[]>('selection', {
  type: Array,
  default: () => [],
});

/**
 * Backward-compatible selection model:
 * supports both `v-model:selectedRows` and legacy `v-model:selection`.
 */
const selectedRows = computed<TableRow[]>({
  get: () => selectionModel.value?.length || attrs.selection !== undefined
    ? selectionModel.value
    : selectedRowsModel.value,
  set: (val) => {
    selectedRowsModel.value = val;
    selectionModel.value = val;
  },
});

const { t } = useI18n();

const {
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
} = useMyTable<MyTableColumn, TableRow>({
  columns: computed(() => props.columns),
  fetchData: params => props.fetchData(params),
  autoRefreshInterval: toRef(props, 'autoRefreshInterval'),
  batchMenuItems: toRef(props, 'batchMenuItems'),
  exportCSVLabel: computed(() => t('components.myTable.exportCSV')),
  onExportNoData: () => {
    ElMessage.warning(t('components.myTable.noData'));
  },
  resetSelection: () => {
    selectedRows.value = [];
  },
});

function onSelectionChange(val: TableRow[]) {
  selectedRows.value = val;
}

const currentRow = ref<TableRow | null>(null);

function onRowClick(rowData: TableRow) {
  currentRow.value = rowData;
}

function onRowContextMenu(rowData: TableRow, _column: unknown, event: MouseEvent) {
  currentRow.value = rowData;
  if (props.contextMenuItems?.length) {
    event.preventDefault();
    showCustomContextMenu(event, props.contextMenuItems, rowData);
  }
}

function onToggleContextMenu(event: MouseEvent, rowData: TableRow) {
  currentRow.value = rowData;
  if (props.contextMenuItems?.length) {
    event.preventDefault();
    showCustomContextMenu(event, props.contextMenuItems, rowData);
  }
}

async function onConfirmDelete(rowData: TableRow) {
  if (await confirm()) {
    emits('delete', rowData);
  }
}

function getColumnProps(col: MyTableColumn) {
  const { field, header, ...rest } = col;
  return {
    ...rest,
    prop: field,
    label: header,
    sortable: col.sortable ? 'custom' : rest.sortable,
  };
}

/** Resolve row key from either Element Plus `row-key` or legacy PrimeVue `dataKey`. */
const rowKey = computed(() => {
  const rawAttrs = attrs as Record<string, any>;
  return rawAttrs.rowKey || rawAttrs['row-key'] || rawAttrs.dataKey || 'id';
});

const tableAttrs = computed(() => {
  const rawAttrs = attrs as Record<string, any>;
  const { dataKey, ...rest } = rawAttrs;
  return rest;
});

/** Expose imperative API for parent components. */
defineExpose({ currentRow, reload: loadLazyData });
</script>

<template>
  <div class="size-full">
    <div class="mb-3 flex gap-3 justify-between">
      <div class="flex gap-2">
        <el-tooltip v-if="isShowAddBtn" :content="$t('components.myTable.add')" placement="top">
          <el-button circle @click="$emit('add')">
            <icon-mdi:plus />
          </el-button>
        </el-tooltip>
        <el-tooltip :content="$t('components.myTable.batch')" placement="top">
          <el-dropdown trigger="click">
            <el-button circle>
              <icon-ic:baseline-more-vert />
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item
                  v-for="item in batchMenuItems"
                  :key="item.label"
                  :divided="item.divided"
                  :disabled="typeof item.disabled === 'function' ? item.disabled() : item.disabled"
                  @click="onBatchMenuCommand(item)"
                >
                  <div class="flex items-center">
                    <el-icon size="20px">
                      <component :is="item.icon" v-if="item.icon" />
                    </el-icon>
                    <span>{{ item.label }}</span>
                  </div>
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </el-tooltip>
        <el-tooltip :content="$t('components.myTable.refresh')" placement="top">
          <el-button circle @click="loadLazyData">
            <icon-mdi:refresh />
          </el-button>
        </el-tooltip>
      </div>
      <div class="flex gap-2">
        <el-input v-model="searchQuery" :placeholder="$t('components.myTable.keywordSearch')" clearable @keyup.enter="onSearch">
          <template #prefix>
            <icon-mdi:magnify />
          </template>
        </el-input>
        <el-select
          :model-value="selectedColumns"
          value-key="field"
          multiple
          collapse-tags
          :placeholder="$t('components.myTable.view')"
          @update:model-value="onToggleColumns"
        >
          <el-option v-for="col in allColumns" :key="col.field" :label="col.header" :value="col" />
        </el-select>
      </div>
    </div>

    <el-table
      :data="tableData"
      border
      height="calc(100% - 100px)"
      :loading="loading"
      :row-key="rowKey"
      v-bind="tableAttrs"
      @selection-change="onSelectionChange"
      @sort-change="onSort"
      @row-click="onRowClick"
      @row-contextmenu="onRowContextMenu"
    >
      <template #empty>
        <div class="text-gray-500 py-4 text-center">
          {{ $t('components.myTable.noData') }}
        </div>
      </template>
      <el-table-column v-if="isSelectable" type="selection" width="48" fixed="left" />
      <el-table-column v-if="isShowIndex" label="#" width="60" fixed="left">
        <template #default="scope">
          {{ getRowIndex(scope.$index) }}
        </template>
      </el-table-column>
      <el-table-column v-for="col of selectedColumns" :key="col.field" v-bind="getColumnProps(col)">
        <template v-if="$slots[`${col.field}-body`]" #default="scope">
          <slot :name="`${col.field}-body`" v-bind="{ ...scope, data: scope.row, index: scope.$index }" />
        </template>
      </el-table-column>
      <el-table-column v-if="isShowEditBtn || isShowDeleteBtn || isShowContextMenu" fixed="right" width="160" align="center">
        <template #default="scope">
          <el-button v-if="isShowEditBtn" circle size="small" @click="$emit('edit', scope.row)">
            <icon-mdi:pencil />
          </el-button>
          <el-button v-if="isShowDeleteBtn" circle size="small" type="danger" @click="onConfirmDelete(scope.row)">
            <icon-mdi:delete />
          </el-button>
          <el-button v-if="isShowContextMenu" circle size="small" @click="onToggleContextMenu($event, scope.row)">
            <icon-ic:baseline-more-horiz />
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="mt-3 flex items-center justify-end">
      <el-pagination
        :current-page="currentPage"
        :page-size="rowsPerPage"
        :page-sizes="[5, 10, 20, 50, 100, 1000]"
        :total="totalRecords"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="onPageSizeChange"
        @current-change="onCurrentPageChange"
      />
    </div>
  </div>
</template>
