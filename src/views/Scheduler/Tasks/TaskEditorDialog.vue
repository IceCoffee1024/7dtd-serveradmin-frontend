<script setup lang="ts">
import type { FormRules } from 'element-plus';
import type { MyFormField } from '~/composables/useMyForm';
import { useI18n } from 'vue-i18n';
import { createTask, updateTask } from '~/api/scheduler';
import MyDialog from '~/components/MyDialog/index.vue';
import MyForm from '~/components/MyForm/index.vue';
import { usePopup } from '~/composables';
import v from '~/plugins/valibot';
import { generateElementRules } from '~/utils';

interface Props {
  editData?: API.Scheduler.Task | null;
  taskTypes: API.Scheduler.TaskTypeInfo[];
  defaultTimeZoneId?: string | null;
  defaultAllowConcurrentExecution?: boolean;
}

interface DialogExpose {
  show: () => Promise<void> | void;
  close: () => void;
}

interface FormExpose {
  validate: () => Promise<boolean | undefined>;
  clearValidate: (props?: string | string[]) => void;
}

interface FormModel {
  name: string;
  taskType: string;
  isEnabled: boolean;
  cronExpression: string;
  timeZoneId: string;
  allowConcurrentExecution: boolean;
  description: string;
  configJson: string;
}

const props = withDefaults(defineProps<Props>(), {
  editData: null,
  defaultTimeZoneId: 'UTC',
  defaultAllowConcurrentExecution: false,
});

const emit = defineEmits<{ saved: [] }>();

const dialogRef = useTemplateRef<DialogExpose>('dialogRef');
const formRef = useTemplateRef<FormExpose>('formRef');
const { t } = useI18n();
const { toast } = usePopup();

const isEdit = computed(() => props.editData !== null);

function buildDefaults(): FormModel {
  const firstTaskType = props.taskTypes[0];
  return {
    name: '',
    taskType: firstTaskType?.taskType ?? '',
    isEnabled: true,
    cronExpression: '',
    timeZoneId: props.defaultTimeZoneId || 'UTC',
    allowConcurrentExecution: props.defaultAllowConcurrentExecution,
    description: '',
    configJson: firstTaskType?.defaultConfigJson || '{}',
  };
}

const form = reactive<FormModel>(buildDefaults());

const selectedTaskType = computed(() => props.taskTypes.find(item => item.taskType === form.taskType) ?? null);
const dialogTitle = computed(() => (isEdit.value ? t('views.scheduler.tasks.dialog.editTitle') : t('views.scheduler.tasks.dialog.createTitle')));
const confirmText = computed(() => (isEdit.value ? t('common.update') : t('common.save')));

const schema = v.object({
  name: v.pipe(v.string(), v.minLength(1)),
  taskType: v.pipe(v.string(), v.minLength(1)),
  isEnabled: v.boolean(),
  cronExpression: v.pipe(v.string(), v.minLength(1)),
  timeZoneId: v.string(),
  allowConcurrentExecution: v.boolean(),
  description: v.string(),
  configJson: v.pipe(v.string(), v.minLength(2)),
});

const rules: FormRules = generateElementRules(schema);

const booleanOptions = computed(() => [
  { label: t('common.yes'), value: true },
  { label: t('common.no'), value: false },
]);

const taskTypeOptions = computed(() => props.taskTypes.map(item => ({ label: item.title, value: item.taskType })));

const fields = computed<MyFormField<FormModel>[]>(() => [
  {
    prop: 'name',
    label: t('views.scheduler.tasks.dialog.fields.name'),
    el: 'el-input',
    span: { xs: 24, md: 12 },
  },
  {
    prop: 'taskType',
    label: t('views.scheduler.tasks.dialog.fields.taskType'),
    el: 'custom',
    span: { xs: 24, md: 12 },
    onChange: () => {
      if (isEdit.value === false) {
        applyDefaultConfig();
      }
    },
  },
  {
    prop: 'isEnabled',
    label: t('views.scheduler.tasks.dialog.fields.isEnabled'),
    el: 'el-select',
    options: booleanOptions.value,
    span: { xs: 24, md: 12 },
  },
  {
    prop: 'allowConcurrentExecution',
    label: t('views.scheduler.tasks.dialog.fields.allowConcurrentExecution'),
    el: 'el-select',
    options: booleanOptions.value,
    span: { xs: 24, md: 12 },
  },
  {
    prop: 'cronExpression',
    label: t('views.scheduler.tasks.dialog.fields.cronExpression'),
    el: 'el-input',
    tooltip: t('views.scheduler.tasks.dialog.tooltips.cronExpression'),
    span: { xs: 24, md: 12 },
  },
  {
    prop: 'timeZoneId',
    label: t('views.scheduler.tasks.dialog.fields.timeZoneId'),
    el: 'el-input',
    tooltip: t('views.scheduler.tasks.dialog.tooltips.timeZoneId'),
    span: { xs: 24, md: 12 },
  },
  {
    prop: 'description',
    label: t('views.scheduler.tasks.dialog.fields.description'),
    el: 'el-input',
    props: { type: 'textarea', rows: 3 },
    span: { xs: 24 },
  },
  {
    prop: 'configJson',
    label: t('views.scheduler.tasks.dialog.fields.configJson'),
    el: 'custom',
    span: { xs: 24 },
  },
]);

function syncFormData() {
  const source = props.editData;
  if (source) {
    form.name = source.name;
    form.taskType = source.taskType;
    form.isEnabled = source.isEnabled;
    form.cronExpression = source.cronExpression;
    form.timeZoneId = source.timeZoneId || props.defaultTimeZoneId || 'UTC';
    form.allowConcurrentExecution = source.allowConcurrentExecution;
    form.description = source.description || '';
    form.configJson = formatJson(source.configJson);
    return;
  }

  const defaults = buildDefaults();
  form.name = defaults.name;
  form.taskType = defaults.taskType;
  form.isEnabled = defaults.isEnabled;
  form.cronExpression = defaults.cronExpression;
  form.timeZoneId = defaults.timeZoneId;
  form.allowConcurrentExecution = defaults.allowConcurrentExecution;
  form.description = defaults.description;
  form.configJson = defaults.configJson;
}

function formatJson(value: string | null | undefined): string {
  if (!value || value.trim().length === 0) {
    return '{}';
  }

  try {
    return JSON.stringify(JSON.parse(value), null, 2);
  }
  catch {
    return value;
  }
}

function applyDefaultConfig() {
  form.configJson = selectedTaskType.value?.defaultConfigJson || '{}';
}

watch(
  () => props.editData,
  () => {
    syncFormData();
  },
  { immediate: true },
);

watch(
  () => props.taskTypes,
  () => {
    if (isEdit.value === false && props.taskTypes.length > 0) {
      if (props.taskTypes.some(item => item.taskType === form.taskType) === false) {
        form.taskType = props.taskTypes[0].taskType;
      }

      if (form.configJson.trim().length === 0 || form.configJson === '{}') {
        applyDefaultConfig();
      }
    }
  },
  { immediate: true, deep: true },
);

async function onSubmit() {
  if (!formRef.value) {
    return false;
  }

  const valid = await formRef.value.validate().catch(() => false);
  if (!valid) {
    return false;
  }

  let parsedConfig: unknown;
  try {
    parsedConfig = JSON.parse(form.configJson);
  }
  catch (error) {
    toast({
      type: 'error',
      title: t('views.scheduler.tasks.dialog.messages.invalidConfigTitle'),
      text: t('views.scheduler.tasks.dialog.messages.invalidConfigJson'),
    });
    return false;
  }

  const payload: API.Scheduler.TaskUpsert = {
    name: form.name.trim(),
    taskType: form.taskType,
    isEnabled: form.isEnabled,
    cronExpression: form.cronExpression.trim(),
    timeZoneId: form.timeZoneId.trim() || null,
    allowConcurrentExecution: form.allowConcurrentExecution,
    description: form.description.trim() || null,
    configJson: JSON.stringify(parsedConfig, null, 2),
  };

  try {
    if (isEdit.value && props.editData) {
      await updateTask(props.editData.id, payload);
    }
    else {
      await createTask(payload);
    }

    toast({
      type: 'success',
      title: isEdit.value ? t('common.update') : t('common.save'),
      text: t('views.scheduler.tasks.dialog.messages.saveSuccess'),
    });

    emit('saved');
    dialogRef.value?.close();
    return true;
  }
  catch (error) {
    console.error(error);
    return false;
  }
}

function show() {
  syncFormData();
  dialogRef.value?.open();
  nextTick(() => {
    formRef.value?.clearValidate();
  });
}

function close() {
  dialogRef.value?.close();
}

defineExpose({
  show,
  close,
});
</script>

<template>
  <MyDialog
    ref="dialogRef"
    :title="dialogTitle"
    width="72rem"
    :on-confirm="onSubmit"
    :confirm-text="confirmText"
    :cancel-text="t('common.cancel')"
  >
    <MyForm
      ref="formRef"
      v-model="form"
      :fields="fields"
      :rules="rules"
      label-width="140px"
    >
      <template #taskType>
        <div class="flex flex-col gap-3 w-full">
          <el-select v-model="form.taskType" :disabled="isEdit" :placeholder="t('views.scheduler.tasks.dialog.placeholders.taskType')">
            <el-option v-for="item in taskTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
          <el-alert
            v-if="selectedTaskType"
            :title="selectedTaskType.title"
            type="info"
            show-icon
            :closable="false"
            :description="selectedTaskType.description"
          />
        </div>
      </template>

      <template #configJson>
        <div class="flex flex-col gap-3 w-full">
          <div class="flex flex-wrap gap-2 items-center justify-between">
            <div class="text-sm text-gray-500 dark:text-gray-400">
              {{ t('views.scheduler.tasks.dialog.hints.configJson') }}
            </div>
            <div class="flex gap-2">
              <el-button size="small" plain @click="applyDefaultConfig">
                {{ t('views.scheduler.tasks.dialog.actions.useDefaultConfig') }}
              </el-button>
              <el-button size="small" plain @click="form.configJson = '{}'">
                {{ t('views.scheduler.tasks.dialog.actions.resetConfig') }}
              </el-button>
            </div>
          </div>
          <el-input
            v-model="form.configJson"
            type="textarea"
            :rows="16"
            :placeholder="t('views.scheduler.tasks.dialog.placeholders.configJson')"
            class="font-mono"
          />
        </div>
      </template>
    </MyForm>
  </MyDialog>
</template>