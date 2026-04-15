# MyTable

MyTable is a generic table wrapper built on top of Element Plus. It is designed for server-side pagination, remote sorting, searchable columns, batch actions, and row context menus.

The implementation is split into two parts:

- [src/components/MyTable/index.vue](src/components/MyTable/index.vue) handles table rendering, slots, events, and exposed methods.
- [src/composables/useMyTable.ts](src/composables/useMyTable.ts) handles pagination, sorting, search parameter transformation, auto refresh, and CSV export.

## Capabilities

- Generic row typing, so `prop` stays aligned with the row type as much as possible.
- Automatic search form generation from column metadata.
- `search.transform` support for mapping display fields to backend query fields before requests are sent.
- Automatic `ElTag` rendering for enum columns.
- Column visibility toggling.
- Server-side pagination and remote sorting.
- Batch menus and row context menus.
- Auto refresh.
- CSV export for the current page.
- The table size follows the global theme by default, but can be overridden per instance with `size`.

## Basic Usage

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
  { label: 'Active', value: 1, tagType: 'success' as const },
  { label: 'Frozen', value: 0, tagType: 'danger' as const },
];

const columns = computed<MyTableColumn<UserRow>[]>(() => [
  {
    prop: 'username',
    label: 'Username',
    search: {
      el: 'el-input',
      props: { placeholder: 'Please enter a username' },
      order: 1,
    },
  },
  {
    prop: 'status',
    label: 'Status',
    enum: statusEnum,
    search: {
      el: 'el-select',
      props: { options: statusEnum },
      order: 2,
    },
  },
  {
    prop: 'lastLoginTime',
    label: 'Last Login Time',
    slot: 'lastLoginTime',
  },
  {
    prop: 'loginTimeRange',
    label: 'Login Time Range',
    show: false,
    search: {
      el: 'el-date-picker',
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
    label: 'Batch Delete',
    divided: true,
    disabled: () => selectedRows.value.length === 0,
    action: () => {
      console.log(selectedRows.value);
    },
  },
]);

const contextMenuItems = computed<ContextMenuOption<UserRow>[]>(() => [
  {
    label: 'View Details',
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
    :show-index="true"
    :auto-refresh-interval="10"
    @add="() => {}"
  >
    <template #lastLoginTime="{ row }">
      {{ row.lastLoginTime }}
    </template>

    <template #operation="{ row }">
      <el-button link type="primary" @click="console.log(row.id)">
        View
      </el-button>
    </template>
  </my-table>
</template>
```

## Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| columns | `MyTableColumn<T>[]` | `[]` | Column definitions |
| size | `'small' \| 'default' \| 'large'` | Global theme `general.tableSize` | Table density. Affects the table, pagination, toolbar, and search area. |
| fetchData | `(params) => Promise<MyTableFetchResult<T> \| T[]> \| MyTableFetchResult<T> \| T[]` | required | Data loader |
| selectable | `boolean` | `true` | Shows the selection column |
| showIndex | `boolean` | `false` | Shows a continuous row index column |
| showAddBtn | `boolean` | `true` | Shows the default add button |
| showEditBtn | `boolean` | `true` | Shows the default edit button. Deprecated; use the `operation` slot instead. |
| showDeleteBtn | `boolean` | `true` | Shows the default delete button. Deprecated; use the `operation` slot instead. |
| batchMenuItems | `BatchActionItem[]` | `[]` | Batch action menu |
| contextMenuItems | `ContextMenuOption<T>[]` | `undefined` | Row context menu |
| autoRefreshInterval | `number` | `0` | Auto refresh interval in seconds |
| showSearch | `boolean` | `true` | Shows the search area |
| showOperationColumn | `boolean` | `true` | Shows the operation column |
| operationColumnWidth | `number \| string` | `160` | Operation column width |

Notes:

- Unconsumed attrs are forwarded to the internal `el-table`.
- When `size` is omitted, the component uses the global theme's `tableSize`.
- Passing `size` only affects the current MyTable instance and does not change the global theme.
- Use `row-key` or `rowKey` to specify the unique row identifier. The default is `id`.
- The component ignores old `dataKey` and `selectedRows` props.

## Column Definitions

Column definitions use `MyTableColumn<T>`.

| Field | Type | Description |
| --- | --- | --- |
| prop | `keyof T \| string` | Data field name |
| label | `string` | Column label |
| slot | `string` | Custom cell slot name |
| show | `boolean` | Whether the column is visible in the table. Hidden columns can still participate in search. |
| search | `SearchProps` | Search configuration |
| enum | `MaybeRef<EnumProps[]>` | Enum configuration used for automatic `ElTag` rendering |
| exportable | `boolean` | Whether the column is included in CSV export. Defaults to `true`. |
| exportFormatter | `(value, row) => string` | Final formatter used before CSV export |

Example:

```ts
const columns: MyTableColumn<UserRow>[] = [
  { prop: 'username', label: 'Username', search: { el: 'el-input' } },
  { prop: 'status', label: 'Status', enum: statusEnum },
  { prop: 'lastLoginTime', label: 'Last Login Time', slot: 'lastLoginTime' },
];
```

Notes:

- `slot` takes priority over `enum`.
- `enum` only affects cell rendering; it does not automatically affect search fields.
- Columns with `exportable: false` are excluded from CSV export.

## Search Configuration

When a column declares `search`, MyTable renders a search form automatically.

Supported search control types:

- `el-input`
- `el-select`
- `el-date-picker`
- `el-switch`

Key `SearchProps` fields:

| Field | Type | Description |
| --- | --- | --- |
| el | `SearchElType` | Search control type |
| props | component props | Forwarded to the underlying Element Plus component |
| defaultValue | `any` | Initial value used on mount and reset |
| order | `number` | Sort order; smaller values appear first |
| span | `number` | Grid width on a 24-column layout |
| transform | `(val) => Record<string, any>` | Converts the search value before submission |

Date range example:

```ts
{
  prop: 'createdTimeRange',
  label: 'Created Time',
  show: false,
  search: {
    el: 'el-date-picker',
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

Notes:

- `transform` results are merged into the final request payload.
- The original field is removed from the final `search` object.
- `onReset` restores `defaultValue` and runs `transform` again.

## Request Contract

MyTable passes the following parameters to `fetchData`:

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

Notes:

- `search` is the final object after `transform` has run.
- `sortField` matches the current column `prop`.
- `sortOrder` follows Element Plus remote sorting semantics.
- `searchQuery` is kept for compatibility; the component primarily uses `search`.

`fetchData` can return either:

```ts
interface MyTableFetchResult<T> {
  list: T[];
  total: number;
}
```

or a raw array:

```ts
T[]
```

Notes:

- For server-side pagination, returning `{ list, total }` is recommended.
- When an array is returned, the component uses the array length as `total`.

## Menu Items

### Row context menu `contextMenuItems`

Row context menus use `ContextMenuOption<T>` from [src/plugins/contextMenu.ts](src/plugins/contextMenu.ts). The `command` callback receives the current row.

### Batch menu `batchMenuItems`

Batch menus use `BatchActionItem`. The click handler does not receive row data.

```ts
interface BatchActionItem {
  label?: string;
  icon?: Component;
  disabled?: boolean | (() => boolean);
  divided?: boolean;
  action?: () => void | Promise<void>;
}
```

Notes:

- Batch menus only appear when rows are selected.
- Successful batch actions automatically clear the current selection.

## v-model

Only one two-way binding is supported:

```vue
<my-table v-model:selection="selectedRows" />
```

Notes:

- `selection` is the currently selected row array, typed as `T[]`.
- `v-model:selectedRows` is not a supported public API.

## Events

| Event | Payload | Description |
| --- | --- | --- |
| add | void | Fired when the default add button is clicked |
| edit | `row: T` | Fired when the default edit button is clicked |
| delete | `row: T` | Fired after the delete confirmation succeeds |

Notes:

- `delete` is always guarded by `usePopup().confirm()` first.
- When you provide the `operation` slot, you typically no longer need the default edit/delete buttons.

## Slots

### `toolbar-left`

Left side of the toolbar. The default content includes the add button, batch menu, and refresh button.

### `toolbar-right`

Right side of the toolbar, placed before the column selector.

### Column slots

If a column declares `slot`:

```ts
{ prop: 'lastLoginTime', label: 'Last Login Time', slot: 'lastLoginTime' }
```

The corresponding usage is:

```vue
<template #lastLoginTime="{ row, $index, column }">
  {{ row.lastLoginTime }}
</template>
```

Notes:

- The slot name comes directly from `col.slot`.
- The slot receives the default Element Plus table scope.

### `operation`

```vue
<template #operation="{ row }">
  <el-button link type="primary">View</el-button>
</template>
```

Notes:

- `operation` only receives `{ row }`.
- When the `operation` slot is provided, the default edit/delete buttons are not rendered.
- If `contextMenuItems` is configured, a More button also appears at the end of the operation column.

## Exposed Methods

The component exposes the following members through `ref`:

```ts
interface MyTableExpose<T> {
  currentRow: T | null;
  reload: () => void;
  searchParam: Record<string, any>;
  clearSelection: () => void;
}
```

Example:

```ts
tableRef.value?.searchParam.username = 'admin';
tableRef.value?.reload();
tableRef.value?.clearSelection();
```

Notes:

- The component does not expose `search()`.
- The component does not expose `onExportCSV()`.
- Mutating `searchParam` directly and calling `reload()` does not trigger an extra search lifecycle.

## useMyTable

When you use `useMyTable` directly, it currently returns these states and methods:

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

Behavior notes:

- The first load automatically calls `loadLazyData`.
- Search always runs `applySearchTransform` on `searchParam` first.
- Pagination and sorting reuse the last transformed `search` payload.
- `rowsPerPage` defaults to `20`.
- Page sizes are fixed to `10`, `20`, `50`, `100`, and `1000`.
- When `autoRefreshInterval > 0`, polling is enabled and automatically cleaned up on dependency changes or unmount.
- Batch menu actions call `resetSelection` after success.
- `onExportCSV` exports the current page only and skips columns with `exportable: false`.

## Common Patterns

- When display columns and search columns have different data shapes, do not reuse the same `prop`. A typical example is using `lastLoginTime` for display and `loginTimeRange` for search.
- For fields that only exist in the search form, set `show: false`.
- Prefer `slot` for complex cells and `enum` for simple status tags.
- Use `const` for static column definitions. Switch to `computed` only when the columns depend on permissions, language, or other dynamic business state.

## Migration Tips

| Old pattern | New pattern |
| --- | --- |
| field | prop |
| header | label |
| items | list |
| dataKey | row-key / rowKey |
| #name-body | set `slot: 'name'` and use `#name` |
| separator | divided |
| v-model:selectedRows | v-model:selection |

If you are migrating an old page, start with these replacements.
