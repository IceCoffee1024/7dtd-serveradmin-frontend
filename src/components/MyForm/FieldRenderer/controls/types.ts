import type { Component } from 'vue';

/**
 * Built-in Element Plus control names that MyForm can resolve directly.
 * The `el-` prefix keeps these keys visually distinct from custom controls.
 */
export type BuiltinControlType = 'el-input' | 'el-input-number' | 'el-select' | 'el-date-picker' | 'el-switch' | 'el-radio-group' | 'el-checkbox-group';

/**
 * Project-owned controls that are loaded separately from the Element Plus map.
 */
export type CustomControlType = 'upload';

/**
 * All control keys accepted by the MyForm renderer layer.
 */
export type FormControlType = BuiltinControlType | CustomControlType;

/**
 * Minimal definition shared by all resolved controls.
 * MyForm only needs a component reference and an optional options flag.
 */
export interface FormControlDefinition {
  component: Component;
  supportsOptions?: boolean;
}
