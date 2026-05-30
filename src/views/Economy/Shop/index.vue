<script setup lang="ts">
import type { FormRules } from 'element-plus';
import type { MyTableColumn, MyTableFetchParams, MyTableFetchResult } from '~/composables/table';
import type { MyFormField } from '~/composables/useMyForm';
import type {
  EconomyShopItemDto,
  EconomyShopItemQueryOrder,
  EconomyUpsertShopItemRequestDto,
} from '~/generated/api/types.gen';
import { useMutation, useQueryCache } from '@pinia/colada';
import { useI18n } from 'vue-i18n';
import MyDialog from '~/components/MyDialog/index.vue';
import MyForm from '~/components/MyForm/index.vue';
import { usePopup } from '~/composables';
import {
  economyShopCreateItemMutation,
  economyShopDeleteItemMutation,
  economyShopGetItemsQuery,
  economyShopUpdateItemMutation,
  gameServerGetGameItemsQuery,
} from '~/generated/api/@pinia/colada.gen';
import v from '~/plugins/valibot';
import { invalidateEconomyShopQueries } from '~/queries/economy';
import { generateElementRules } from '~/utils';

defineOptions({ name: 'EconomyShopPage' });

interface FormExpose {
  validate: () => Promise<boolean | undefined>;
  clearValidate: (props?: string | string[]) => void;
}

interface FormModel {
  name: string;
  description: string;
  itemName: string;
  itemCount: number;
  price: number;
  isEnabled: boolean;
  displayOrder: number;
  stockLimit: number;
}

const { t } = useI18n();
const { toast, confirm } = usePopup();
const queryCache = useQueryCache();

const tableRef = useTemplateRef('tableRef');
const dialogRef = useTemplateRef('dialogRef');
const formRef = useTemplateRef<FormExpose>('formRef');

const editingId = ref<number | null>(null);
const createItemMutation = useMutation({
  ...economyShopCreateItemMutation(),
  async onSettled() {
    await invalidateEconomyShopQueries();
  },
});
const updateItemMutation = useMutation({
  ...economyShopUpdateItemMutation(),
  async onSettled() {
    await invalidateEconomyShopQueries();
  },
});
const deleteItemMutation = useMutation({
  ...economyShopDeleteItemMutation(),
  async onSettled() {
    await invalidateEconomyShopQueries();
  },
});
const isSubmitting = computed(() => createItemMutation.isLoading.value || updateItemMutation.isLoading.value);

interface GameItemOption {
  value: string;
  label: string;
}

const gameItemOptions = ref<GameItemOption[]>([]);
const itemOptionsLoading = ref(false);

async function loadGameItems() {
  if (gameItemOptions.value.length > 0)
    return;
  itemOptionsLoading.value = true;
  try {
    const options = gameServerGetGameItemsQuery();
    const entry = queryCache.ensure(options);
    const state = await queryCache.fetch(entry);

    if (state.status === 'error') {
      throw state.error;
    }

    const items = state.data ?? [];
    gameItemOptions.value = items.map(item => ({
      value: item.name,
      label: item.localizedName ? `${item.localizedName}  (${item.name})` : item.name,
    }));
  }
  finally {
    itemOptionsLoading.value = false;
  }
}

function buildDefaults(): FormModel {
  return {
    name: '',
    description: '',
    itemName: '',
    itemCount: 1,
    price: 0,
    isEnabled: true,
    displayOrder: 0,
    stockLimit: 0,
  };
}

const form = reactive<FormModel>(buildDefaults());

const schema = v.object({
  name: v.pipe(v.string(), v.minLength(1)),
  description: v.optional(v.string()),
  itemName: v.pipe(v.string(), v.minLength(1)),
  itemCount: v.pipe(v.number(), v.minValue(1)),
  price: v.pipe(v.number(), v.minValue(0)),
  isEnabled: v.boolean(),
  displayOrder: v.pipe(v.number(), v.minValue(0)),
  stockLimit: v.pipe(v.number(), v.minValue(0)),
});

const rules: FormRules = generateElementRules(schema);

const booleanOptions = computed(() => [
  { label: t('common.yes'), value: true },
  { label: t('common.no'), value: false },
]);

const dialogTitle = computed(() =>
  editingId.value != null
    ? t('views.economy.shop.form.editTitle')
    : t('views.economy.shop.form.addTitle'),
);

const fields = computed<MyFormField<FormModel>[]>(() => [
  {
    prop: 'name',
    label: t('views.economy.shop.form.fields.name'),
    el: 'el-input',
    span: { xs: 24, md: 12 },
  },
  {
    prop: 'itemName',
    label: t('views.economy.shop.form.fields.itemName'),
    el: 'custom',
    span: { xs: 24, md: 12 },
  },
  {
    prop: 'description',
    label: t('views.economy.shop.form.fields.description'),
    el: 'el-input',
    props: { type: 'textarea', rows: 2 },
    span: { xs: 24 },
  },
  {
    prop: 'itemCount',
    label: t('views.economy.shop.form.fields.itemCount'),
    el: 'el-input-number',
    props: { min: 1, precision: 0, class: 'w-full' },
    span: { xs: 24, md: 12 },
  },
  {
    prop: 'price',
    label: t('views.economy.shop.form.fields.price'),
    el: 'el-input-number',
    props: { min: 0, precision: 0, class: 'w-full' },
    span: { xs: 24, md: 12 },
  },
  {
    prop: 'stockLimit',
    label: t('views.economy.shop.form.fields.stockLimit'),
    el: 'el-input-number',
    props: { min: 0, precision: 0, class: 'w-full' },
    span: { xs: 24, md: 12 },
  },
  {
    prop: 'displayOrder',
    label: t('views.economy.shop.form.fields.displayOrder'),
    el: 'el-input-number',
    props: { min: 0, precision: 0, class: 'w-full' },
    span: { xs: 24, md: 12 },
  },
  {
    prop: 'isEnabled',
    label: t('views.economy.shop.form.fields.isEnabled'),
    el: 'el-select',
    options: booleanOptions.value,
    span: { xs: 24, md: 12 },
  },
]);

const columns = computed<MyTableColumn<EconomyShopItemDto>[]>(() => [
  {
    prop: 'keyword',
    label: t('components.myTable.keywordSearch'),
    show: false,
    exportable: false,
    search: {
      el: 'el-input',
      props: { clearable: true },
    },
  },
  {
    prop: 'name',
    label: t('views.economy.shop.columns.name'),
    sortable: true,
  },
  {
    prop: 'itemName',
    label: t('views.economy.shop.columns.itemName'),
    sortable: true,
  },
  {
    prop: 'itemCount',
    label: t('views.economy.shop.columns.itemCount'),
  },
  {
    prop: 'price',
    label: t('views.economy.shop.columns.price'),
    slot: 'price',
    sortable: true,
  },
  {
    prop: 'isEnabled',
    label: t('views.economy.shop.columns.isEnabled'),
    slot: 'isEnabled',
    search: {
      el: 'el-select',
      options: [
        { label: t('common.yes'), value: true },
        { label: t('common.no'), value: false },
      ],
      props: { clearable: true },
      order: 1,
      span: 8,
    },
  },
  {
    prop: 'displayOrder',
    label: t('views.economy.shop.columns.displayOrder'),
    sortable: true,
  },
  {
    prop: 'stockLimit',
    label: t('views.economy.shop.columns.stockLimit'),
  },
  {
    prop: 'soldCount',
    label: t('views.economy.shop.columns.soldCount'),
    sortable: true,
  },
]);

function toOrder(sortField: string | undefined): EconomyShopItemQueryOrder | undefined {
  switch (sortField) {
    case 'name': return 'Name';
    case 'price': return 'Price';
    case 'displayOrder': return 'DisplayOrder';
    case 'createdAt': return 'CreatedAt';
    default: return undefined;
  }
}

async function fetchData(params: MyTableFetchParams): Promise<MyTableFetchResult<EconomyShopItemDto>> {
  const options = economyShopGetItemsQuery({
    query: {
      pageNumber: params.pageNumber,
      pageSize: params.pageSize,
      keyword: params.search?.keyword?.trim() || undefined,
      isEnabled: typeof params.search?.isEnabled === 'boolean' ? params.search.isEnabled : undefined,
      order: toOrder(params.sortField),
      desc: params.sortOrder === 'descending',
    },
  });
  const entry = queryCache.ensure(options);
  const state = await queryCache.fetch(entry);

  if (state.status === 'error') {
    throw state.error;
  }

  const response = state.data;

  return { list: response?.items ?? [], total: response?.total ?? 0 };
}

function openAdd() {
  editingId.value = null;
  Object.assign(form, buildDefaults());
  loadGameItems();
  dialogRef.value?.open();
  nextTick(() => formRef.value?.clearValidate());
}

function openEdit(row: EconomyShopItemDto) {
  if (row.id == null) {
    return;
  }

  loadGameItems();
  editingId.value = row.id;
  form.name = row.name;
  form.description = row.description ?? '';
  form.itemName = row.itemName;
  form.itemCount = row.itemCount ?? 1;
  form.price = row.price ?? 0;
  form.isEnabled = row.isEnabled ?? true;
  form.displayOrder = row.displayOrder ?? 0;
  form.stockLimit = row.stockLimit ?? 0;
  dialogRef.value?.open();
  nextTick(() => formRef.value?.clearValidate());
}

async function onConfirm(): Promise<boolean | void> {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) {
    return false;
  }

  try {
    const payload: EconomyUpsertShopItemRequestDto = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      itemName: form.itemName.trim(),
      itemCount: Number(form.itemCount),
      price: Number(form.price),
      isEnabled: form.isEnabled,
      displayOrder: Number(form.displayOrder),
      stockLimit: Number(form.stockLimit),
    };

    if (editingId.value != null) {
      await updateItemMutation.mutateAsync({ path: { id: editingId.value }, body: payload });
      toast({ type: 'success', text: t('views.economy.shop.messages.updateSuccess') });
    }
    else {
      await createItemMutation.mutateAsync({ body: payload });
      toast({ type: 'success', text: t('views.economy.shop.messages.createSuccess') });
    }
    tableRef.value?.reload();
  }
  catch (error) {
    console.error(error);
    return false;
  }
}

async function onDelete(row: EconomyShopItemDto) {
  if (row.id == null) {
    return;
  }

  const confirmed = await confirm({
    text: t('views.economy.shop.actions.deleteConfirm'),
    type: 'warning',
  });
  if (!confirmed) {
    return;
  }

  try {
    await deleteItemMutation.mutateAsync({ path: { id: row.id } });
    toast({ type: 'success', text: t('views.economy.shop.messages.deleteSuccess') });
    tableRef.value?.reload();
  }
  catch (error) {
    console.error(error);
  }
}
</script>

<template>
  <div>
    <MyTable
      ref="tableRef"
      row-key="id"
      :columns="columns"
      :fetch-data="fetchData"
      :selectable="false"
      :operation-column-width="160"
      :auto-column-width="true"
      :search-collapsible="true"
      @add="openAdd"
    >
      <template #price="{ row }">
        <span class="text-amber-600 font-semibold dark:text-amber-400">{{ row.price }}</span>
      </template>

      <template #isEnabled="{ row }">
        <el-tag :type="row.isEnabled ? 'success' : 'info'">
          {{ row.isEnabled ? t('common.yes') : t('common.no') }}
        </el-tag>
      </template>

      <template #operation="{ row }">
        <div class="flex gap-2 justify-center">
          <el-button size="small" plain @click="openEdit(row)">
            {{ t('views.economy.shop.actions.edit') }}
          </el-button>
          <el-button size="small" plain type="danger" @click="onDelete(row)">
            {{ t('views.economy.shop.actions.delete') }}
          </el-button>
        </div>
      </template>
    </MyTable>

    <MyDialog
      ref="dialogRef"
      :title="dialogTitle"
      :loading="isSubmitting"
      :on-confirm="onConfirm"
    >
      <MyForm
        ref="formRef"
        v-model="form"
        :fields="fields"
        :rules="rules"
        label-position="top"
        label-width="auto"
        :gutter="16"
      >
        <template #itemName>
          <el-select-v2
            v-model="form.itemName"
            :options="gameItemOptions"
            :loading="itemOptionsLoading"
            filterable
            clearable
            class="w-full"
            :placeholder="t('views.economy.shop.form.fields.itemName')"
          />
        </template>
      </MyForm>
    </MyDialog>
  </div>
</template>
