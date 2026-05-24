<script setup lang="ts">
import type { FormRules } from 'element-plus';
import type { MyTableColumn, MyTableFetchParams, MyTableFetchResult } from '~/composables/table';
import type { MyFormField } from '~/composables/useMyForm';
import { useI18n } from 'vue-i18n';
import * as api from '~/api/economy';
import * as gameServerApi from '~/api/gameServer';
import MyDialog from '~/components/MyDialog/index.vue';
import MyForm from '~/components/MyForm/index.vue';
import { usePopup } from '~/composables';
import v from '~/plugins/valibot';
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

const tableRef = useTemplateRef('tableRef');
const dialogRef = useTemplateRef('dialogRef');
const formRef = useTemplateRef<FormExpose>('formRef');

const isSubmitting = ref(false);
const editingId = ref<number | null>(null);

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
    const items = await gameServerApi.getGameItems();
    gameItemOptions.value = items.map(i => ({
      value: i.name,
      label: i.localizedName ? `${i.localizedName}  (${i.name})` : i.name,
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
  editingId.value
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

type ShopItemQueryOrder = API.Economy.ShopItemQueryOrder;

const columns = computed<MyTableColumn<API.Economy.ShopItem>[]>(() => [
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

function toOrder(sortField: string | undefined): ShopItemQueryOrder | undefined {
  switch (sortField) {
    case 'name': return 'Name';
    case 'price': return 'Price';
    case 'displayOrder': return 'DisplayOrder';
    case 'createdAt': return 'CreatedAt';
    default: return undefined;
  }
}

async function fetchData(params: MyTableFetchParams): Promise<MyTableFetchResult<API.Economy.ShopItem>> {
  const response = await api.getShopItems({
    pageNumber: params.pageNumber,
    pageSize: params.pageSize,
    keyword: params.search?.keyword?.trim() || undefined,
    isEnabled: typeof params.search?.isEnabled === 'boolean' ? params.search.isEnabled : undefined,
    order: toOrder(params.sortField),
    desc: params.sortOrder === 'descending',
  });
  return { list: response.items, total: response.total };
}

function openAdd() {
  editingId.value = null;
  Object.assign(form, buildDefaults());
  loadGameItems();
  dialogRef.value?.open();
  nextTick(() => formRef.value?.clearValidate());
}

function openEdit(row: API.Economy.ShopItem) {
  loadGameItems();
  editingId.value = row.id;
  form.name = row.name;
  form.description = row.description ?? '';
  form.itemName = row.itemName;
  form.itemCount = row.itemCount;
  form.price = row.price;
  form.isEnabled = row.isEnabled;
  form.displayOrder = row.displayOrder;
  form.stockLimit = row.stockLimit;
  dialogRef.value?.open();
  nextTick(() => formRef.value?.clearValidate());
}

async function onConfirm(): Promise<boolean | void> {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) {
    return false;
  }

  isSubmitting.value = true;
  try {
    const payload: API.Economy.UpsertShopItemRequest = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      itemName: form.itemName.trim(),
      itemCount: Number(form.itemCount),
      price: Number(form.price),
      isEnabled: form.isEnabled,
      displayOrder: Number(form.displayOrder),
      stockLimit: Number(form.stockLimit),
    };

    if (editingId.value) {
      await api.updateShopItem(editingId.value, payload);
      toast({ type: 'success', text: t('views.economy.shop.messages.updateSuccess') });
    }
    else {
      await api.createShopItem(payload);
      toast({ type: 'success', text: t('views.economy.shop.messages.createSuccess') });
    }
    tableRef.value?.reload();
  }
  catch (error) {
    console.error(error);
    return false;
  }
  finally {
    isSubmitting.value = false;
  }
}

async function onDelete(row: API.Economy.ShopItem) {
  const confirmed = await confirm({
    text: t('views.economy.shop.actions.deleteConfirm'),
    type: 'warning',
  });
  if (!confirmed) {
    return;
  }

  try {
    await api.deleteShopItem(row.id);
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
