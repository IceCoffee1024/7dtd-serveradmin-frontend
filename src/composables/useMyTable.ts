import type {
  DatePickerProps,
  InputProps,
  SelectProps,
  SwitchProps,
  TableColumnCtx,
} from 'element-plus';
import type { MaybeRef, Ref } from 'vue';
// FormElType、OptionItem、FORM_COMPONENT_MAP 已内聚到渲染引擎
import type { FormElType, OptionItem } from '~/composables/useMyForm';

import { useIntervalFn } from '@vueuse/core';
import {
  computed,
  reactive,
  ref,
  toValue,
  watchEffect,
} from 'vue';

// ─────────────────────────────────────────────────────────────────────────────
// 搜索组件类型 → Props 映射
// ─────────────────────────────────────────────────────────────────────────────

/**
 * 每种搜索组件所接受的 props 类型映射。
 * 与 SearchElType 配合使用，实现根据 el 字段精确推导 props 类型。
 *
 * FIX: select 的 options 类型从 EnumProps[] 改为 OptionItem[]，
 * 与 MyFieldRenderer 的 OptionItem 保持统一，消除类型冗余。
 */
interface SearchElPropsMap {
  /** 单行文本输入框 */
  'input': Partial<InputProps>;
  /** 下拉选择器，额外支持 options 快捷配置 */
  'select': Partial<SelectProps> & { options?: OptionItem[] };
  /** 日期 / 日期范围选择器 */
  'date-picker': Partial<DatePickerProps>;
  /** 开关 */
  'switch': Partial<SwitchProps>;
}

/**
 * 搜索组件类型枚举。
 *
 * FIX: 不再本地独立定义，改为从 FormElType 中 Extract 子集。
 * 新增组件类型时只需改 MyFieldRenderer.vue，SearchElType 自动生效。
 */
export type SearchElType = Extract<
  FormElType,
  'input' | 'select' | 'date-picker' | 'switch'
>;

// ─────────────────────────────────────────────────────────────────────────────
// SearchProps
// ─────────────────────────────────────────────────────────────────────────────

/**
 * 搜索项配置。
 *
 * 挂载到 MyTableColumn.search 上，即可在表格顶部自动生成对应的搜索表单项。
 *
 * @template El - 搜索组件类型，决定 props 字段的精确类型
 *
 * @example 普通文本搜索
 * ```ts
 * search: { el: 'input', defaultValue: '' }
 * ```
 *
 * @example 日期范围搜索（配合 transform 拆分字段）
 * ```ts
 * search: {
 *   el: 'date-picker',
 *   props: { type: 'daterange', valueFormat: 'YYYY-MM-DD' },
 *   transform: (val: [string, string] | null) => ({
 *     startTime: val?.[0] ?? undefined,
 *     endTime:   val?.[1] ?? undefined,
 *   }),
 * }
 * ```
 */
export interface SearchProps<El extends SearchElType = SearchElType> {
  /** 渲染的搜索组件类型，对应 Element Plus 组件 */
  el: El;
  /**
   * 透传给具体 Element Plus 组件的属性。
   * 类型由 el 字段精确推导，IDE 可提供完整提示。
   */
  props?: SearchElPropsMap[El];
  /**
   * 该搜索项的初始默认值。
   * 组件挂载时自动填入 searchParam，onReset 时也会恢复为此值。
   */
  defaultValue?: any;
  /**
   * 搜索项在表单中的排列顺序，数值越小越靠前。
   * 不填时按列配置数组的原始顺序排列。
   */
  order?: number;
  /**
   * 该搜索项占用的栅格列数（1-24，对应 el-col 的 span）。
   * 不填时默认为 6（一行四列布局）。
   */
  span?: number;
  /**
   * 搜索值提交前的转换钩子。
   *
   * 在 onSearch / onReset 真正发起请求之前，对该字段的原始值执行一次转换，
   * 返回值是一个对象，会被展开合并到最终的 search 参数中，
   * 同时原始字段 key 会被删除，不会透传给后端。
   *
   * @param val - searchParam 中该列 prop 对应的当前原始值
   * @returns 任意键值对对象，将展开合并到最终 search 参数中
   */
  transform?: (val: any) => Record<string, any>;
}

// ─────────────────────────────────────────────────────────────────────────────
// EnumProps
// ─────────────────────────────────────────────────────────────────────────────

/**
 * 数据字典 / 枚举项配置。
 *
 * 挂载到 MyTableColumn.enum 上后，单元格会自动渲染为 ElTag。
 *
 * 与 OptionItem 的区别：
 * EnumProps 专用于表格单元格渲染，额外携带 tagType 控制 ElTag 颜色。
 * OptionItem 专用于表单控件的下拉选项，无样式信息。
 * 两者在 MySearchForm 的适配器层做显式转换，不混用。
 *
 * @example
 * ```ts
 * enum: [
 *   { label: '启用', value: 1, tagType: 'success' },
 *   { label: '禁用', value: 0, tagType: 'danger'  },
 * ]
 * ```
 */
export interface EnumProps {
  /** Tag 显示文字 */
  label: string;
  /** 后端返回的原始值，用于匹配 */
  value: any;
  /** ElTag 的 type 属性，控制颜色样式 */
  tagType?: 'success' | 'info' | 'warning' | 'danger';
}

// ─────────────────────────────────────────────────────────────────────────────
// BatchActionItem
// ─────────────────────────────────────────────────────────────────────────────

/**
 * MyTable 批量操作菜单项。
 *
 * 与右键菜单不同，批量菜单不接收当前行数据，
 * 点击后统一执行 action，并在组件内部自动清空选中态。
 */
export interface BatchActionItem {
  /** 菜单项显示文字 */
  label?: string;
  /** 菜单项图标组件 */
  icon?: Component;
  /** 是否禁用；批量菜单不会向函数传入行数据 */
  disabled?: boolean | (() => boolean);
  /** 是否在当前项前显示分隔线 */
  divided?: boolean;
  /** 点击菜单项后执行的操作 */
  action?: () => void | Promise<void>;
}

// ─────────────────────────────────────────────────────────────────────────────
// MyTableColumn
// ─────────────────────────────────────────────────────────────────────────────

/**
 * MyTable 的列配置类型。
 *
 * 继承自 Element Plus 的 TableColumnCtx，在此基础上扩展了以下能力：
 * - `search`：在顶部搜索栏自动生成对应表单项
 * - `enum`：单元格自动渲染为 ElTag 并翻译字典值
 * - `slot`：指定自定义渲染插槽名
 * - `exportable`：控制导出 CSV 时是否包含该列
 *
 * @template T - 行数据类型，prop 字段会受到 `keyof T` 的约束提示
 */
export interface MyTableColumn<T extends Record<string, any> = Record<string, any>>
  extends Partial<Omit<TableColumnCtx<T>, 'prop' | 'label'>> {
  /**
   * 对应行数据的字段名。
   * `keyof T` 提供精确的代码提示，`| string` 保持兼容灵活性。
   */
  prop?: keyof T | string;
  /** 列标题文字 */
  label: string;
  /**
   * 自定义单元格渲染的具名插槽名。
   * 优先级高于 enum 自动渲染，低于无 slot/enum 时的纯文本回退。
   */
  slot?: string;
  /**
   * 是否在表格中显示该列。
   * 设为 false 时列不渲染，但 search 配置仍然有效，可用于"仅搜索不展示"的字段。
   * 默认为 true。
   */
  isShow?: boolean;
  /**
   * 搜索项配置。配置后，该列会在表格顶部的搜索区域自动生成对应的表单控件。
   * 详见 SearchProps。
   */
  search?: SearchProps;
  /**
   * 数据字典配置。配置后，单元格自动渲染为 ElTag。
   * 使用 MaybeRef 同时支持静态数组和响应式 Ref，
   * 内部通过 toValue() 统一解包，调用方无需关心是否需要 .value。
   */
  enum?: MaybeRef<EnumProps[]>;
  /**
   * 是否允许将该列包含在 CSV 导出中。
   * 默认为 true；设为 false 可排除敏感列或纯操作列。
   */
  exportable?: boolean;
  /**
   * 是否根据内容自动估算列宽。
   * 遍历当前页数据取最长字符串，结合表头长度综合计算，
   * 最小 80px，最大 400px（可通过 autoWidthMax 覆盖）。
   * 自动开启 show-overflow-tooltip，超出宽度时悬浮展示完整内容。
   */
  autoWidth?: boolean;
  /**
   * autoWidth 模式下的最大列宽（px），默认 400。
   * 对于已知内容较长的列（如备注、描述）可适当调大。
   */
  autoWidthMax?: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// fetchData 入参 / 出参
// ─────────────────────────────────────────────────────────────────────────────

/**
 * fetchData 的请求参数，由 useMyTable 内部构造后传入父组件提供的 fetchData 函数。
 * search 字段已经过 applySearchTransform 处理，可直接透传给后端。
 */
export interface MyTableFetchParams {
  /** 当前页码，从 1 开始 */
  pageNumber: number;
  /** 每页条数 */
  pageSize: number;
  /** 排序字段名，对应列的 prop */
  sortField?: string;
  /** 排序方向；null 表示取消排序 */
  sortOrder?: 'ascending' | 'descending' | null;
  /**
   * 多条件搜索参数对象。
   * 已经过 applySearchTransform 转换（如日期范围拆分），可直接传给后端。
   */
  search?: Record<string, any>;
  /** 兼容旧版单关键字搜索，新项目建议统一使用 search 对象 */
  searchQuery?: string;
}

/**
 * fetchData 的返回结构。
 * 也支持直接返回 T[]，此时 total 自动取数组长度（适用于前端分页场景）。
 */
export interface MyTableFetchResult<T> {
  /** 当前页的数据列表 */
  list: T[];
  /** 总记录数，用于分页器计算总页数 */
  total: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// applySearchTransform
// ─────────────────────────────────────────────────────────────────────────────

/**
 * 在搜索发起请求前，对 searchParam 执行一次字段转换。
 *
 * 遍历所有列配置，找到配置了 `search.transform` 钩子的列，
 * 对其原始值执行转换函数，将返回的键值对展开合并到结果对象中，
 * 并删除原始字段 key（例如 dateRange 不应出现在最终请求参数中）。
 *
 * 不修改原始 searchParam，返回一份全新的纯对象，确保响应式数据的纯净性。
 *
 * 调用时机：
 * - MySearchForm 的 onSearch 中（点击搜索按钮）
 * - useMyTable 的 onReset 中（重置后初次加载）
 * - useMyTable 的初始加载中（处理 defaultValue 中的复杂值）
 *
 * @param columns     - 当前生效的列配置数组
 * @param searchParam - 原始搜索参数（reactive 对象）
 * @returns 转换后的纯净 search 对象，可直接传给 fetchData
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

// ─────────────────────────────────────────────────────────────────────────────
// useMyTable Options
// ─────────────────────────────────────────────────────────────────────────────

export interface UseMyTableOptions<T extends Record<string, any>> {
  /** 列配置数组，支持传入 Ref 或 ComputedRef 以响应动态变化 */
  columns: MaybeRef<MyTableColumn<T>[]>;
  /** 数据获取函数，由父组件提供，返回分页数据或完整数组 */
  fetchData: (params: MyTableFetchParams) => Promise<MyTableFetchResult<T> | T[]>;
  /**
   * 自动刷新间隔（秒）。
   * 大于 0 时启用定时轮询，组件卸载时自动清除定时器。
   * 默认为 0（不启用）。
   */
  autoRefreshInterval?: MaybeRef<number>;
  /** CSV 导出文件名（不含扩展名） */
  exportCSVLabel?: MaybeRef<string>;
  /** 当导出时表格无数据时的回调，通常用于弹出提示 */
  onExportNoData?: () => void;
  /**
   * 清空选中行的回调，由 MyTable.vue 传入以操作 selectionModel。
   * 在批量操作执行后自动调用，避免操作完成后仍保留上一次的选中态。
   */
  resetSelection?: () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// useMyTable
// ─────────────────────────────────────────────────────────────────────────────

export function useMyTable<T extends Record<string, any>>(options: UseMyTableOptions<T>) {
  const {
    columns,
    fetchData,
    autoRefreshInterval,
    exportCSVLabel,
    onExportNoData,
    resetSelection,
  } = options;

  // ── 状态 ──────────────────────────────────────────────────────────────────

  const loading = ref(false);
  const tableData = ref<T[]>([]) as Ref<T[]>;
  const totalRecords = ref(0);
  const currentPage = ref(1);
  const rowsPerPage = ref(20);
  const sortField = ref<string | undefined>(undefined);
  const sortOrder = ref<'ascending' | 'descending' | null>(null);
  const searchParam = ref<Record<string, any>>({});
  const lastTransformedSearch = ref<Record<string, any>>({});

  // ── 列管理 ────────────────────────────────────────────────────────────────

  const allColumns = computed<MyTableColumn<T>[]>(() =>
    (toValue(columns) ?? []).filter(col => col.isShow !== false),
  );

  const selectedColumns = ref<MyTableColumn<T>[]>([]) as Ref<MyTableColumn<T>[]>;

  watchEffect(() => {
    selectedColumns.value = allColumns.value;
  });

  function onToggleColumns(cols: MyTableColumn<T>[]) {
    selectedColumns.value = cols;
  }

  // ── 初始化搜索默认值 ──────────────────────────────────────────────────────
  // 🌟 新增：提取出同步赋默认值的逻辑
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

  // 依然保留 watchEffect，用来应对后续 columns 异步获取/动态变更的场景
  watchEffect(() => {
    initDefaultSearchParam();
  });

  // ── 核心加载函数 ──────────────────────────────────────────────────────────
  // 🌟 修改：在首屏请求前，强制同步调用一次，彻底杜绝竞态条件空参数 Bug
  initDefaultSearchParam();
  async function loadLazyData(overrideSearch?: Record<string, any>) {
    loading.value = true;

    if (overrideSearch !== undefined) {
      lastTransformedSearch.value = overrideSearch;
    }

    const params: MyTableFetchParams = {
      pageNumber: currentPage.value,
      pageSize: rowsPerPage.value,
      sortField: sortField.value,
      sortOrder: sortOrder.value,
      search: lastTransformedSearch.value,
    };

    try {
      const result = await fetchData(params);
      if (Array.isArray(result)) {
        tableData.value = result;
        totalRecords.value = result.length;
      }
      else {
        tableData.value = result.list;
        totalRecords.value = result.total;
      }
    }
    catch (e) {
      console.error('[useMyTable] fetchData error:', e);
    }
    finally {
      loading.value = false;
    }
  }

  // ── 搜索 / 重置 ───────────────────────────────────────────────────────────

  /**
   * FIX: onSearch 签名更新，接收已由 MySearchForm 执行过 applySearchTransform
   * 的纯净参数，直接传给 loadLazyData，不在此处重复执行 transform。
   *
   * 调用方：MyTable.vue 模板中监听 MySearchForm 的 @search 事件。
   *
   * @param transformed - MySearchForm emit 出的已转换搜索参数
   */
  function onSearch(transformed: Record<string, any>) {
    currentPage.value = 1;
    loadLazyData(transformed);
  }

  /**
   * 重置搜索。
   * 清空所有搜索字段，恢复各项的 defaultValue，回到第一页并重新加载数据。
   * 重置后仍需执行 applySearchTransform，处理 defaultValue 中的复杂值。
   */
  function onReset() {
    const cols = toValue(columns) ?? [];

    // 🌟 瞬间清空，彻底告别 for...delete 循环
    searchParam.value = {};

    for (const col of cols) {
      if (col.search?.defaultValue !== undefined && col.prop) {
        searchParam.value[col.prop as string] = col.search.defaultValue;
      }
    }

    currentPage.value = 1;
    const transformed = applySearchTransform(cols, searchParam.value);
    loadLazyData(transformed);
  }

  // ── 分页 / 排序 ───────────────────────────────────────────────────────────

  function onCurrentPageChange(pageNumber: number) {
    currentPage.value = pageNumber;
    loadLazyData();
  }

  function onPageSizeChange(size: number) {
    rowsPerPage.value = size;
    currentPage.value = 1;
    loadLazyData();
  }

  function onSort({ prop, order }: { prop: string | null; order: 'ascending' | 'descending' | null }) {
    sortField.value = prop ?? undefined;
    sortOrder.value = order;
    loadLazyData();
  }

  // ── 序号计算 ──────────────────────────────────────────────────────────────

  function getRowIndex(index: number): number {
    return (currentPage.value - 1) * rowsPerPage.value + index + 1;
  }

  // ── 批量操作 ──────────────────────────────────────────────────────────────

  async function onBatchMenuCommand(item: BatchActionItem) {
    try {
      await item.action?.();
      // 只有 action 成功执行，才清空勾选项
      resetSelection?.();
    }
    catch (e) {
      console.error('[MyTable] Batch action failed:', e);
    }
  }

  // ── CSV 导出 ──────────────────────────────────────────────────────────────

  function onExportCSV() {
    if (!tableData.value.length) {
      onExportNoData?.();
      return;
    }

    const cols = allColumns.value.filter(c => c.prop && c.exportable !== false);
    const headers = cols.map(c => c.label).join(',');

    function escapeCsvCell(val: unknown): string {
      const str = String(val ?? '');
      if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
        // eslint-disable-next-line e18e/prefer-static-regex
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    }

    // 🌟 新增：支持 user.name 这种深层路径解析
    const resolvePath = (obj: any, path: string) => path.split('.').reduce((o, i) => o?.[i], obj);

    const rows = tableData.value.map(row =>
      cols.map((c) => {
        // 1. 获取原始值（支持点语法）
        let rawVal = resolvePath(row, c.prop as string);

        // 2. 🌟 新增：如果该列配置了字典(enum)，自动翻译为 label 输出
        if (c.enum) {
          const enums = toValue(c.enum);
          const matched = enums.find(e => e.value === rawVal);
          if (matched)
            rawVal = matched.label;
        }

        return escapeCsvCell(rawVal);
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

  // ── 自动刷新 ──────────────────────────────────────────────────────────────

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

  // ── 初始加载 ──────────────────────────────────────────────────────────────

  loadLazyData(applySearchTransform(toValue(columns) ?? [], searchParam));

  // ── 返回 ──────────────────────────────────────────────────────────────────

  return {
    loading,
    tableData,
    totalRecords,
    currentPage,
    rowsPerPage,
    searchParam,
    allColumns,
    selectedColumns,
    onToggleColumns,
    loadLazyData,
    onSearch,
    onReset,
    onCurrentPageChange,
    onPageSizeChange,
    onSort,
    getRowIndex,
    onBatchMenuCommand,
    onExportCSV,
  };
}
