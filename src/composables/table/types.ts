import type { DatePickerProps, InputProps, SelectProps, SwitchProps, TableColumnCtx } from 'element-plus';
import type { MaybeRef } from 'vue';
import type { FormElType, MyFormFieldTooltip, OptionItem } from '~/composables/useMyForm';

/**
 * Each search component exposes a slightly different props surface.
 * This mapping keeps the search adapter strongly typed without leaking
 * Element Plus implementation details into table callers.
 */
interface SearchElPropsMap {
  'input': Partial<InputProps>;
  'select': Partial<SelectProps> & { options?: OptionItem[] };
  'date-picker': Partial<DatePickerProps>;
  'switch': Partial<SwitchProps>;
}

/**
 * Search widget types supported by the table search adapter.
 */
export type SearchElType = Extract<FormElType, 'input' | 'select' | 'date-picker' | 'switch'>;

/**
 * Search item configuration used by MyTable columns.
 */
export interface SearchProps<El extends SearchElType = SearchElType> {
  el: El;
  props?: SearchElPropsMap[El];
  defaultValue?: any;
  order?: number;
  tooltip?: string | MyFormFieldTooltip;
  span?: number;
  transform?: (val: any) => Record<string, any>;
}

/**
 * Dictionary item configuration for table cells and export labels.
 */
export interface EnumProps {
  label: string;
  value: any;
  tagType?: 'success' | 'info' | 'warning' | 'danger';
}

/**
 * Batch menu item used by MyTable.
 */
export interface BatchActionItem {
  label?: string;
  icon?: Component;
  disabled?: boolean | (() => boolean);
  divided?: boolean;
  action?: () => void | Promise<void>;
}

/**
 * Table column configuration.
 */
export interface MyTableColumn<T extends Record<string, any> = Record<string, any>>
  extends Partial<Omit<TableColumnCtx<T>, 'prop' | 'label'>> {
  prop?: keyof T | string;
  label: string;
  slot?: string;
  show?: boolean;
  search?: SearchProps;
  enum?: MaybeRef<EnumProps[]>;
  exportable?: boolean;
  exportFormatter?: (value: unknown, row: T) => string | number | boolean | null | undefined;
  autoWidth?: boolean;
  autoWidthMax?: number;
}

/**
 * Standardized fetch parameters produced by the query layer.
 */
export interface MyTableFetchParams {
  pageNumber: number;
  pageSize: number;
  sortField?: string;
  sortOrder?: 'ascending' | 'descending' | null;
  search?: Record<string, any>;
}

/**
 * Standardized fetch result produced by the data layer.
 */
export interface MyTableFetchResult<T> {
  list: T[];
  total: number;
}

/**
 * High-level options accepted by the MyTable facade.
 */
export interface UseMyTableOptions<T extends Record<string, any>> {
  columns: MaybeRef<MyTableColumn<T>[]>;
  fetchData: (params: MyTableFetchParams) => Promise<MyTableFetchResult<T> | T[]>;
  autoRefreshInterval?: MaybeRef<number>;
  exportCSVLabel?: MaybeRef<string>;
  onExportNoData?: () => void;
  resetSelection?: () => void;
}
