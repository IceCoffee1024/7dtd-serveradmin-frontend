# MyTable

MyTable 是基于 Element Plus 的通用泛型表格组件，适合服务端分页、远程排序、条件搜索、批量操作和右键菜单场景。

当前实现由两部分组成：

- [src/components/MyTable/index.vue](src/components/MyTable/index.vue) 负责表格渲染、插槽、事件和暴露方法。
- [src/composables/useMyTable.ts](src/composables/useMyTable.ts) 负责分页、排序、搜索参数转换、自动刷新和导出逻辑。

## 能力

- 泛型列配置，`prop` 会尽量受行数据类型约束。
- 根据列上的 `search` 自动生成顶部搜索区域。
- 支持 `search.transform`，在发请求前把展示字段转换成后端字段。
- 支持 `enum` 自动渲染 `ElTag`。
- 支持列显示控制。
- 支持服务端分页和远程排序。
- 支持批量菜单和行右键菜单。
- 支持自动刷新。
- 支持 CSV 导出，按当前数据页生成文件。
- 默认跟随全局主题的 `tableSize`，也支持通过组件 `size` 局部覆盖。

## 基础用法

```vue
<script setup lang="ts">
import type { ContextMenuOption } from '~/plugins/contextMenu';
import type {
  BatchActionItem,
  MyTableColumn,
  MyTableFetchParams,
  MyTableFetchResult,
} from '~/composables/useMyTable';

interface UserRow {
  id: string;
  username: string;
  status: number;
  lastLoginTime: string;
  loginTimeRange?: [string, string] | null;
}

const statusEnum = [
  { label: '正常', value: 1, tagType: 'success' as const },
  { label: '冻结', value: 0, tagType: 'danger' as const },
];

const columns = computed<MyTableColumn<UserRow>[]>(() => [
  {
    prop: 'username',
    label: '用户名',
    search: {
      el: 'input',
      props: { placeholder: '请输入用户名' },
      order: 1,
    },
  },
  {
    prop: 'status',
    label: '状态',
    enum: statusEnum,
    search: {
      el: 'select',
      props: { options: statusEnum },
      order: 2,
    },
  },
  {
    prop: 'lastLoginTime',
    label: '最后登录时间',
    slot: 'lastLoginTime',
  },
  {
    prop: 'loginTimeRange',
    label: '登录时间范围',
    isShow: false,
    search: {
      el: 'date-picker',
      props: {
        type: 'daterange',
        valueFormat: 'YYYY-MM-DD HH:mm:ss',
      },
      transform: (val: [string, string] | null) => ({
        loginStartTime: val?.[0] ?? undefined,
        loginEndTime: val?.[1] ?? undefined,
      }),
    },
  },
]);

const selectedRows = ref<UserRow[]>([]);

async function fetchData(params: MyTableFetchParams): Promise<MyTableFetchResult<UserRow>> {
  console.log(params.search);

  return {
    list: [],
    total: 0,
  };
}

const batchMenuItems = computed<BatchActionItem[]>(() => [
  {
    label: '批量删除',
    divided: true,
    disabled: () => selectedRows.value.length === 0,
    action: () => {
      console.log(selectedRows.value);
    },
  },
]);

const contextMenuItems = computed<ContextMenuOption<UserRow>[]>(() => [
  {
    label: '查看详情',
    command: row => console.log(row?.id),
  },
]);
</script>

<template>
  <my-table
    v-model:selection="selectedRows"
    size="small"
    row-key="id"
    :columns="columns"
    :fetch-data="fetchData"
    :batch-menu-items="batchMenuItems"
    :context-menu-items="contextMenuItems"
    :is-show-index="true"
    :auto-refresh-interval="10"
    @add="() => {}"
  >
    <template #lastLoginTime="{ row }">
      {{ row.lastLoginTime }}
    </template>

    <template #operation="{ row }">
      <el-button link type="primary" @click="console.log(row.id)">
        查看
      </el-button>
    </template>
  </my-table>
</template>
```

## Props

| Prop | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| columns | `MyTableColumn<T>[]` | `[]` | 列配置 |
| size | `'small' \| 'default' \| 'large'` | 全局主题中的 `general.tableSize` | 表格尺寸，作用于表格本体、分页、工具栏和搜索区域；传入后可局部覆盖全局配置 |
| fetchData | `(params) => Promise<MyTableFetchResult<T> \| T[]> \| MyTableFetchResult<T> \| T[]` | 必填 | 数据获取函数 |
| isSelectable | `boolean` | `true` | 是否显示多选列 |
| isShowIndex | `boolean` | `false` | 是否显示序号列，序号按当前页连续计算 |
| isShowAddBtn | `boolean` | `true` | 是否显示默认新增按钮 |
| isShowEditBtn | `boolean` | `true` | 是否显示默认编辑按钮，已废弃，建议使用 `operation` 插槽 |
| isShowDeleteBtn | `boolean` | `true` | 是否显示默认删除按钮，已废弃，建议使用 `operation` 插槽 |
| batchMenuItems | `BatchActionItem[]` | `[]` | 批量操作菜单 |
| contextMenuItems | `ContextMenuOption<T>[]` | `undefined` | 行右键菜单 |
| autoRefreshInterval | `number` | `0` | 自动刷新间隔，单位秒 |
| showSearch | `boolean` | `true` | 是否显示搜索区域 |
| showOperationColumn | `boolean` | `true` | 是否显示操作列 |
| operationColumnWidth | `number \| string` | `160` | 操作列宽度 |

补充说明：

- 组件会把未消费的 attrs 透传给内部 `el-table`。
- 未传 `size` 时，组件会读取全局主题中的 `tableSize`；适合在主题配置里统一控制全站表格密度。
- 传入 `size` 后，只覆盖当前 MyTable 实例，不会改动全局主题配置。
- 行唯一键请通过 `row-key` 或 `rowKey` 传入，默认值为 `id`。
- 组件当前会忽略旧的 `dataKey`、`selectedRows` 等属性。

## 列配置

列配置类型为 `MyTableColumn<T>`。

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| prop | `keyof T \| string` | 数据字段名 |
| label | `string` | 列标题 |
| slot | `string` | 自定义渲染插槽名 |
| isShow | `boolean` | 是否在表格中显示该列；设为 `false` 时不渲染，但搜索仍然生效 |
| search | `SearchProps` | 搜索项配置 |
| enum | `MaybeRef<EnumProps[]>` | 自动渲染 `ElTag` 的枚举配置 |
| exportable | `boolean` | 是否允许导出 CSV，默认 `true` |
| exportFormatter | `(value, row) => string` | 导出 CSV 前的最终格式化函数，适合对象字段或和展示文案保持一致的列 |

示例：

```ts
const columns: MyTableColumn<UserRow>[] = [
  { prop: 'username', label: '用户名', search: { el: 'input' } },
  { prop: 'status', label: '状态', enum: statusEnum },
  { prop: 'lastLoginTime', label: '最后登录时间', slot: 'lastLoginTime' },
];
```

说明：

- `slot` 优先于 `enum`。
- `enum` 只影响单元格展示，不会自动影响搜索项。
- `exportable: false` 的列不会进入 CSV 导出。

## 搜索配置

在列上配置 `search` 后，MyTable 会自动渲染顶部搜索表单。

当前支持的搜索组件类型：

- `input`
- `select`
- `date-picker`
- `switch`

`SearchProps` 关键字段如下：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| el | `SearchElType` | 搜索组件类型 |
| props | 对应组件 props | 透传给 Element Plus 组件 |
| defaultValue | `any` | 默认值，初始化和重置时生效 |
| order | `number` | 排序，越小越靠前 |
| span | `number` | 栅格宽度，基于 24 栅格 |
| transform | `(val) => Record<string, any>` | 提交前转换字段 |

日期范围拆分示例：

```ts
{
  prop: 'createdTimeRange',
  label: '创建时间',
  isShow: false,
  search: {
    el: 'date-picker',
    props: {
      type: 'daterange',
      valueFormat: 'YYYY-MM-DD HH:mm:ss',
    },
    transform: (val: [string, string] | null) => ({
      startTime: val?.[0] ?? undefined,
      endTime: val?.[1] ?? undefined,
    }),
  },
}
```

说明：

- `transform` 返回的对象会合并到最终请求参数中。
- 原始字段会从最终 `search` 中移除。
- `onReset` 会恢复 `defaultValue`，并再次执行 `transform`。

## 数据契约

MyTable 会把下面的参数传给 `fetchData`：

```ts
interface MyTableFetchParams {
  pageNumber: number;
  pageSize: number;
  sortField?: string;
  sortOrder?: 'ascending' | 'descending' | null;
  search?: Record<string, any>;
  searchQuery?: string;
}
```

说明：

- `search` 是已经过 `transform` 处理后的最终对象。
- `sortField` 对应当前列的 `prop`。
- `sortOrder` 与 Element Plus 远程排序语义一致。
- `searchQuery` 目前保留为兼容字段，组件内部主要使用 `search`。

`fetchData` 的返回值支持两种形式：

```ts
interface MyTableFetchResult<T> {
  list: T[];
  total: number;
}
```

或直接返回数组：

```ts
T[]
```

说明：

- 服务端分页推荐返回 `{ list, total }`。
- 直接返回数组时，组件会把 `total` 设为数组长度。

## 菜单项

### 右键菜单 `contextMenuItems`

右键菜单使用 [src/plugins/contextMenu.ts](src/plugins/contextMenu.ts) 中的 `ContextMenuOption<T>`，`command` 会收到当前行数据。

### 批量菜单 `batchMenuItems`

批量菜单使用 `BatchActionItem`，点击后不会接收当前行数据。

```ts
interface BatchActionItem {
  label?: string;
  icon?: Component;
  disabled?: boolean | (() => boolean);
  divided?: boolean;
  action?: () => void | Promise<void>;
}
```

说明：

- 批量菜单只在存在选中行时显示。
- `action` 执行成功后会自动清空当前选中态。

## v-model

当前只支持一个双向绑定：

```vue
<my-table v-model:selection="selectedRows" />
```

说明：

- `selection` 的类型是当前选中行数组 `T[]`。
- `v-model:selectedRows` 不是正式 API。

## 事件

| 事件 | 载荷 | 说明 |
| --- | --- | --- |
| add | void | 点击默认新增按钮时触发 |
| edit | `row: T` | 点击默认编辑按钮时触发 |
| delete | `row: T` | 删除确认后触发 |

说明：

- `delete` 事件触发前会先走 `usePopup().confirm()`。
- 如果自定义了 `operation` 插槽，通常不会再依赖默认的编辑/删除按钮。

## 插槽

### `toolbar-left`

工具栏左侧区域，默认渲染新增按钮、批量菜单和刷新按钮。

### `toolbar-right`

工具栏右侧区域，位于列选择器左边。

### 列插槽

如果某列配置了 `slot`：

```ts
{ prop: 'lastLoginTime', label: '最后登录时间', slot: 'lastLoginTime' }
```

则对应写法为：

```vue
<template #lastLoginTime="{ row, $index, column }">
  {{ row.lastLoginTime }}
</template>
```

说明：

- 插槽名直接来自 `col.slot`。
- 传入的是 Element Plus 表格默认 scope。

### `operation`

```vue
<template #operation="{ row }">
  <el-button link type="primary">查看</el-button>
</template>
```

说明：

- `operation` 插槽只接收 `{ row }`。
- 如果提供了 `operation` 插槽，默认编辑/删除按钮不会再渲染。
- 如果配置了 `contextMenuItems`，操作列末尾还会显示更多按钮。

## 暴露方法

通过 ref 可以访问以下成员：

```ts
interface MyTableExpose<T> {
  currentRow: T | null;
  reload: () => void;
  searchParam: Record<string, any>;
  clearSelection: () => void;
}
```

示例：

```ts
tableRef.value?.searchParam.username = 'admin';
tableRef.value?.reload();
tableRef.value?.clearSelection();
```

说明：

- 组件没有暴露 `search()`。
- 组件没有暴露 `onExportCSV()`。
- 直接修改 `searchParam` 后调用 `reload()`，不会额外重新执行搜索生命周期。

## useMyTable

如果你直接复用 `useMyTable`，它当前返回这些状态和方法：

- `loading`
- `tableData`
- `totalRecords`
- `currentPage`
- `rowsPerPage`
- `searchParam`
- `allColumns`
- `selectedColumns`
- `onToggleColumns`
- `loadLazyData`
- `onSearch`
- `onReset`
- `onCurrentPageChange`
- `onPageSizeChange`
- `onSort`
- `getRowIndex`
- `onBatchMenuCommand`
- `onExportCSV`

行为说明：

- 初次加载时会自动调用一次 `loadLazyData`。
- 搜索时会先对 `searchParam` 执行 `applySearchTransform`。
- 翻页和排序会复用上一次转换后的 `search` 参数。
- `rowsPerPage` 默认值是 `20`。
- 页大小固定为 `10、20、50、100、1000`。
- `autoRefreshInterval > 0` 时会建立轮询，并在依赖变化或组件卸载时自动清理。
- 批量菜单执行成功后会调用 `resetSelection`。
- `onExportCSV` 只导出当前页数据，并会忽略 `exportable: false` 的列。

## 常见写法

- 展示列和搜索列的数据形态不一致时，不要复用同一个 `prop`。典型场景是展示列用 `lastLoginTime`，搜索列单独用 `loginTimeRange`。
- 仅用于搜索表单的字段，建议设置 `isShow: false`。
- 复杂单元格优先用 `slot`；纯状态标签优先用 `enum`。
- 静态列配置优先用 `const`，只有在权限、语言或业务状态变化时才用 `computed`。

## 迁移提示

| 旧写法 | 新写法 |
| --- | --- |
| field | prop |
| header | label |
| items | list |
| dataKey | row-key / rowKey |
| #name-body | 配置 `slot: 'name'` 后使用 `#name` |
| separator | divided |
| v-model:selectedRows | v-model:selection |

如果是从旧页面迁移，优先先改这些项。
