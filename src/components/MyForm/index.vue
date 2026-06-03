<script setup lang="ts" generic="T extends Record<string, any>">
/**
 * MyForm is a configuration-driven form wrapper.
 * It owns validation rules, visibility and dependency links, form-wide disable
 * state, and responsive grid layout.
 */
import type { ElForm, ElTooltip, FormInstance, FormRules } from 'element-plus';
import type { MyFormField } from '~/composables/useMyForm';
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import FieldRenderer from '~/components/FieldRenderer/index.vue';

type ElFormProps = InstanceType<typeof ElForm>['$props'];
type ElTooltipProps = InstanceType<typeof ElTooltip>['$props'];

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

function getTooltipPlacement(field: MyFormField<T>): ElTooltipProps['placement'] {
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
    class="my-form"
    :model="formData"
    :label-width="labelWidth"
    :label-position="labelPosition"
    :rules="rules"
  >
    <el-row :gutter="gutter">
      <el-col
        v-for="field in fields"
        :key="field.prop"
        class="my-form__col"
        v-bind="getColProps(field.span)"
      >
        <el-form-item
          class="my-form__item"
          :prop="field.prop"
        >
          <template #label>
            <span class="my-form__label">
              <span>{{ field.label }}</span>
              <el-tooltip
                v-if="getTooltipContent(field)"
                :content="getTooltipContent(field)"
                :placement="getTooltipPlacement(field)"
              >
                <span class="my-form__label-help">
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

<style scoped lang="scss">
.my-form {
  --my-form-control-bg: color-mix(in srgb, var(--el-bg-color) 96%, white 4%);
  --my-form-control-border: color-mix(in srgb, var(--el-border-color) 72%, var(--el-bg-color) 28%);
  --my-form-control-border-hover: color-mix(in srgb, var(--colors-primary) 34%, var(--el-border-color) 66%);
  --my-form-control-focus-ring: color-mix(in srgb, var(--colors-primary) 18%, transparent);
  --my-form-control-shadow: 0 0 0 1px var(--my-form-control-border) inset, 0 1px 2px rgba(15, 23, 42, 0.04);

  :deep(.el-form-item) {
    margin-bottom: 1rem;
  }

  :deep(.el-form-item__label) {
    color: var(--el-text-color-primary);
    font-weight: 700;
  }

  :deep(.el-input__wrapper),
  :deep(.el-textarea__inner),
  :deep(.el-select__wrapper),
  :deep(.el-date-editor.el-input__wrapper) {
    border-radius: 10px;
    background: var(--my-form-control-bg);
    box-shadow: var(--my-form-control-shadow);
    transition:
      box-shadow 0.2s ease,
      background-color 0.2s ease;
  }

  :deep(.el-input-number) {
    border-radius: 10px;
    overflow: visible;
  }

  :deep(.el-input-number .el-input__wrapper) {
    border-radius: 10px;
  }

  :deep(.el-input-number__decrease) {
    border-radius: 9px 0 0 9px;
    background: color-mix(in srgb, var(--el-fill-color-light) 78%, var(--el-bg-color) 22%);
  }

  :deep(.el-input-number__increase) {
    border-radius: 0 9px 9px 0;
    background: color-mix(in srgb, var(--el-fill-color-light) 78%, var(--el-bg-color) 22%);
  }

  :deep(.el-input__wrapper:hover),
  :deep(.el-select__wrapper:hover),
  :deep(.el-textarea__inner:hover),
  :deep(.el-date-editor.el-input__wrapper:hover) {
    box-shadow:
      0 0 0 1px var(--my-form-control-border-hover) inset,
      0 2px 6px rgba(15, 23, 42, 0.05);
  }

  :deep(.el-input.is-focus .el-input__wrapper),
  :deep(.el-input__wrapper.is-focus),
  :deep(.el-select__wrapper.is-focused),
  :deep(.el-textarea__inner:focus),
  :deep(.el-textarea__inner:focus-visible),
  :deep(.el-date-editor.el-input__wrapper.is-focus) {
    box-shadow:
      0 0 0 1px var(--colors-primary) inset,
      0 0 0 3px var(--my-form-control-focus-ring);
  }

  :deep(.el-input.is-disabled .el-input__wrapper),
  :deep(.el-input-number.is-disabled .el-input__wrapper),
  :deep(.el-select__wrapper.is-disabled),
  :deep(.el-textarea__inner:disabled) {
    background: color-mix(in srgb, var(--el-fill-color-light) 72%, var(--el-bg-color) 28%);
    box-shadow: 0 0 0 1px color-mix(in srgb, var(--el-border-color-light) 82%, transparent) inset;
  }

  :deep(.el-form-item.is-error .el-input__wrapper),
  :deep(.el-form-item.is-error .el-select__wrapper),
  :deep(.el-form-item.is-error .el-textarea__inner),
  :deep(.el-form-item.is-error .el-date-editor.el-input__wrapper) {
    box-shadow:
      0 0 0 1px var(--el-color-danger) inset,
      0 0 0 3px color-mix(in srgb, var(--el-color-danger) 14%, transparent);
  }

  :deep(.el-form-item__error) {
    padding-top: 0.25rem;
    font-size: 0.75rem;
  }
}

.my-form__label {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.my-form__label-help {
  display: inline-flex;
  align-items: center;
  color: var(--el-color-info);
  cursor: help;
}

.my-form__col {
  min-width: 0;
}
</style>
