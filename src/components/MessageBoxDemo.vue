<script lang="ts" setup>
import { usePopup } from '~/composables';

const { toast, confirm, prompt } = usePopup();

function openToast() {
  toast({
    text: 'This is a toast message',
    type: 'question',
  });
}

function openConfirm() {
  confirm({
    text: 'This is a confirm message',
    type: 'question',
  });
}

async function openPrompt() {
  const result = await prompt({
    title: 'Please enter something',
    text: 'Your input:',
    inputValue: 'Default value',
    inputValidator(value) {
      if (!value) {
        return 'Input cannot be empty';
      }
    },
  });
  console.log('Prompt result:', result);
}
</script>

<template>
  <div>
    <el-button plain @click="openToast">
      Open Toast
    </el-button>
    <el-button plain @click="openConfirm">
      Open Confirm
    </el-button>
    <el-button plain @click="openPrompt">
      Open Prompt
    </el-button>
  </div>
</template>
