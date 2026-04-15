import type { UploadProps } from 'element-plus';
import type { Component } from 'vue';

import { defineAsyncComponent } from 'vue';

/**
 * Runtime metadata shared by all form controls.
 * MyForm only needs a component reference and an optional options hint.
 */
export interface FormControlDefinition {
  component: Component;
  supportsOptions?: boolean;
}

const builtinControls = {
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
} as const satisfies Record<string, FormControlDefinition>;

const customControls = {
  upload: {
    component: defineAsyncComponent(() => import('../MyForm/UploadField/index.vue')),
  },
} as const satisfies Record<string, FormControlDefinition>;

/**
 * Built-in Element Plus control names that MyForm resolves directly.
 * The `el-` prefix keeps these keys distinct from project-specific controls.
 */
export type BuiltinControlType = keyof typeof builtinControls;

/**
 * Project-owned controls that are loaded separately from the Element Plus map.
 */
export type CustomControlType = keyof typeof customControls;

/**
 * All control keys accepted by the renderer layer.
 */
export type FormControlType = BuiltinControlType | CustomControlType;

/**
 * Schema-level control keys accepted by MyForm.
 * The `custom` branch is a slot escape hatch rather than a rendered component.
 */
export type FormElType = FormControlType | 'custom';

type BuiltinControlPropsMap = {
  [K in BuiltinControlType]: Partial<InstanceType<(typeof builtinControls)[K]['component']>['$props']>;
};

/**
 * Field props keyed by control type.
 * Built-in controls derive directly from the Element Plus component props so the
 * schema stays aligned when a control is added or changed.
 */
export type FormElPropsMap = BuiltinControlPropsMap & {
  upload: Partial<UploadProps>;
  custom: Record<string, unknown>;
};

export const controlRegistry = {
  ...builtinControls,
  ...customControls,
} as const satisfies Record<FormControlType, FormControlDefinition>;

/**
 * Resolves a control key to its runtime component definition.
 * Built-in Element Plus controls are checked first, then project custom controls.
 * @param type - Control key declared in the field schema.
 * @returns The resolved control definition, or `undefined` when the key is unknown.
 */
export function resolveFormControl(type: FormControlType): FormControlDefinition | undefined {
  return controlRegistry[type];
}
