<script setup lang="ts" generic="T extends Record<string, any>">
/**
 * MyTable —— 通用泛型表格组件
 *
 * 基于 Element Plus el-table 封装，提供以下开箱即用能力：
 *
 * 功能列表：
 * - 泛型 T：行数据类型从父组件透传至每一个插槽，享受完整类型提示
 * - 搜索区域：根据列配置中的 search 字段自动生成表单，支持 transform 钩子
 * - 数据字典：配置 enum 后单元格自动渲染为 ElTag，无需手动写插槽
 * - 列显示控制：右上角 Select 允许用户动态勾选/取消列
 * - 分页 / 排序：内置分页器，支持远程排序
 * - 右键菜单：配置 contextMenuItems 后右键行触发自定义菜单
 * - 批量操作：有选中行时工具栏出现批量操作下拉
 * - 自动刷新：配置 autoRefreshInterval（秒）启用定时轮询
 * - CSV 导出：通过 onExportCSV 导出当前页数据
 *
 * 插槽：
 * - `toolbar-left`：工具栏左侧区域，默认渲染新增按钮，插槽参数包含 `tableSize`
 * - `toolbar-right`：工具栏右侧区域，位于列选择器左侧，插槽参数包含 `tableSize`
 * - `footer-left`：底部左侧区域，位于分页器左侧，适合放轻量状态或辅助控制，插槽参数包含 `tableSize`
 * - `[col.slot]`：数据列自定义渲染，slot scope 包含完整的 el-table scope 对象
 * - `operation`：操作列自定义内容，slot scope 为 `{ row: T }`
 *
 * 暴露 API（defineExpose）：
 * - `currentRow`：当前高亮/右键的行数据
 * - `reload()`：手动触发刷新，复用上次搜索参数
 * - `searchParam`：原始搜索参数对象，可外部读写
 * - `clearSelection()`：清空选中行
 *
 * @example
 * ```vue
 * <MyTable :columns="columns" :fetch-data="fetchApi" v-model:selection="selected">
 *   <template #name-cell="{ row }">
 *     <el-link>{{ row.name }}</el-link>
 *   </template>
 *   <template #operation="{ row }">
 *     <el-button size="small" @click="handleEdit(row)">编辑</el-button>
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
// FIX: 移除 SEARCH_COMPONENT_MAP，渲染已委托给 MyFieldRenderer（通过 SearchForm）
// FIX: 移除 applySearchTransform，transform 在 SearchForm 内部执行，MyTable 不再直接调用
import { useMyTable } from '~/composables/table';
import { showCustomContextMenu } from '~/plugins/contextMenu';
// FIX: 新增 SearchForm 导入，替代原来内联的搜索区域模板
import SearchForm from './SearchForm.vue';

type FetchDataResult = MyTableFetchResult<T> | T[];

// ─────────────────────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────────────────────
type ElTableProps = InstanceType<typeof ElTable>['$props'];
interface Props extends /* @vue-ignore */ ElTableProps {
  /** 列配置数组，泛型 T 保证 prop 字段受行数据类型约束 */
  columns?: MyTableColumn<T>[];
  /** 表格尺寸；不传时回退到全局主题的 general.tableSize */
  size?: App.ThemeSettings['general']['tableSize'];
  /**
   * 数据获取函数，由父组件实现并传入。
   * 接收标准化的 MyTableFetchParams（含分页、排序、已转换的搜索参数），
   * 返回分页结果对象或完整数组（前端分页场景）。
   */
  fetchData: (params: MyTableFetchParams) => Promise<FetchDataResult> | FetchDataResult;
  /** 是否显示多选列，默认 true */
  selectable?: boolean;
  /** 是否显示序号列，序号跨页连续，默认 false */
  showIndex?: boolean;
  /** 是否在工具栏左侧显示默认新增按钮，默认 true */
  showAddBtn?: boolean;
  /**
   * 是否在操作列默认插槽中显示编辑按钮，默认 true。
   * @deprecated 请使用 slot="operation" 自定义操作列，下一大版本将移除此 prop。
   */
  showEditBtn?: boolean;
  /**
   * 是否在操作列默认插槽中显示删除按钮，默认 true。
   * @deprecated 请使用 slot="operation" 自定义操作列，下一大版本将移除此 prop。
   */
  showDeleteBtn?: boolean;
  /**
   * 批量操作菜单项。
   * 当表格有选中行时，工具栏左侧出现"更多"按钮，展开此菜单。
   */
  batchMenuItems?: BatchActionItem[];
  /**
   * 右键菜单项。
   * 配置后右键行数据或点击行末的 ··· 按钮均可触发自定义菜单。
   */
  contextMenuItems?: ContextMenuOption<T>[];
  /**
   * 自动刷新间隔（秒）。大于 0 时启用定时轮询，0 表示禁用，默认 0。
   */
  autoRefreshInterval?: number;
  /**
   * 是否显示顶部搜索区域。
   * 即使为 true，若所有列均未配置 search 字段，SearchForm 内部不会渲染任何内容。
   * 默认 true。
   */
  showSearch?: boolean;
  /**
   * 是否渲染操作列（最右侧固定列）。
   * 设为 false 可完全隐藏操作列，适用于只读表格场景。
   * 默认 true。
   */
  showOperationColumn?: boolean;
  /**
   * 操作列宽度（px 或 CSS 字符串）。
   * 当通过 slot="operation" 放置较多按钮时可适当增大。
   * 默认 160。
   */
  operationColumnWidth?: number | string;
  /**
   * 是否开启全局自动列宽。
   * 开启后，所有未明确指定 width 的列都会根据内容动态计算 min-width。
   * 默认 false。
   */
  autoColumnWidth?: boolean;
  /**
   * 是否将搜索区域包裹为可折叠筛选面板。
   * 开启后，面板顶部显示标题栏与折叠切换按钮；关闭时仅保留面板视觉容器。
   * 默认 false。
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
  autoColumnWidth: false, // 默认关闭，保持向后兼容
  searchCollapsible: false,
});

const emits = defineEmits<{
  /** 点击默认新增按钮时触发 */
  add: [];
  /** 点击默认编辑按钮时触发，payload 为当前行数据 */
  edit: [row: T];
  /** 用户确认删除后触发，payload 为当前行数据 */
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
// v-model:selection —— 选中行双向绑定
// ─────────────────────────────────────────────────────────────────────────────

const selectionModel = defineModel<T[]>('selection', { default: () => [] });

// ─────────────────────────────────────────────────────────────────────────────
// useMyTable —— 核心逻辑
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
  // FIX: onSearch 签名已更新为接收 transformed 参数，
  // 由 SearchForm 的 @search 事件传入已执行过 applySearchTransform 的纯净参数。
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

// FIX: 移除 searchColumns computed —— 已移入 SearchForm 内部
// FIX: 移除 getSearchValue / setSearchValue —— 已移入 SearchForm 内部

// ─────────────────────────────────────────────────────────────────────────────
// enum 工具函数
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
// 行交互 —— 选中、点击、右键
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
// attrs 透传处理
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
    // FIX: 过滤自定义字段，防止透传到 el-table-column 触发 Vue 警告
    autoWidth: _autoWidth,
    autoWidthMax: _autoWidthMax,
    // FIX: width 由模板动态决定，从 v-bind 透传中移除，避免与显式 :width 冲突
    width: _width,
    ...rest
  } = col;
  return {
    ...rest,
    prop: col.prop != null ? String(col.prop) : undefined,
  };
}
// 🌟 新增：判断是否真正存在有效的搜索列
const hasSearchColumns = computed(() =>
  props.columns.some(col => col.search?.el && col.prop != null),
);

/** True when there is exactly one search field with el='input' — renders inline in the toolbar instead of a separate filter panel. */
const isCompactSearch = computed(() => {
  const searchCols = props.columns.filter(col => col.search?.el && col.prop != null);
  return searchCols.length === 1 && searchCols[0]?.search?.el === 'input';
});

// ─────────────────────────────────────────────────────────────────────────────
// 自动列宽
// ─────────────────────────────────────────────────────────────────────────────

/** 动态列宽缓存，key 为 col.prop，value 为带单位的宽度字符串（如 "240px"） */
const dynamicColumnWidths = ref<Record<string, string>>({});

/**
 * 字符宽度估算函数。
 * 中文/全角字符计为 2 个单位，其他字符计为 1 个单位。
 * 每单位约 8px，与主流 14px 字体 + letter-spacing 的实际渲染接近。
 */
function estimateCharWidth(str: string): number {
  // \u4e00-\u9fa5：基本汉字；\uff00-\uffef：全角字符

  let scale: number; // 小号字体略微紧凑
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
 * 监听 tableData 变化，对配置了 autoWidth 的列重新估算列宽。
 * 不使用 deep watch，tableData 整体替换时浅监听即可触发，
 * 避免深度遍历大数组带来的性能开销。
 */
watch([tableData, resolvedTableSize], ([newData, newSize]) => {
  const autoCols = renderableSelectedColumns.value.filter(c =>
    c.prop
    && (props.autoColumnWidth || c.autoWidth)
    && !c.width);

  // 数据清空时重置缓存，防止旧宽度影响下次渲染
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

    // 表头宽度：文字估算 + 排序图标 + 左右 padding
    let maxWidth = estimateCharWidth(col.label) + (col.sortable ? 24 : 0) + paddingMap[newSize];

    // 遍历当前页数据，取该列最长内容的估算宽度
    for (const row of newData) {
      // enum 列取翻译后的 label，否则取字符串化的原始值
      const cellText = col.enum
        ? getEnumLabel(col, (row as any)[prop])
        : String((row as any)[prop] ?? '');

      // 单元格左右 padding 约 32px
      const cellWidth = estimateCharWidth(cellText) + paddingMap[resolvedTableSize.value];
      if (cellWidth > maxWidth)
        maxWidth = cellWidth;
    }

    dynamicColumnWidths.value[prop] = `${Math.min(Math.max(maxWidth, minPx), maxPx)}px`;
  });
}, { immediate: true });

// 用户切换展示列时，对新增的 autoWidth 列补充计算宽度
watch(selectedColumns, () => {
  // 复用同一计算逻辑，触发一次 tableData 的 watch handler
  // 直接调用已有的估算逻辑，避免代码重复
  if (tableData.value.length) {
    // 手动触发：通过浅赋值让 watch(tableData) 重新执行
    tableData.value = [...tableData.value];
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 暴露给父组件的 API
// ─────────────────────────────────────────────────────────────────────────────

// 筛选面板折叠状态；searchCollapsible=false 时此状态无实际效果。
// 多字段筛选默认收起，保留首屏空间给数据表本身。
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
      <!--
        筛选面板：通过背景色 + 边框与下方表格拉开视觉层次。
        searchCollapsible=true 时顶部出现可点击的标题行，支持展开/收起动画。
      -->
      <div
        v-if="showSearch && hasSearchColumns && !isCompactSearch"
        class="mb-3 border border-gray-200 rounded-xl bg-gray-50 overflow-hidden dark:border-gray-700 dark:bg-gray-800/50"
      >
        <!-- 可折叠标题行（仅 searchCollapsible=true 时显示） -->
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

        <!-- 搜索表单内容；collapsed 时通过 collapse-transition 平滑隐藏 -->
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

      <!-- 工具栏 -->
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
