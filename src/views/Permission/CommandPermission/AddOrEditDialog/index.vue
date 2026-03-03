<script setup lang="ts">
import type { FormInstance, FormRules } from 'element-plus';
import { addCommandPermission } from '~/api/gameServer';
import v from '~/plugins/valibot';
import { generateElementRules } from '~/utils';

interface FormModel {
    command: string;
    permissionLevel: number;
    description: string;
}

interface Props {
    editData?: Record<string, unknown> | null;
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
    command: '',
    permissionLevel: 2000,
    description: '',
});

const CommandPermissionSchema = v.object({
    command: v.pipe(v.string(), v.minLength(1)),
    permissionLevel: v.pipe(v.number(), v.minValue(0), v.maxValue(2000)),
    description: v.optional(v.string()),
});

const rules: FormRules = generateElementRules(CommandPermissionSchema);

function syncFormData() {
    if (props.editData) {
        form.command = String(props.editData.command ?? '');
        form.permissionLevel = Number(props.editData.permissionLevel ?? 2000);
        form.description = String(props.editData.description ?? '');
    }
    else {
        form.command = '';
        form.permissionLevel = 2000;
        form.description = '';
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
    if (!valid) {
        return;
    }

    loading.value = true;
    try {
        await addCommandPermission(form);
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
        :title="isEdit ? $t('views.permission.editCommandPermission') : $t('views.permission.addCommandPermission')"
        width="50rem"
        :close-on-click-modal="false"
        :close-on-press-escape="false"
        :show-close="false"
    >
        <el-form ref="formRef" :model="form" :rules="rules" label-width="130px" @submit.prevent="onSubmit">
            <el-form-item :label="$t('views.permission.command')" prop="command">
                <el-input v-model="form.command" :disabled="isEdit" />
            </el-form-item>

            <el-form-item :label="$t('views.permission.permissionLevel')" prop="permissionLevel">
                <el-input-number v-model="form.permissionLevel" :min="0" :max="2000" class="w-full" />
            </el-form-item>

            <el-form-item :label="$t('views.permission.description')" prop="description">
                <el-input v-model="form.description" type="textarea" :rows="3" />
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