<script setup lang="ts" generic="T extends Record<string, any>">
/**
 * MyForm is a configuration-driven form wrapper.
 * It owns validation rules, visibility and dependency links, form-wide disable
 * state, and responsive grid layout.
 */
import type { ElForm, FormInstance, FormRules } from 'element-plus';
import type { MyFormField } from '~/composables/useMyForm';
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import FieldRenderer from '~/components/FieldRenderer/index.vue';

type ElFormProps = InstanceType<typeof ElForm>['$props'];

interface Props extends /* @vue-ignore */ ElFormProps {
  fields: MyFormField<T>[];
  labelWidth?: string | number;
  labelPosition?: 'left' | 'right' | 'top';
  rules?: FormRules | undefined;
  gutter?: number;
}

const props = withDefaults(defineProps<Props>(), {
  labelWidth: '100px',
  labelPosition: 'right',
  gutter: 16,
});

const formData = defineModel<Partial<T>>('modelValue', { required: true });
const formRef = ref<FormInstance | null>(null);

const { t } = useI18n();

defineExpose({
  validate: () => formRef.value?.validate(),
  clearValidate: (props?: string | string[]) => formRef.value?.clearValidate(props),
  resetFields: (props?: string | string[]) => formRef.value?.resetFields(props),
});

function getPlaceholder(field: MyFormField<T>): string {
  if (field.placeholder)
    return field.placeholder;
  return ['el-input', 'el-input-number'].includes(field.el)
    ? t('components.myForm.pleaseInput', { label: field.label })
    : t('components.myForm.pleaseSelect', { label: field.label });
}

function getDisabled(field: MyFormField<T>): boolean {
  if (props.disabled)
    return true;
  if (typeof field.disabled === 'function')
    return field.disabled(formData.value ?? {});
  return field.disabled ?? false;
}

function getTooltipContent(field: MyFormField<T>): string {
  if (!field.tooltip)
    return '';
  return typeof field.tooltip === 'string' ? field.tooltip : field.tooltip.content;
}

function getTooltipPlacement(field: MyFormField<T>): string {
  if (!field.tooltip || typeof field.tooltip === 'string')
    return 'top';
  return field.tooltip.placement ?? 'top';
}

/**
 * Maps a numeric column span to responsive el-col breakpoint props.
 * Allows forms to gracefully collapse from multi-column to fewer columns
 * on narrower viewports without any per-field configuration.
 * Object spans are passed through as-is, giving callers full control.
 */
function getColProps(span: MyFormField<T>['span']): Record<string, number> {
  if (typeof span === 'object' && span !== null)
    return span as Record<string, number>;
  if (span === undefined || span === 24)
    return { span: 24 };
  switch (span) {
    case 6: return { xl: 6, lg: 6, md: 8, sm: 12, xs: 24 };
    case 8: return { xl: 8, lg: 8, md: 12, sm: 24, xs: 24 };
    case 12: return { xl: 12, lg: 12, md: 12, sm: 24, xs: 24 };
    case 16: return { xl: 16, lg: 16, md: 24, sm: 24, xs: 24 };
    default: return { span };
  }
}
</script>

<template>
  <el-form
    ref="formRef"
    :model="formData"
    :label-width="labelWidth"
    :label-position="labelPosition"
    :rules="rules"
  >
    <el-row :gutter="gutter">
      <el-col
        v-for="field in fields"
        :key="field.prop"
        v-bind="getColProps(field.span)"
      >
        <el-form-item
          :prop="field.prop"
        >
          <template #label>
            <span class="inline-flex" style="align-items: center; gap: 4px;">
              <span>{{ field.label }}</span>
              <el-tooltip
                v-if="getTooltipContent(field)"
                :content="getTooltipContent(field)"
                :placement="getTooltipPlacement(field)"
              >
                <span class="inline-flex" style="align-items: center; color: var(--el-color-info); cursor: help;">
                  <el-icon :size="14">
                    <icon-mdi:help-circle-outline />
                  </el-icon>
                </span>
              </el-tooltip>
            </span>
          </template>
          <FieldRenderer
            v-model="(formData as any)[field.prop]"
            :el="field.el"
            :prop-name="field.prop"
            :options="field.options"
            :component-props="field.props"
            :disabled="getDisabled(field)"
            :placeholder="getPlaceholder(field)"
            :is-view-mode="Boolean(props.disabled)"
            @change="(val: any) => field.onChange?.(val, formData ?? {})"
          >
            <template #[field.prop]="scope">
              <slot :name="field.prop" :model="formData" v-bind="scope" />
            </template>
          </FieldRenderer>
        </el-form-item>
      </el-col>

      <slot name="row-append" />
    </el-row>
  </el-form>
</template>
