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

// Core mapping from table columns to MyForm fields.

const searchFields = computed<MyFormField<any>[]>(() =>
  props.columns
    .filter(col => col.search?.el && col.prop != null)
    .sort((a, b) => (a.search!.order ?? 0) - (b.search!.order ?? 0))
    .map((col): MyFormField<any> => {
      // Option priority: search.props.options > col.enum > undefined.
      const searchPropsOptions = (col.search?.props as any)?.options;
      const enumOptions = col.enum
        ? toValue(col.enum).map(({ label, value }): OptionItem => ({
            label,
            value,
          }))
        : undefined;

      // Remove options from search.props to avoid passing them twice to MyForm.
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
      };
    }),
);

const isCompactKeywordSearch = computed(() =>
  searchFields.value.length === 1 && searchFields.value[0]?.el === 'el-input',
);

const compactSearchField = computed(() => searchFields.value[0]);

// Transforming search values here keeps MyForm and the renderer agnostic.

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
    This template stays intentionally small.
    It switches between a compact toolbar and a full search form based on
    how many searchable columns are present.
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
      <el-button class="search-toolbar__search" :size="size" type="primary" :loading="loading" @click="onSearch">
        <icon-mdi:magnify class="mr-1" />
        {{ t('components.myTable.search') }}
      </el-button>
      <el-button class="search-toolbar__reset" :size="size" :aria-label="t('components.myTable.reset')" @click="onReset">
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
        <el-button class="search-panel__action" :size="size" type="primary" :loading="loading" @click="onSearch">
          <icon-mdi:magnify class="mr-1" />
          {{ t('components.myTable.search') }}
        </el-button>
        <el-button class="search-panel__action" :size="size" @click="onReset">
          <icon-mdi:restore class="mr-1" />
          {{ t('components.myTable.reset') }}
        </el-button>
      </div>
    </template>
  </template>
</template>

<style scoped>
.search-toolbar {
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  flex-wrap: nowrap;
  min-width: 0;
  padding: 0.15rem 0;
}

.search-toolbar__input {
  width: clamp(220px, 28vw, 320px);
  flex: 0 1 320px;
  min-width: 220px;
}

.search-toolbar__search {
  flex: 0 0 auto;
}

.search-toolbar__reset {
  flex: 0 0 auto;
  padding-inline: 0.9rem;
}

.search-panel__footer {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 8px;
  padding-top: 8px;
}

@media (max-width: 640px) {
  .search-toolbar {
    width: 100%;
    align-items: stretch;
    flex-wrap: wrap;
  }

  .search-toolbar__input {
    flex-basis: 100%;
    width: 100%;
  }

  .search-toolbar__search {
    flex: 1 1 auto;
  }
}
</style>
