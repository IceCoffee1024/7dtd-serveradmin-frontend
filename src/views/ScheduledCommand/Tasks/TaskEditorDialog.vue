<script setup lang="ts">
import type { FormRules } from 'element-plus';
import type { MyFormField } from '~/composables/useMyForm';
import { useI18n } from 'vue-i18n';
import { createTask, updateTask } from '~/api/scheduledCommand';
import MyDialog from '~/components/MyDialog/index.vue';
import MyForm from '~/components/MyForm/index.vue';
import { usePopup } from '~/composables';
import v from '~/plugins/valibot';
import { generateElementRules } from '~/utils';

interface Props {
  editData?: API.ScheduledCommand.Task | null;
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
  isEnabled: boolean;
  cronExpression: string;
  timeZoneId: string;
  allowConcurrentExecution: boolean;
  description: string;
  executeOnMainThread: boolean;
  requireGameStartDone: boolean;
  captureOutput: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  editData: null,
  defaultTimeZoneId: null,
  defaultAllowConcurrentExecution: false,
});

const emit = defineEmits<{ saved: [] }>();

const dialogRef = useTemplateRef<{ open: () => void; close: () => void }>('dialogRef');
const formRef = useTemplateRef<FormExpose>('formRef');
const { t } = useI18n();
const { toast } = usePopup();

const isEdit = computed(() => props.editData !== null);
const dialogTitle = computed(() => (isEdit.value ? t('views.scheduler.tasks.dialog.editTitle') : t('views.scheduler.tasks.dialog.createTitle')));
const confirmText = computed(() => (isEdit.value ? t('common.update') : t('common.save')));

/** The ordered list of console commands managed separately from the base form model. */
const commands = ref<string[]>(['']);

function buildDefaults(): FormModel {
  return {
    name: '',
    isEnabled: true,
    cronExpression: '',
    timeZoneId: props.defaultTimeZoneId ?? '',
    allowConcurrentExecution: props.defaultAllowConcurrentExecution,
    description: '',
    executeOnMainThread: true,
    requireGameStartDone: true,
    captureOutput: true,
  };
}

const form = reactive<FormModel>(buildDefaults());

const schema = v.object({
  name: v.pipe(v.string(), v.minLength(1)),
  isEnabled: v.boolean(),
  cronExpression: v.pipe(v.string(), v.minLength(1)),
  timeZoneId: v.string(),
  allowConcurrentExecution: v.boolean(),
  description: v.string(),
  executeOnMainThread: v.boolean(),
  requireGameStartDone: v.boolean(),
  captureOutput: v.boolean(),
});

const rules: FormRules = generateElementRules(schema);

const booleanOptions = computed(() => [
  { label: t('common.yes'), value: true },
  { label: t('common.no'), value: false },
]);

const fields = computed<MyFormField<FormModel>[]>(() => [
  {
    prop: 'name',
    label: t('views.scheduler.tasks.dialog.fields.name'),
    el: 'el-input',
    span: { xs: 24, md: 12 },
  },
  {
    prop: 'isEnabled',
    label: t('views.scheduler.tasks.dialog.fields.isEnabled'),
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
    prop: 'allowConcurrentExecution',
    label: t('views.scheduler.tasks.dialog.fields.allowConcurrentExecution'),
    el: 'el-select',
    options: booleanOptions.value,
    span: { xs: 24, md: 12 },
  },
  {
    prop: 'executeOnMainThread',
    label: t('views.scheduler.tasks.dialog.fields.executeOnMainThread'),
    el: 'el-select',
    options: booleanOptions.value,
    span: { xs: 24, md: 12 },
  },
  {
    prop: 'requireGameStartDone',
    label: t('views.scheduler.tasks.dialog.fields.requireGameStartDone'),
    el: 'el-select',
    options: booleanOptions.value,
    span: { xs: 24, md: 12 },
  },
  {
    prop: 'captureOutput',
    label: t('views.scheduler.tasks.dialog.fields.captureOutput'),
    el: 'el-select',
    options: booleanOptions.value,
    span: { xs: 24, md: 12 },
  },
  {
    prop: 'description',
    label: t('views.scheduler.tasks.dialog.fields.description'),
    el: 'el-input',
    props: { type: 'textarea', rows: 2 },
    span: { xs: 24 },
  },
]);

function addCommand() {
  commands.value.push('');
}

function removeCommand(index: number) {
  if (commands.value.length > 1) {
    commands.value.splice(index, 1);
  }
}

function syncFormData() {
  const source = props.editData;
  if (source) {
    form.name = source.name;
    form.isEnabled = source.isEnabled;
    form.cronExpression = source.cronExpression;
    form.timeZoneId = source.timeZoneId ?? props.defaultTimeZoneId ?? '';
    form.allowConcurrentExecution = source.allowConcurrentExecution;
    form.description = source.description || '';
    form.executeOnMainThread = source.executeOnMainThread;
    form.requireGameStartDone = source.requireGameStartDone;
    form.captureOutput = source.captureOutput;
    commands.value = source.commands.length > 0 ? [...source.commands] : [''];
    return;
  }

  const defaults = buildDefaults();
  form.name = defaults.name;
  form.isEnabled = defaults.isEnabled;
  form.cronExpression = defaults.cronExpression;
  form.timeZoneId = defaults.timeZoneId;
  form.allowConcurrentExecution = defaults.allowConcurrentExecution;
  form.description = defaults.description;
  form.executeOnMainThread = defaults.executeOnMainThread;
  form.requireGameStartDone = defaults.requireGameStartDone;
  form.captureOutput = defaults.captureOutput;
  commands.value = [''];
}

watch(
  () => props.editData,
  () => {
    syncFormData();
  },
  { immediate: true },
);

async function onSubmit() {
  if (!formRef.value) {
    return false;
  }

  const valid = await formRef.value.validate().catch(() => false);
  if (!valid) {
    return false;
  }

  const filteredCommands = commands.value.map(c => c.trim()).filter(c => c.length > 0);
  if (filteredCommands.length === 0) {
    toast({
      type: 'warning',
      title: t('views.scheduler.tasks.dialog.fields.commands'),
      text: t('views.scheduler.tasks.dialog.messages.noCommands'),
    });
    return false;
  }

  const payload: API.ScheduledCommand.TaskUpsert = {
    name: form.name.trim(),
    isEnabled: form.isEnabled,
    cronExpression: form.cronExpression.trim(),
    timeZoneId: form.timeZoneId.trim() || null,
    commands: filteredCommands,
    executeOnMainThread: form.executeOnMainThread,
    requireGameStartDone: form.requireGameStartDone,
    captureOutput: form.captureOutput,
    allowConcurrentExecution: form.allowConcurrentExecution,
    description: form.description.trim() || null,
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
      label-width="160px"
    />

    <!-- Commands list managed outside MyForm because it is a dynamic array -->
    <div class="mt-4 px-1">
      <div class="mb-2 flex items-center justify-between">
        <span class="text-sm text-gray-700 font-medium dark:text-gray-300">
          {{ t('views.scheduler.tasks.dialog.fields.commands') }}
        </span>
        <el-button size="small" plain @click="addCommand">
          <el-icon><icon-mdi-plus /></el-icon>
          {{ t('views.scheduler.tasks.dialog.actions.addCommand') }}
        </el-button>
      </div>
      <div v-auto-animate class="flex flex-col gap-2">
        <div v-for="(_, index) in commands" :key="index" class="flex gap-2 items-center">
          <span class="text-xs text-gray-400 text-right shrink-0 w-6 dark:text-gray-500">{{ index + 1 }}</span>
          <el-input
            v-model="commands[index]"
            :placeholder="t('views.scheduler.tasks.dialog.placeholders.command')"
            class="font-mono flex-1"
            clearable
          />
          <IconButton
            button-size="small"
            icon-size="16"
            plain
            :disabled="commands.length <= 1"
            :tooltip-content="t('views.scheduler.tasks.dialog.actions.removeCommand')"
            @click="removeCommand(index)"
          >
            <icon-mdi-minus />
          </IconButton>
        </div>
      </div>
    </div>
  </MyDialog>
</template>
