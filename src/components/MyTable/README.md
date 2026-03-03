# MyTable

A reusable table component built with Element Plus, designed for server-side pagination/sorting and compatible with legacy PrimeVue usage patterns.

一个基于 Element Plus 的可复用表格组件，面向服务端分页/排序场景，并兼容部分历史 PrimeVue 用法。

---

## Features | 功能特性

- Server-side pagination, sorting, and keyword search  
  支持服务端分页、排序、关键字搜索
- Dynamic visible columns (column chooser)  
  支持动态列显示（列选择）
- Row selection with dual v-model compatibility  
  行选择支持双 v-model 兼容
- Batch menu + row context menu  
  支持批量菜单 + 行上下文菜单
- Built-in CSV export (current page + visible columns)  
  内置 CSV 导出（当前页 + 当前可见列）
- `reload()` exposed for imperative refresh  
  暴露 `reload()` 供父组件主动刷新

---

## Basic Usage | 基础用法

```vue
<template>
  <div class="h-[calc(100vh-250px)]">
    <MyTable
      ref="tableRef"
      v-model:selection="selectedRows"
      dataKey="playerId"
      :columns="columns"
      :fetchData="fetchData"
      :batchMenuItems="batchMenuItems"
      :contextMenuItems="contextMenuItems"
      isShowIndex
      isShowEditBtn
      @add="onAdd"
      @edit="onEdit"
      @delete="onDelete"
    >
      <template #bannedUntil-body="{ data }">
        {{ dayjs(data.bannedUntil).format() }}
      </template>
    </MyTable>
  </div>
</template>

<script setup lang="ts">
import dayjs from 'dayjs';
import * as api from '~/api/gameServer';

const tableRef = ref();
const selectedRows = ref<any[]>([]);

const columns = [
  { field: 'playerId', header: 'Player ID', class: 'min-w-40' },
  { field: 'displayName', header: 'Display Name', sortable: true, class: 'min-w-40' },
  { field: 'bannedUntil', header: 'Banned Until', sortable: true, class: 'min-w-40' },
  { field: 'reason', header: 'Reason' },
];

const fetchData = async (params: {
  pageNumber: number;
  pageSize: number;
  order: string | null;
  desc: boolean;
  keyword: string;
}) => {
  const data = await api.getBannedPlayers(params);
  return {
    items: data.slice((params.pageNumber - 1) * params.pageSize, params.pageNumber * params.pageSize),
    total: data.length,
  };
};

const batchMenuItems = computed(() => [
  {
    label: 'Batch Delete',
    disabled: selectedRows.value.length === 0,
    command: async () => {
      await api.unbanPlayers(selectedRows.value.map(row => row.playerId));
      tableRef.value.reload();
    },
  },
]);

const contextMenuItems = [
  {
    label: 'Copy ID',
    command: (row: any) => navigator.clipboard.writeText(row.playerId),
  },
  { separator: true },
  {
    label: 'Delete',
    command: async (row: any) => {
      await api.unbanPlayers([row.playerId]);
      tableRef.value.reload();
    },
  },
];

function onAdd() {}
function onEdit(row: any) {}
function onDelete(row: any) {}
</script>
```

---

## Data Contract | 数据契约

`fetchData(params)` receives:

- `pageNumber: number` (1-based)
- `pageSize: number`
- `order: string | null`
- `desc: boolean`
- `keyword: string`

`fetchData` should return one of:

- Paged result: `{ items: any[]; total: number }`
- Plain array: `any[]` (component will treat it as full data and paginate on the current page result)

---

## Props

| Prop | Type | Default | Description |
|---|---|---:|---|
| `columns` | `TableColumn[]` | `[]` | Column definitions. Common fields: `field`, `header`, `sortable`, plus pass-through table-column props. |
| `fetchData` | `(params) => Promise<FetchResult \| any[]> \| FetchResult \| any[]` | - | Data loader (required). |
| `isSelectable` | `boolean` | `true` | Show selection column. |
| `isShowIndex` | `boolean` | `false` | Show index column. |
| `isShowAddBtn` | `boolean` | `true` | Show add button in toolbar. |
| `isShowEditBtn` | `boolean` | `true` | Show edit button in action column. |
| `isShowDeleteBtn` | `boolean` | `true` | Show delete button in action column. |
| `batchMenuItems` | `MenuItem[]` | `[]` | Batch menu items in toolbar. |
| `contextMenuItems` | `MenuItem[]` | `undefined` | Row context menu items (right click / action button). |
| `autoRefreshInterval` | `number` | `0` | Auto refresh interval in seconds. `0` means disabled. |

### MenuItem shape

```ts
interface MenuItem {
  label?: string;
  icon?: any;
  disabled?: boolean;
  separator?: boolean;
  command?: (...args: any[]) => void;
}
```

Notes:

- In `contextMenuItems`, `command(rowData)` receives the current row.
- `{ separator: true }` is supported and mapped to `vue3-context-menu` divider.

---

## v-model Compatibility | v-model 兼容

This component supports both:

- `v-model:selectedRows` (new name)
- `v-model:selection` (legacy PrimeVue-like name)

Both models are synchronized internally.

组件同时支持 `v-model:selectedRows`（新）和 `v-model:selection`（旧），内部会自动同步。

---

## Events

| Event | Payload | Description |
|---|---|---|
| `add` | `void` | Triggered when add button is clicked. |
| `edit` | `rowData` | Triggered from action column edit button. |
| `delete` | `rowData` | Triggered after delete confirmation. |

---

## Slots

### Dynamic cell slot

Slot name pattern:

- `${field}-body`

Example:

```vue
<template #bannedUntil-body="{ data, row, index }">
  {{ data.bannedUntil }}
</template>
```

Slot scope includes:

- `data`: alias of `row` (legacy compatibility)
- `row`: current row object
- `index`: current row index in current page
- plus native Element Plus table column slot fields

---

## Exposed Methods | 暴露方法

Access via component ref:

- `reload(): Promise<void>`: reload current page data
- `currentRow`: current row selected by context menu actions

Example:

```ts
tableRef.value.reload();
```

---

## Attribute Forwarding | 属性透传

Most extra attributes are forwarded to `el-table` via `v-bind="$attrs"` (except legacy `dataKey`, which is consumed to build `row-key`).

`dataKey` is supported for migration compatibility and mapped to `row-key`.

---

## PrimeVue Migration Notes | PrimeVue 迁移说明

- `DataTable`/`Column` -> `el-table`/`el-table-column`
- `ContextMenu` replaced by `@imengyu/vue3-context-menu`
- `v-model:selection` remains supported
- `dataKey` remains supported and maps to `row-key`
- Built-in CSV export is custom-implemented (not PrimeVue native API)

---

## Best Practices | 最佳实践建议

- Keep `columns` stable (use `computed` / `const`) to avoid unnecessary resets.
- Return paged shape `{ items, total }` from `fetchData` for large datasets.
- Use `row-key`/`dataKey` with unique IDs for stable selection behavior.
- Keep `contextMenuItems` side-effect-safe and idempotent where possible.
