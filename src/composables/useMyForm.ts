import type {
  CheckboxGroupProps,
  DatePickerProps,
  FormInstance,
  InputNumberProps,
  InputProps,
  RadioGroupProps,
  SelectProps,
  SwitchProps,
  UploadProps,
} from 'element-plus';
import type { MaybeRef } from 'vue';
import { cloneDeep } from 'es-toolkit';
import { computed, nextTick, ref } from 'vue';

// ─────────────────────────────────────────────────────────────────────────────
// 表单组件类型 → Props 映射
// ─────────────────────────────────────────────────────────────────────────────

interface FormElPropsMap {
  'input': Partial<InputProps>;
  'input-number': Partial<InputNumberProps>;
  /**
   * `options` is reserved for MyForm's normalized option source.
   * Element Plus' select props also expose an `options` field, so we omit it
   * here to avoid a template-level prop collision when binding to FieldRenderer.
   */
  'select': Partial<Omit<SelectProps, 'options'>>;
  'date-picker': Partial<DatePickerProps>;
  'switch': Partial<SwitchProps>;
  'radio-group': Partial<Omit<RadioGroupProps, 'options'>>;
  'checkbox-group': Partial<Omit<CheckboxGroupProps, 'options'>>;
  'upload': Partial<UploadProps>;
  'custom': Record<string, any>;
}

export type FormElType = keyof FormElPropsMap;

// ─────────────────────────────────────────────────────────────────────────────
// 组件映射表（显式导入，支持 Treeshaking）
// ─────────────────────────────────────────────────────────────────────────────

export const FORM_COMPONENT_MAP = {
  'input': ElInput,
  'input-number': ElInputNumber,
  'select': ElSelect,
  'date-picker': ElDatePicker,
  'switch': ElSwitch,
  'radio-group': ElRadioGroup,
  'checkbox-group': ElCheckboxGroup,
  'upload': ElUpload,
} as const satisfies Partial<Record<FormElType, unknown>>;

// ─────────────────────────────────────────────────────────────────────────────
// 通用选项类型
// ─────────────────────────────────────────────────────────────────────────────

export interface OptionItem {
  label: string;
  value: any;
  disabled?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// 操作模式
// ─────────────────────────────────────────────────────────────────────────────

export type FormMode = 'add' | 'edit' | 'view';

// ─────────────────────────────────────────────────────────────────────────────
// 字段配置
// ─────────────────────────────────────────────────────────────────────────────

export type ResponsiveSpan = number | {
  xs?: number;
  sm?: number;
  md?: number;
  lg?: number;
  xl?: number;
};

/**
 * Help tooltip shown next to a form field label.
 * The content should explain why the value matters or how it is used.
 */
export interface MyFormFieldTooltip {
  /** Tooltip text shown on hover. */
  content: string;
  /** Optional placement for the hover bubble. */
  placement?: string;
}

export interface MyFormField<
  T extends Record<string, any> = Record<string, any>,
  El extends FormElType = FormElType,
> {
  prop: (keyof T & string) | (string & {});
  label: string;
  el: El;
  props?: FormElPropsMap[El];
  options?: MaybeRef<OptionItem[]>;
  span?: ResponsiveSpan;
  isShow?: boolean | ((model: Partial<T>) => boolean);
  disabled?: boolean | ((model: Partial<T>) => boolean);
  onChange?: (val: any, model: Partial<T>) => void;
  placeholder?: string;
  tooltip?: string | MyFormFieldTooltip;
}

// ─────────────────────────────────────────────────────────────────────────────
// useMyForm Options
// ─────────────────────────────────────────────────────────────────────────────
export interface UseMyFormOptions<T extends Record<string, any>> {
  fields: MyFormField<T>[];
  defaultValues?: () => Partial<T>;
}

// ─────────────────────────────────────────────────────────────────────────────
// useMyForm
// ─────────────────────────────────────────────────────────────────────────────

export function useMyForm<T extends Record<string, any>>(
  options: UseMyFormOptions<T>,
) {
  const { fields, defaultValues } = options;

  const mode = ref<FormMode>('add');

  // FIX: 用 ref 替换 reactive。
  // reactive + delete 的方案需要逐字段删除才能触发响应式更新，
  // 且无法直接整体替换对象引用。
  // ref 可以直接赋值新对象，响应式更可靠，代码也更简洁。
  const formData = ref<Partial<T>>({});

  const formRef = ref<FormInstance | null>(null);

  const isViewMode = computed(() => mode.value === 'view');

  const visibleFields = computed(() =>
    fields.filter((field) => {
      if (typeof field.isShow === 'function')
        return field.isShow(formData.value);
      return field.isShow !== false;
    }),
  );

  async function init(rowData?: Partial<T>, initMode: FormMode = 'add') {
    mode.value = initMode;

    if (initMode === 'add') {
      // FIX: cloneDeep 替换 Object.assign。
      // Object.assign 是浅拷贝，defaultValues 返回的对象若含嵌套结构
      // （如数组、子对象），表单修改会直接污染原始默认值，
      // 导致下次打开新增弹窗时默认值已被改写。
      // cloneDeep 确保每次 init 都是完全独立的副本。
      formData.value = cloneDeep(defaultValues?.() ?? {});
    }
    else {
      // FIX: 编辑 / 查看模式同样深拷贝行数据。
      // 防止表单修改直接回写到 MyTable 的 tableData 中
      // （两者若共享同一对象引用，表单改动会实时反映到表格行，
      // 用户取消编辑时表格数据已被污染）。
      formData.value = cloneDeep(rowData ?? {});
    }

    await nextTick();
    formRef.value?.clearValidate();
  }

  async function validate(): Promise<boolean> {
    if (isViewMode.value)
      return true;
    return formRef.value?.validate().catch(() => false) ?? false;
  }

  async function reset() {
    // FIX: 同 init，深拷贝确保重置后的数据与默认值完全隔离
    formData.value = cloneDeep(defaultValues?.() ?? {});
    await nextTick();
    formRef.value?.clearValidate();
  }

  return {
    mode,
    formData,
    formRef,
    isViewMode,
    visibleFields,
    init,
    validate,
    reset,
  };
}
