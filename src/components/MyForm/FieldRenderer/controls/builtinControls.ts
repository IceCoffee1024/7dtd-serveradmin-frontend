import type { BuiltinControlType, FormControlDefinition } from './types';

/**
 * Direct Element Plus control map used by MyForm.
 * These entries stay synchronous because they are part of the standard UI kit.
 */
export const builtinControls = {
  'el-input': {
    component: ElInput,
  },
  'el-input-number': {
    component: ElInputNumber,
  },
  'el-select': {
    component: ElSelect,
    supportsOptions: true,
  },
  'el-date-picker': {
    component: ElDatePicker,
  },
  'el-switch': {
    component: ElSwitch,
  },
  'el-radio-group': {
    component: ElRadioGroup,
    supportsOptions: true,
  },
  'el-checkbox-group': {
    component: ElCheckboxGroup,
    supportsOptions: true,
  },
} as const satisfies Partial<Record<BuiltinControlType, FormControlDefinition>>;
