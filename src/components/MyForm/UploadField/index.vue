<script setup lang="ts">
import type { UploadProps, UploadUserFile } from 'element-plus';

interface Props {
  componentProps?: Partial<UploadProps>;
  disabled?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  componentProps: () => ({}),
  disabled: false,
});

const modelValue = defineModel<UploadUserFile[]>({ default: () => [] });
</script>

<template>
  <el-upload
    v-model:file-list="modelValue"
    :disabled="props.disabled"
    v-bind="props.componentProps"
  >
    <el-button type="primary">
      Upload
    </el-button>
  </el-upload>
</template>
