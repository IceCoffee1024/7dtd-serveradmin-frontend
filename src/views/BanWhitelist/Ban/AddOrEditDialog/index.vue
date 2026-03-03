<script setup lang="ts">
import type { FormInstance, FormRules } from 'element-plus';
import dayjs from 'dayjs';
import { banPlayer, unbanPlayers } from '~/api/gameServer';
import v from '~/plugins/valibot';
import { generateElementRules } from '~/utils';

interface FormModel {
  playerId: string;
  displayName: string;
  bannedUntil: Date | null;
  reason: string;
}

interface Props {
  editData?: Record<string, any> | null;
}

const props = withDefaults(defineProps<Props>(), {
  editData: null,
});

const emit = defineEmits(['saved']);
const visible = ref(false);
const loading = ref(false);
const formRef = ref<FormInstance>();

const isEdit = computed(() => !!props.editData);

const form = reactive<FormModel>({
  playerId: '',
  displayName: '',
  bannedUntil: null,
  reason: '',
});

const BanSchema = v.object({
  playerId: v.pipe(v.string(), v.minLength(1)),
  displayName: v.pipe(v.string(), v.minLength(1)),
  bannedUntil: v.date(),
  reason: v.optional(v.string()),
});

const rules: FormRules = generateElementRules(BanSchema);

function syncFormData() {
  if (props.editData) {
    form.playerId = props.editData.playerId || '';
    form.displayName = props.editData.displayName || '';
    form.bannedUntil = props.editData.bannedUntil ? dayjs(props.editData.bannedUntil).toDate() : null;
    form.reason = props.editData.reason || '';
  }
  else {
    form.playerId = '';
    form.displayName = '';
    form.bannedUntil = null;
    form.reason = '';
  }
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
    return;
  }

  const valid = await formRef.value.validate().catch(() => false);
  if (!valid || !form.bannedUntil) {
    return;
  }

  loading.value = true;
  try {
    if (isEdit.value) {
      const oldPlayerId = props.editData?.playerId;
      if (oldPlayerId) {
        await unbanPlayers([oldPlayerId]);
      }
    }

    await banPlayer(
      form.playerId,
      dayjs(form.bannedUntil).toISOString(),
      form.displayName,
      form.reason || null,
    );

    emit('saved');
    visible.value = false;
  }
  catch (error) {
    console.error(error);
  }
  finally {
    loading.value = false;
  }
}

async function onClose() {
  visible.value = false;
  await nextTick();
  formRef.value?.clearValidate();
}

async function show() {
  syncFormData();
  visible.value = true;
  await nextTick();
  formRef.value?.clearValidate();
}

defineExpose({
  show,
});
</script>

<template>
  <el-dialog
    v-model="visible"
    :title="isEdit ? $t('views.banWhitelist.editBan') : $t('views.banWhitelist.addBan')"
    width="50rem"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    :show-close="false"
  >
    <el-form ref="formRef" :model="form" :rules="rules" label-width="130px" @submit.prevent="onSubmit">
      <el-form-item :label="$t('views.banWhitelist.playerId')" prop="playerId">
        <el-input v-model="form.playerId" :disabled="isEdit" />
      </el-form-item>

      <el-form-item :label="$t('views.banWhitelist.displayName')" prop="displayName">
        <el-input v-model="form.displayName" />
      </el-form-item>

      <el-form-item :label="$t('views.banWhitelist.bannedUntil')" prop="bannedUntil">
        <el-date-picker
          v-model="form.bannedUntil"
          type="datetime"
          format="YYYY-MM-DD HH:mm:ss"
          class="w-full"
        />
      </el-form-item>

      <el-form-item :label="$t('views.banWhitelist.reason')" prop="reason">
        <el-input v-model="form.reason" type="textarea" :rows="3" />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="onClose">
        <icon-mdi:close class="mr-1" />
        {{ $t('common.cancel') }}
      </el-button>
      <el-button type="primary" :loading="loading" @click="onSubmit">
        <icon-mdi:check class="mr-1" />
        {{ isEdit ? $t('common.update') : $t('common.save') }}
      </el-button>
    </template>
  </el-dialog>
</template>
