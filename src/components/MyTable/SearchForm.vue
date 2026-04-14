<script setup lang="ts" generic="T extends Record<string, any>">
import type { MyTableColumn } from '~/composables/table';
import type { MyFormField, OptionItem } from '~/composables/useMyForm';
import { computed, toValue } from 'vue';
import { useI18n } from 'vue-i18n';
import MyForm from '~/components/MyForm/index.vue';
import { applySearchTransform } from '~/composables/table';

interface Props {
  columns: MyTableColumn<T>[];
  defaultSpan?: number;
  loading?: boolean;
  size?: App.ThemeSettings['general']['tableSize'];
}

const props = withDefaults(defineProps<Props>(), {
  defaultSpan: 6,
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

const compactSearchField = computed(() => searchFields.value[0]);

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
    根据搜索字段数量切换为 compact 工具栏或多字段表单面板。
    完全没有 <component :is>、<el-option>、placeholder 生成等渲染逻辑。
  -->
  <template v-if="searchFields.length > 0">
    <div
      v-if="isCompactKeywordSearch"
      class="search-toolbar"
    >
      <el-input
        v-model="searchParam[compactSearchField!.prop]"
        :size="size"
        class="search-toolbar__input"
        clearable
        :placeholder="compactSearchField?.placeholder || t('components.myForm.pleaseInput', { label: compactSearchField?.label })"
        @keyup.enter="onSearch"
        @clear="onSearch"
      />
      <el-button :size="size" type="primary" :loading="loading" @click="onSearch">
        <icon-mdi:magnify class="mr-1" />
        {{ t('components.myTable.search') }}
      </el-button>
      <el-button :size="size" @click="onReset">
        <icon-mdi:restore />
      </el-button>
    </div>

    <template v-else>
      <MyForm
        v-model="searchParam"
        :fields="searchFields"
        label-position="top"
        label-width="auto"
        :gutter="12"
      />
      <div class="search-panel__footer">
        <el-button :size="size" type="primary" :loading="loading" @click="onSearch">
          <icon-mdi:magnify class="mr-1" />
          {{ t('components.myTable.search') }}
        </el-button>
        <el-button :size="size" @click="onReset">
          <icon-mdi:restore class="mr-1" />
          {{ t('components.myTable.reset') }}
        </el-button>
      </div>
    </template>
  </template>
</template>

<style scoped>
.search-toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: nowrap;
}

.search-toolbar__input {
  width: 260px;
}

.search-panel__footer {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 8px;
  padding-top: 4px;
}
</style>
