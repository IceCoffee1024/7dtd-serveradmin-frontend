<script setup lang="ts">
import type { FormRules } from 'element-plus';
import type { MyFormField } from '~/composables/useMyForm';
import { useI18n } from 'vue-i18n';
import * as api from '~/api/teleport';
import MyDialog from '~/components/MyDialog/index.vue';
import MyForm from '~/components/MyForm/index.vue';
import { usePopup } from '~/composables';
import v from '~/plugins/valibot';
import { generateElementRules } from '~/utils';

defineOptions({ name: 'TeleportCitiesPage' });

interface FormModel {
  name: string
  description: string
  x: number
  y: number
  z: number
  yawAngle: number
  currencyRequired: number
  isEnabled: boolean
  sortOrder: number
}

interface FormExpose {
  validate: () => Promise<boolean | undefined>
  clearValidate: (props?: string | string[]) => void
}

const { t } = useI18n();
const { toast, confirm } = usePopup();

const dialogRef = useTemplateRef('dialogRef');
const formRef = useTemplateRef<FormExpose>('formRef');

const items = ref<API.Teleport.CityLocation[]>([]);
const loading = ref(false);
const isSubmitting = ref(false);
const editingId = ref<number | null>(null);

function buildDefaults(): FormModel {
  return {
    name: '',
    description: '',
    x: 0,
    y: 0,
    z: 0,
    yawAngle: 0,
    currencyRequired: 0,
    isEnabled: true,
    sortOrder: 0,
  };
}

const form = reactive<FormModel>(buildDefaults());

const schema = v.object({
  name: v.pipe(v.string(), v.minLength(1)),
  description: v.optional(v.string()),
  x: v.number(),
  y: v.number(),
  z: v.number(),
  yawAngle: v.number(),
  currencyRequired: v.pipe(v.number(), v.minValue(0)),
  isEnabled: v.boolean(),
  sortOrder: v.pipe(v.number(), v.minValue(0)),
});

const rules: FormRules = generateElementRules(schema);

const booleanOptions = computed(() => [
  { label: t('common.yes'), value: true },
  { label: t('common.no'), value: false },
]);

const dialogTitle = computed(() =>
  editingId.value
    ? t('views.teleport.cities.form.editTitle')
    : t('views.teleport.cities.form.addTitle'),
);

const fields = computed<MyFormField<FormModel>[]>(() => [
  {
    prop: 'name',
    label: t('views.teleport.cities.form.fields.name'),
    el: 'el-input',
    span: { xs: 24, md: 12 },
  },
  {
    prop: 'description',
    label: t('views.teleport.cities.form.fields.description'),
    el: 'el-input',
    props: { type: 'textarea', rows: 2 },
    span: { xs: 24 },
  },
  {
    prop: 'x',
    label: t('views.teleport.cities.form.fields.x'),
    el: 'el-input-number',
    props: { precision: 0, class: 'w-full' },
    span: { xs: 24, md: 8 },
  },
  {
    prop: 'y',
    label: t('views.teleport.cities.form.fields.y'),
    el: 'el-input-number',
    props: { precision: 0, class: 'w-full' },
    span: { xs: 24, md: 8 },
  },
  {
    prop: 'z',
    label: t('views.teleport.cities.form.fields.z'),
    el: 'el-input-number',
    props: { precision: 0, class: 'w-full' },
    span: { xs: 24, md: 8 },
  },
  {
    prop: 'yawAngle',
    label: t('views.teleport.cities.form.fields.yawAngle'),
    el: 'el-input-number',
    props: { precision: 1, class: 'w-full' },
    span: { xs: 24, md: 12 },
  },
  {
    prop: 'currencyRequired',
    label: t('views.teleport.cities.form.fields.currencyRequired'),
    el: 'el-input-number',
    props: { min: 0, precision: 0, class: 'w-full' },
    span: { xs: 24, md: 12 },
  },
  {
    prop: 'sortOrder',
    label: t('views.teleport.cities.form.fields.sortOrder'),
    el: 'el-input-number',
    props: { min: 0, precision: 0, class: 'w-full' },
    span: { xs: 24, md: 12 },
  },
  {
    prop: 'isEnabled',
    label: t('views.teleport.cities.form.fields.isEnabled'),
    el: 'el-select',
    options: booleanOptions.value,
    span: { xs: 24, md: 12 },
  },
]);

async function loadCities() {
  loading.value = true;
  try {
    items.value = await api.getCities();
  }
  catch (error) {
    console.error(error);
  }
  finally {
    loading.value = false;
  }
}

function openAdd() {
  editingId.value = null;
  Object.assign(form, buildDefaults());
  dialogRef.value?.open();
  nextTick(() => formRef.value?.clearValidate());
}

function openEdit(row: API.Teleport.CityLocation) {
  editingId.value = row.id;
  form.name = row.name;
  form.description = row.description ?? '';
  form.x = row.x;
  form.y = row.y;
  form.z = row.z;
  form.yawAngle = row.yawAngle;
  form.currencyRequired = row.currencyRequired;
  form.isEnabled = row.isEnabled;
  form.sortOrder = row.sortOrder;
  dialogRef.value?.open();
  nextTick(() => formRef.value?.clearValidate());
}

async function onConfirm(): Promise<boolean | void> {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid)
    return false;

  isSubmitting.value = true;
  try {
    const payload: API.Teleport.SaveCityLocation = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      x: Number(form.x),
      y: Number(form.y),
      z: Number(form.z),
      yawAngle: Number(form.yawAngle),
      currencyRequired: Number(form.currencyRequired),
      isEnabled: form.isEnabled,
      sortOrder: Number(form.sortOrder),
    };

    if (editingId.value) {
      await api.updateCity(editingId.value, payload);
      toast({ type: 'success', text: t('views.teleport.cities.messages.updateSuccess') });
    }
    else {
      await api.createCity(payload);
      toast({ type: 'success', text: t('views.teleport.cities.messages.createSuccess') });
    }
    await loadCities();
  }
  catch (error) {
    console.error(error);
    return false;
  }
  finally {
    isSubmitting.value = false;
  }
}

async function onDelete(row: API.Teleport.CityLocation) {
  const confirmed = await confirm({
    text: t('views.teleport.cities.actions.deleteConfirm'),
    type: 'warning',
  });
  if (!confirmed)
    return;

  try {
    await api.deleteCity(row.id);
    toast({ type: 'success', text: t('views.teleport.cities.messages.deleteSuccess') });
    await loadCities();
  }
  catch (error) {
    console.error(error);
  }
}

onMounted(() => loadCities());
</script>

<template>
  <div>
    <div class="mb-3 flex justify-end">
      <el-button type="primary" @click="openAdd">
        <el-icon><icon-mdi-plus /></el-icon>
        {{ t('components.myTable.add') }}
      </el-button>
    </div>

    <el-table v-loading="loading" :data="items" border row-key="id">
      <el-table-column prop="name" :label="t('views.teleport.cities.columns.name')" min-width="120" />
      <el-table-column prop="description" :label="t('views.teleport.cities.columns.description')" min-width="140" show-overflow-tooltip />
      <el-table-column prop="x" :label="t('views.teleport.cities.columns.x')" width="80" align="right" />
      <el-table-column prop="y" :label="t('views.teleport.cities.columns.y')" width="80" align="right" />
      <el-table-column prop="z" :label="t('views.teleport.cities.columns.z')" width="80" align="right" />
      <el-table-column prop="yawAngle" :label="t('views.teleport.cities.columns.yawAngle')" width="90" align="right" />
      <el-table-column prop="currencyRequired" :label="t('views.teleport.cities.columns.currencyRequired')" width="90" align="right">
        <template #default="{ row }">
          <span class="text-amber-600 font-semibold dark:text-amber-400">{{ row.currencyRequired }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="sortOrder" :label="t('views.teleport.cities.columns.sortOrder')" width="80" align="right" />
      <el-table-column prop="isEnabled" :label="t('views.teleport.cities.columns.isEnabled')" width="90" align="center">
        <template #default="{ row }">
          <el-tag :type="row.isEnabled ? 'success' : 'info'">
            {{ row.isEnabled ? t('common.yes') : t('common.no') }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column :label="t('components.myTable.operation')" width="140" align="center" fixed="right">
        <template #default="{ row }">
          <div class="flex gap-2 justify-center">
            <el-button size="small" plain @click="openEdit(row)">
              {{ t('views.teleport.cities.actions.edit') }}
            </el-button>
            <el-button size="small" plain type="danger" @click="onDelete(row)">
              {{ t('views.teleport.cities.actions.delete') }}
            </el-button>
          </div>
        </template>
      </el-table-column>
    </el-table>

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
      />
    </MyDialog>
  </div>
</template>
