<script setup lang="ts">
import type { Component, MaybeRef } from 'vue';
import type { FormElType, OptionItem } from '~/composables/useMyForm';
/**
 * MyFieldRenderer —— 表单控件渲染引擎
 * 职责：接收组件类型 + props + options，输出一个完整的 Element Plus 控件。
 */
import { toValue } from 'vue';
import { FORM_COMPONENT_MAP } from '~/composables/useMyForm';

defineOptions({ inheritAttrs: false });

withDefaults(defineProps<Props>(), {
  disabled: false,
  isViewMode: false,
  placeholder: '',
  componentProps: () => ({}),
  options: () => [],
});

const emits = defineEmits<{
  /** 值变更事件，供上层（MyForm）执行 onChange 联动 */
  change: [val: any];
}>();

// ─────────────────────────────────────────────────────────────────────────────
// Props & Model
// ─────────────────────────────────────────────────────────────────────────────
interface Props {
  /** 组件类型，对应 FORM_COMPONENT_MAP 的键 */
  el: FormElType;
  /** 字段的 prop 名称，极其关键！用于保证 custom 插槽名称的唯一性 */
  propName: string;
  /** 透传给具体组件的原生 props，由上层 Schema 提供 */
  componentProps?: Record<string, any>;
  /** 下拉/单选/多选的选项数据 */
  options?: MaybeRef<OptionItem[]>;
  /** 占位提示文字 */
  placeholder?: string;
  /** 是否禁用 */
  disabled?: boolean;
  /** 是否处于纯只读模式（透传给插槽） */
  isViewMode?: boolean;
}

// 采用 Vue 3.4+ 最佳实践：极其干净的双向绑定
const modelValue = defineModel<any>();

// ─────────────────────────────────────────────────────────────────────────────
// 类型守卫与辅助函数
// ─────────────────────────────────────────────────────────────────────────────
const OPTIONS_EL_TYPES = ['select', 'radio-group', 'checkbox-group'] as const;
type OptionsElType = typeof OPTIONS_EL_TYPES[number];

function isOptionsType(el: FormElType): el is OptionsElType {
  return (OPTIONS_EL_TYPES as readonly string[]).includes(el);
}

function isCustomType(el: FormElType): boolean {
  return el === 'custom' || el === 'upload';
}

/** 消除模板内联 as any 报错的优雅转换器 */
function getStandardComponent(el: FormElType): Component {
  return FORM_COMPONENT_MAP[el as keyof typeof FORM_COMPONENT_MAP] as Component;
}
</script>

<template>
  <slot
    v-if="isCustomType(el)"
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
    <template v-if="el === 'select'">
      <el-option
        v-for="opt in toValue(options ?? [])"
        :key="opt.value"
        :label="opt.label"
        :value="opt.value"
        :disabled="opt.disabled"
      />
    </template>
    <template v-else-if="el === 'radio-group'">
      <el-radio-button
        v-for="opt in toValue(options ?? [])"
        :key="opt.value"
        :value="opt.value"
        :disabled="opt.disabled"
      >
        {{ opt.label }}
      </el-radio-button>
    </template>
    <template v-else-if="el === 'checkbox-group'">
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
