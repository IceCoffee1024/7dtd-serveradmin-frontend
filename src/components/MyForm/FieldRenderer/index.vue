<script setup lang="ts">
import type { Component, MaybeRef } from 'vue';
import type { FormControlType } from './controls/types.ts';
import type { FormElType, OptionItem } from '~/composables/useMyForm';
/**
 * MyFieldRenderer renders the correct form control for a field schema.
 * It keeps the field contract, option handling, and slot escape hatch in one place.
 */
import { toValue } from 'vue';
import { resolveFormControl } from './controls/resolveControl.ts';

defineOptions({ inheritAttrs: false });

withDefaults(defineProps<Props>(), {
  disabled: false,
  isViewMode: false,
  placeholder: '',
  componentProps: () => ({}),
  options: () => [],
});

const emits = defineEmits<{
  /** Emits value changes so MyForm can run field-level change handlers. */
  change: [val: any];
}>();

// ─────────────────────────────────────────────────────────────────────────────
// Props & Model
// ─────────────────────────────────────────────────────────────────────────────
interface Props {
  /** Control key declared in the schema. */
  el: FormElType;
  /** Field property name used to keep custom slot names unique. */
  propName: string;
  /** Native props forwarded to the resolved control component. */
  componentProps?: Record<string, any>;
  /** Normalized options for select, radio, and checkbox style controls. */
  options?: MaybeRef<OptionItem[]>;
  /** Placeholder text shown by input-style controls. */
  placeholder?: string;
  /** Disables the rendered control when true. */
  disabled?: boolean;
  /** Read-only view mode forwarded to slot content. */
  isViewMode?: boolean;
}

// Vue 3.4+ model binding keeps the renderer lean and declarative.
const modelValue = defineModel<any>();

// ─────────────────────────────────────────────────────────────────────────────
// Type guards and helpers
// ─────────────────────────────────────────────────────────────────────────────
const OPTIONS_EL_TYPES = ['el-select', 'el-radio-group', 'el-checkbox-group'] as const;
type OptionsElType = typeof OPTIONS_EL_TYPES[number];

function isSlotControl(el: FormElType): boolean {
  return el === 'custom';
}

function isResolvableControl(el: FormElType): el is FormControlType {
  return el !== 'custom';
}

function isOptionsType(el: FormElType): el is OptionsElType {
  return (OPTIONS_EL_TYPES as readonly string[]).includes(el)
    || (isResolvableControl(el) && resolveFormControl(el)?.supportsOptions === true);
}

/** Throws early when the schema references an unsupported control key. */
function getStandardComponent(el: FormElType): Component {
  if (!isResolvableControl(el)) {
    throw new Error(`[MyFieldRenderer] Unsupported control type: ${el}`);
  }

  const control = resolveFormControl(el);

  if (!control?.component) {
    throw new Error(`[MyFieldRenderer] Unsupported control type: ${el}`);
  }

  return control.component;
}
</script>

<template>
  <slot
    v-if="isSlotControl(el)"
    :name="propName"
    :model-value="modelValue"
    :disabled="disabled"
    :is-view-mode="isViewMode"
  />

  <component
    :is="getStandardComponent(el)"
    v-else-if="isOptionsType(el)"
    v-model="modelValue"
    :disabled="disabled"
    :placeholder="placeholder"
    v-bind="componentProps"
    class="w-full"
    @change="(val: any) => emits('change', val)"
  >
    <template v-if="el === 'el-select'">
      <el-option
        v-for="opt in toValue(options ?? [])"
        :key="opt.value"
        :label="opt.label"
        :value="opt.value"
        :disabled="opt.disabled"
      />
    </template>
    <template v-else-if="el === 'el-radio-group'">
      <el-radio-button
        v-for="opt in toValue(options ?? [])"
        :key="opt.value"
        :value="opt.value"
        :disabled="opt.disabled"
      >
        {{ opt.label }}
      </el-radio-button>
    </template>
    <template v-else-if="el === 'el-checkbox-group'">
      <el-checkbox
        v-for="opt in toValue(options ?? [])"
        :key="opt.value"
        :value="opt.value"
        :disabled="opt.disabled"
      >
        {{ opt.label }}
      </el-checkbox>
    </template>
  </component>

  <component
    :is="getStandardComponent(el)"
    v-else
    v-model="modelValue"
    :disabled="disabled"
    :placeholder="placeholder"
    v-bind="componentProps"
    clearable
    class="w-full"
    @update:model-value="(val: any) => emits('change', val)"
  />
</template>
