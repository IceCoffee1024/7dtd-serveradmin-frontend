<script setup lang="ts">
import type { FormRules } from 'element-plus';
import type { MyFormField } from '~/composables/useMyForm';
import type { CityLocationDto, SaveCityLocationDto } from '~/generated/api/types.gen';
import { useMutation, useQuery } from '@pinia/colada';
import { useI18n } from 'vue-i18n';
import MyDialog from '~/components/MyDialog/index.vue';
import MyForm from '~/components/MyForm/index.vue';
import { usePopup } from '~/composables';
import {
  teleportCreateCityMutation,
  teleportDeleteCityMutation,
  teleportGetCitiesQuery,
  teleportUpdateCityMutation,
} from '~/generated/api/@pinia/colada.gen';
import v from '~/plugins/valibot';
import { invalidateGeneratedQueries } from '~/queries/generated';
import { generateElementRules } from '~/utils';

defineOptions({ name: 'TeleportCitiesPage' });

interface FormModel {
  name: string;
  description: string;
  x: number;
  y: number;
  z: number;
  yawAngle: number;
  currencyRequired: number;
  isEnabled: boolean;
  sortOrder: number;
}

interface FormExpose {
  validate: () => Promise<boolean | undefined>;
  clearValidate: (props?: string | string[]) => void;
}

const { t } = useI18n();
const { toast, confirm } = usePopup();

const dialogRef = useTemplateRef('dialogRef');
const formRef = useTemplateRef<FormExpose>('formRef');

const editingId = ref<number | null>(null);
const citiesQuery = useQuery(teleportGetCitiesQuery());
const createCityMutation = useMutation({
  ...teleportCreateCityMutation(),
  async onSettled() {
    await invalidateGeneratedQueries('Teleport');
  },
});
const updateCityMutation = useMutation({
  ...teleportUpdateCityMutation(),
  async onSettled() {
    await invalidateGeneratedQueries('Teleport');
  },
});
const deleteCityMutation = useMutation({
  ...teleportDeleteCityMutation(),
  async onSettled() {
    await invalidateGeneratedQueries('Teleport');
  },
});
const items = computed(() => citiesQuery.data.value ?? []);
const loading = computed(() => citiesQuery.isPending.value);
const isSubmitting = computed(() => createCityMutation.isLoading.value || updateCityMutation.isLoading.value);

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

async function refreshCities() {
  const state = await citiesQuery.refetch(true);
  if (state.status === 'error') {
    throw state.error;
  }
}

function openAdd() {
  editingId.value = null;
  Object.assign(form, buildDefaults());
  dialogRef.value?.open();
  nextTick(() => formRef.value?.clearValidate());
}

function openEdit(row: CityLocationDto) {
  if (row.id == null) {
    return;
  }

  editingId.value = row.id;
  form.name = row.name ?? '';
  form.description = row.description ?? '';
  form.x = row.x ?? 0;
  form.y = row.y ?? 0;
  form.z = row.z ?? 0;
  form.yawAngle = row.yawAngle ?? 0;
  form.currencyRequired = row.currencyRequired ?? 0;
  form.isEnabled = row.isEnabled ?? true;
  form.sortOrder = row.sortOrder ?? 0;
  dialogRef.value?.open();
  nextTick(() => formRef.value?.clearValidate());
}

async function onConfirm(): Promise<boolean | void> {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid)
    return false;

  try {
    const payload: SaveCityLocationDto = {
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

    if (editingId.value != null) {
      await updateCityMutation.mutateAsync({ path: { id: editingId.value }, body: payload });
      toast({ type: 'success', text: t('views.teleport.cities.messages.updateSuccess') });
    }
    else {
      await createCityMutation.mutateAsync({ body: payload });
      toast({ type: 'success', text: t('views.teleport.cities.messages.createSuccess') });
    }
    await refreshCities();
  }
  catch (error) {
    console.error(error);
    return false;
  }
}

async function onDelete(row: CityLocationDto) {
  if (row.id == null) {
    return;
  }

  const confirmed = await confirm({
    text: t('views.teleport.cities.actions.deleteConfirm'),
    type: 'warning',
  });
  if (!confirmed)
    return;

  try {
    await deleteCityMutation.mutateAsync({ path: { id: row.id } });
    toast({ type: 'success', text: t('views.teleport.cities.messages.deleteSuccess') });
    await refreshCities();
  }
  catch (error) {
    console.error(error);
  }
}
</script>

<template>
  <div class="cities-page">
    <div class="cities-page__toolbar">
      <el-button type="primary" class="cities-page__add-btn" @click="openAdd">
        <el-icon><icon-mdi-plus /></el-icon>
        {{ t('components.myTable.add') }}
      </el-button>
    </div>

    <div class="cities-page__table-shell">
      <el-table v-loading="loading" :data="items" row-key="id" class="cities-page__table">
        <template #empty>
          <div class="app-empty-state cities-page__empty">
            <div class="app-empty-state__icon">
              <icon-mdi-map-marker-radius-outline />
            </div>
            <div class="app-empty-state__title">
              {{ t('views.teleport.cities.form.addTitle') }}
            </div>
            <div class="app-empty-state__description">
              {{ t('views.teleport.cities.columns.description') }}
            </div>
          </div>
        </template>
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
            <div class="cities-page__actions">
              <IconButton
                round
                border
                button-size="small"
                :tooltip-content="t('views.teleport.cities.actions.edit')"
                @click="openEdit(row)"
              >
                <icon-mdi-pencil-outline />
              </IconButton>
              <IconButton
                round
                border
                button-size="small"
                type="danger"
                :tooltip-content="t('views.teleport.cities.actions.delete')"
                @click="onDelete(row)"
              >
                <icon-mdi-delete-outline />
              </IconButton>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </div>

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

<style scoped lang="scss">
.cities-page {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.cities-page__toolbar {
  display: flex;
  justify-content: flex-end;
}

.cities-page__add-btn {
  border-radius: 999px;
  padding-inline: 1rem;
}

.cities-page__table-shell {
  padding: 1rem;
  border: 1px solid color-mix(in srgb, var(--el-border-color-light) 72%, white 28%);
  border-radius: 28px;
  background:
    radial-gradient(circle at top right, color-mix(in srgb, var(--colors-primary) 7%, transparent), transparent 38%),
    linear-gradient(180deg, color-mix(in srgb, var(--el-bg-color) 97%, white 3%), var(--el-bg-color));
  box-shadow: 0 16px 34px rgba(15, 23, 42, 0.05);
}

.cities-page__table {
  :deep(.el-table__inner-wrapper::before) {
    display: none;
  }
}

.cities-page__actions {
  display: inline-flex;
  gap: 0.35rem;
  justify-content: center;
}

.cities-page__empty {
  min-height: 220px;
}
</style>
