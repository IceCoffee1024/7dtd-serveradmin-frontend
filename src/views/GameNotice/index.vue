<script setup lang="ts">
import type { FormRules } from 'element-plus';
import type { MyFormField } from '~/composables/useMyForm';
import type { GameNoticeFeatureSettingsDto } from '~/generated/api/types.gen';
import { useMutation, useQuery } from '@pinia/colada';
import { cloneDeep, isEqual } from 'es-toolkit';
import { useI18n } from 'vue-i18n';
import { onBeforeRouteLeave } from 'vue-router';
import MyForm from '~/components/MyForm/index.vue';
import { usePopup } from '~/composables';
import {
  gameNoticeGetSettingsQuery,
  gameNoticeResetSettingsMutation,
  gameNoticeUpdateSettingsMutation,
} from '~/generated/api/@pinia/colada.gen';
import v from '~/plugins/valibot';
import { invalidateGeneratedQueries } from '~/queries/generated';
import { generateElementRules } from '~/utils';

defineOptions({ name: 'GameNoticePage' });

interface FormModel {
  isEnabled: boolean;
  rotatingIntervalSeconds: number;
  bloodMoonNotice1: string;
  bloodMoonNotice2: string;
  bloodMoonNotice3: string;
}

interface FormExpose {
  validate: () => Promise<boolean | undefined>;
  clearValidate: (props?: string | string[]) => void;
}

const { t } = useI18n();
const { toast, confirm } = usePopup();

const formRef = useTemplateRef<FormExpose>('formRef');
const settings = ref<GameNoticeFeatureSettingsDto | null>(null);
const rotatingNotices = ref<string[]>([]);
const welcomeNotices = ref<string[]>([]);

function buildDefaults(): FormModel {
  return {
    isEnabled: false,
    rotatingIntervalSeconds: 300,
    bloodMoonNotice1: '',
    bloodMoonNotice2: '',
    bloodMoonNotice3: '',
  };
}

const form = reactive<FormModel>(buildDefaults());
const savedForm = ref<FormModel>(buildDefaults());
const savedRotatingNotices = ref<string[]>([]);
const savedWelcomeNotices = ref<string[]>([]);
const isDirty = computed(() =>
  !isEqual(form, savedForm.value)
  || !isEqual(rotatingNotices.value, savedRotatingNotices.value)
  || !isEqual(welcomeNotices.value, savedWelcomeNotices.value),
);

const schema = v.object({
  isEnabled: v.boolean(),
  rotatingIntervalSeconds: v.pipe(v.number(), v.minValue(1)),
  bloodMoonNotice1: v.string(),
  bloodMoonNotice2: v.string(),
  bloodMoonNotice3: v.string(),
});

const rules: FormRules = generateElementRules(schema);

const booleanOptions = computed(() => [
  { label: t('common.yes'), value: true },
  { label: t('common.no'), value: false },
]);

const fields = computed<MyFormField<FormModel>[]>(() => [
  {
    prop: 'isEnabled',
    label: t('views.gameNotice.settings.fields.isEnabled'),
    el: 'el-select',
    options: booleanOptions.value,
    span: { xs: 24, md: 12 },
  },
  {
    prop: 'rotatingIntervalSeconds',
    label: t('views.gameNotice.settings.fields.rotatingIntervalSeconds'),
    el: 'el-input-number',
    props: { min: 1, precision: 0, class: 'w-full' },
    tooltip: t('views.gameNotice.settings.tooltips.rotatingIntervalSeconds'),
    span: { xs: 24, md: 12 },
  },
  {
    prop: 'bloodMoonNotice1',
    label: t('views.gameNotice.settings.fields.bloodMoonNotice1'),
    el: 'el-input',
    props: { type: 'textarea', rows: 2, clearable: true },
    tooltip: t('views.gameNotice.settings.tooltips.bloodMoonNotices'),
    span: { xs: 24 },
  },
  {
    prop: 'bloodMoonNotice2',
    label: t('views.gameNotice.settings.fields.bloodMoonNotice2'),
    el: 'el-input',
    props: { type: 'textarea', rows: 2, clearable: true },
    span: { xs: 24 },
  },
  {
    prop: 'bloodMoonNotice3',
    label: t('views.gameNotice.settings.fields.bloodMoonNotice3'),
    el: 'el-input',
    props: { type: 'textarea', rows: 2, clearable: true },
    span: { xs: 24 },
  },
]);

const settingsQuery = useQuery(gameNoticeGetSettingsQuery());
const updateSettingsMutation = useMutation({
  ...gameNoticeUpdateSettingsMutation(),
  async onSettled() {
    await invalidateGeneratedQueries('GameNotice');
  },
});
const resetSettingsMutation = useMutation({
  ...gameNoticeResetSettingsMutation(),
  async onSettled() {
    await invalidateGeneratedQueries('GameNotice');
  },
});
const isLoading = computed(() => settingsQuery.isPending.value);
const isSubmitting = computed(() => updateSettingsMutation.isLoading.value || resetSettingsMutation.isLoading.value);

function applyValues(source: GameNoticeFeatureSettingsDto) {
  form.isEnabled = source.isEnabled ?? false;
  form.rotatingIntervalSeconds = source.rotatingIntervalSeconds ?? 300;
  form.bloodMoonNotice1 = source.bloodMoonNotice1 ?? '';
  form.bloodMoonNotice2 = source.bloodMoonNotice2 ?? '';
  form.bloodMoonNotice3 = source.bloodMoonNotice3 ?? '';
  welcomeNotices.value = source.welcomeNotices ? [...source.welcomeNotices] : [];
  rotatingNotices.value = source.rotatingNotices ? [...source.rotatingNotices] : [];
  savedForm.value = cloneDeep(form);
  savedRotatingNotices.value = [...rotatingNotices.value];
  savedWelcomeNotices.value = [...welcomeNotices.value];
}

watch(
  () => settingsQuery.data.value,
  async (data) => {
    if (data == null) {
      return;
    }

    settings.value = data;
    applyValues(data);
    await nextTick();
    formRef.value?.clearValidate();
  },
  { immediate: true },
);

watch(
  () => settingsQuery.error.value,
  (error) => {
    if (error == null) {
      return;
    }

    console.error(error);
  },
);

async function refreshSettings() {
  const state = await settingsQuery.refetch(true);
  if (state.status !== 'success') {
    return;
  }

  settings.value = state.data;
  applyValues(state.data);
  await nextTick();
  formRef.value?.clearValidate();
}

function addNotice() {
  rotatingNotices.value.push('');
}

function removeNotice(index: number) {
  rotatingNotices.value.splice(index, 1);
}

function addWelcomeNotice() {
  welcomeNotices.value.push('');
}

function removeWelcomeNotice(index: number) {
  welcomeNotices.value.splice(index, 1);
}

async function onSubmit() {
  if (formRef.value == null || settings.value == null) {
    return;
  }

  const valid = await formRef.value.validate().catch(() => false);
  if (valid === false) {
    return;
  }

  try {
    const filteredWelcomeNotices = welcomeNotices.value.map(n => n.trim()).filter(n => n.length > 0);
    const filteredNotices = rotatingNotices.value.map(n => n.trim()).filter(n => n.length > 0);
    const payload: GameNoticeFeatureSettingsDto = {
      ...settings.value,
      isEnabled: form.isEnabled,
      welcomeNotices: filteredWelcomeNotices.length > 0 ? filteredWelcomeNotices : null,
      rotatingNotices: filteredNotices.length > 0 ? filteredNotices : null,
      rotatingIntervalSeconds: Number(form.rotatingIntervalSeconds),
      bloodMoonNotice1: form.bloodMoonNotice1.trim() || null,
      bloodMoonNotice2: form.bloodMoonNotice2.trim() || null,
      bloodMoonNotice3: form.bloodMoonNotice3.trim() || null,
    };
    await updateSettingsMutation.mutateAsync({ body: payload });
    toast({ type: 'success', text: t('views.gameNotice.settings.messages.saveSuccess') });
    await refreshSettings();
  }
  catch (error) {
    console.error(error);
  }
}

async function onReset() {
  const ok = await confirm({
    type: 'warning',
    text: t('views.gameNotice.settings.messages.resetConfirm'),
  });
  if (ok === false) {
    return;
  }

  try {
    settings.value = await resetSettingsMutation.mutateAsync({});
    applyValues(settings.value);
    await nextTick();
    formRef.value?.clearValidate();
    toast({ type: 'success', text: t('views.gameNotice.settings.messages.resetSuccess') });
  }
  catch (error) {
    console.error(error);
  }
}

onBeforeRouteLeave(async () => {
  if (!isDirty.value) {
    return true;
  }
  return await confirm({
    type: 'warning',
    text: t('views.gameNotice.settings.messages.unsavedChanges'),
  });
});
</script>

<template>
  <div>
    <div v-if="isLoading" class="flex flex-col gap-4">
      <el-skeleton v-for="index in 5" :key="index" animated>
        <template #template>
          <el-skeleton-item variant="text" class="h-8" />
        </template>
      </el-skeleton>
    </div>
    <template v-else>
      <MyForm
        id="gameNoticeSettingsForm"
        ref="formRef"
        v-model="form"
        :fields="fields"
        :rules="rules"
        label-position="top"
        label-width="auto"
        :gutter="16"
        @submit.prevent="onSubmit"
      />

      <!-- Welcome notices list is managed outside MyForm because it is a dynamic string array -->
      <div class="mt-4 px-1">
        <div class="mb-2 flex items-center justify-between">
          <span class="text-sm text-gray-700 font-medium dark:text-gray-300">
            {{ t('views.gameNotice.settings.fields.welcomeNotices') }}
          </span>
          <el-button size="small" class="app-pill-button" @click="addWelcomeNotice">
            <el-icon><icon-mdi-plus /></el-icon>
            {{ t('views.gameNotice.settings.actions.addNotice') }}
          </el-button>
        </div>
        <p v-if="welcomeNotices.length === 0" class="text-sm text-gray-400 dark:text-gray-500">
          {{ t('views.gameNotice.settings.messages.noWelcomeNotices') }}
        </p>
        <div v-auto-animate class="flex flex-col gap-2">
          <div v-for="(_, index) in welcomeNotices" :key="index" class="flex gap-2 items-center">
            <span class="text-xs text-gray-400 text-right shrink-0 w-6 dark:text-gray-500">{{ index + 1 }}</span>
            <el-input
              v-model="welcomeNotices[index]"
              :placeholder="t('views.gameNotice.settings.placeholders.welcomeNotice')"
              class="flex-1"
              clearable
            />
            <IconButton
              button-size="small"
              icon-size="16"
              round
              border
              type="danger"
              :tooltip-content="t('views.gameNotice.settings.actions.removeNotice')"
              @click="removeWelcomeNotice(index)"
            >
              <icon-mdi-minus />
            </IconButton>
          </div>
        </div>
      </div>

      <!-- Rotating notices list is managed outside MyForm because it is a dynamic string array -->
      <div class="mt-4 px-1">
        <div class="mb-2 flex items-center justify-between">
          <span class="text-sm text-gray-700 font-medium dark:text-gray-300">
            {{ t('views.gameNotice.settings.fields.rotatingNotices') }}
          </span>
          <el-button size="small" class="app-pill-button" @click="addNotice">
            <el-icon><icon-mdi-plus /></el-icon>
            {{ t('views.gameNotice.settings.actions.addNotice') }}
          </el-button>
        </div>
        <p v-if="rotatingNotices.length === 0" class="text-sm text-gray-400 dark:text-gray-500">
          {{ t('views.gameNotice.settings.messages.noRotatingNotices') }}
        </p>
        <div v-auto-animate class="flex flex-col gap-2">
          <div v-for="(_, index) in rotatingNotices" :key="index" class="flex gap-2 items-center">
            <span class="text-xs text-gray-400 text-right shrink-0 w-6 dark:text-gray-500">{{ index + 1 }}</span>
            <el-input
              v-model="rotatingNotices[index]"
              :placeholder="t('views.gameNotice.settings.placeholders.rotatingNotice')"
              class="flex-1"
              clearable
            />
            <IconButton
              button-size="small"
              icon-size="16"
              round
              border
              type="danger"
              :tooltip-content="t('views.gameNotice.settings.actions.removeNotice')"
              @click="removeNotice(index)"
            >
              <icon-mdi-minus />
            </IconButton>
          </div>
        </div>
      </div>

      <div class="mt-6 flex gap-2 justify-end">
        <el-button :loading="isSubmitting" @click="onReset">
          <el-icon><icon-mdi-restore /></el-icon>
          {{ t('views.gameNotice.settings.actions.resetToDefaults') }}
        </el-button>
        <el-button type="primary" :loading="isSubmitting" :disabled="!isDirty" @click="onSubmit">
          <el-icon><icon-mdi-check /></el-icon>
          {{ t('views.gameNotice.settings.actions.save') }}
        </el-button>
      </div>
    </template>
  </div>
</template>
