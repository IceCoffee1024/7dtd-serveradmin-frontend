<script setup lang="ts" generic="T extends Record<string, any>">
import type { MyFormField, OptionItem } from '~/composables/useMyForm';
import type { MyTableColumn } from '~/composables/useMyTable';
import { computed, toValue } from 'vue';
import { useI18n } from 'vue-i18n';
import MyForm from '~/components/MyForm/index.vue';
import { applySearchTransform } from '~/composables/useMyTable';

interface Props {
  columns: MyTableColumn<T>[];
  defaultSpan?: number;
  labelWidth?: string | number;
  loading?: boolean;
  size?: App.ThemeSettings['general']['tableSize'];
}

const props = withDefaults(defineProps<Props>(), {
  defaultSpan: 6,
  labelWidth: '100px',
  loading: false,
  size: 'default',
});

const emits = defineEmits<{
  search: [transformedParam: Record<string, any>];
  reset: [];
}>();

const { t } = useI18n();

const searchParam = defineModel<Record<string, any>>('modelValue', {
  default: () => ({}),
});

// ── 核心：columns → MyFormField[] 转换 ───────────────────────────────────────

const searchFields = computed<MyFormField<any>[]>(() =>
  props.columns
    .filter(col => col.search?.el && col.prop != null)
    .sort((a, b) => (a.search!.order ?? 0) - (b.search!.order ?? 0))
    .map((col): MyFormField<any> => {
      // options 优先级：search.props.options > col.enum > undefined
      const searchPropsOptions = (col.search?.props as any)?.options;
      const enumOptions = col.enum
        ? toValue(col.enum).map(({ label, value }): OptionItem => ({
            label,
            value,
          }))
        : undefined;

      // 过滤掉 search.props 中的 options，避免与顶层 options 重复传入 MyFieldRenderer
      const { options: _removed, ...restProps } = (col.search?.props ?? {}) as any;

      return {
        prop: col.prop as string,
        label: col.label,
        el: col.search!.el,
        tooltip: col.search?.tooltip,
        props: {
          size: props.size,
          ...restProps,
        },
        options: searchPropsOptions ?? enumOptions,
        span: col.search!.span ?? props.defaultSpan,
        rules: [],
      };
    }),
);

const isCompactKeywordSearch = computed(() =>
  searchFields.value.length === 1 && searchFields.value[0]?.el === 'input',
);

const compactSearchField = computed(() => searchFields.value[0] ?? null);

// ── transform 在适配器层执行，MyForm / MyFieldRenderer 对此无感知 ─────────────

function onSearch() {
  const transformed = applySearchTransform(props.columns, searchParam.value);
  emits('search', transformed);
}

function onReset() {
  emits('reset');
}
</script>

<template>
  <!--
    MySearchForm 的模板只有这些：
    调用 MyForm，在 row-append 插槽里注入搜索/重置按钮。
    完全没有 <component :is>、<el-option>、placeholder 生成等渲染逻辑。
  -->
  <template v-if="searchFields.length > 0">
    <div
      v-if="isCompactKeywordSearch"
      class="search-toolbar"
    >
      <div class="search-toolbar__field">
        <span class="search-toolbar__label">
          {{ compactSearchField?.label }}
        </span>
        <el-input
          v-model="searchParam[compactSearchField!.prop]"
          :size="size"
          class="search-toolbar__input"
          clearable
          :placeholder="compactSearchField?.placeholder || t('components.myForm.pleaseInput', { label: compactSearchField?.label })"
        />
        <div class="search-toolbar__actions">
          <el-button :size="size" type="primary" :loading="loading" @click="onSearch">
            <icon-mdi:magnify class="mr-1" />
            {{ t('components.myTable.search') }}
          </el-button>
          <el-button :size="size" @click="onReset">
            <icon-mdi:restore class="mr-1" />
            {{ t('components.myTable.reset') }}
          </el-button>
        </div>
      </div>
    </div>

    <MyForm
      v-else
      v-model="searchParam"
      :fields="searchFields"
      :label-width="labelWidth"
      :gutter="20"
    >
      <template #row-append>
        <el-col
          :span="6"
          :xs="24"
          :sm="12"
          :md="8"
          :lg="6"
          class="search-actions"
        >
          <el-button :size="size" type="primary" :loading="loading" @click="onSearch">
            <icon-mdi:magnify class="mr-1" />
            {{ t('components.myTable.search') }}
          </el-button>
          <el-button :size="size" @click="onReset">
            <icon-mdi:restore class="mr-1" />
            {{ t('components.myTable.reset') }}
          </el-button>
        </el-col>
      </template>
    </MyForm>
  </template>
</template>

<style scoped>
.search-toolbar {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 12px;
  flex-wrap: wrap;
}

.search-toolbar__field {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
  flex: 1 1 420px;
}

.search-toolbar__label {
  flex: 0 0 auto;
  color: var(--el-text-color-regular);
  font-size: 14px;
  white-space: nowrap;
}

.search-toolbar__input {
  max-width: 340px;
  min-width: 240px;
  flex: 1 1 340px;
}

.search-toolbar__actions {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 8px;
  flex: 0 0 auto;
}

.search-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
}
</style>
