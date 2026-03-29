<script setup lang="ts" generic="T = any">
/**
 * MyDialog —— 高级弹窗组件
 * * 核心特性：
 * 1. 命令式 API：通过 ref.value.open(data) 打开弹窗，告别繁琐的 v-model:visible。
 * 2. 泛型透传：传入的 data 享有完整的类型推导，并在 slot 中无缝接力。
 * 3. 异步拦截：传入 onConfirm 函数，内置按钮自动处理 Loading 状态，报错不关窗，成功才关窗。
 * 4. 极致布局：内容超长时，弹窗整体不会超出屏幕，仅 Body 区域出现滚动条，Header 和 Footer 永远固定。
 * 5. 全屏切换：内置全屏切换按钮，适配复杂表单和不同屏幕尺寸。
 * 6. 状态隔离：强制 destroy-on-close，确保每次打开都是全新的弹窗上下文。
 * 7. 细节优化：默认可拖拽，全屏按钮微调，默认宽度调整，关闭时清理上下文数据等。
 */

import { ref } from 'vue';

// ─────────────────────────────────────────────────────────────────────────────
// 暴露给父组件的类型声明，方便父组件使用 `const dialogRef = ref<MyDialogExpose<User>>()`
// ─────────────────────────────────────────────────────────────────────────────
export interface MyDialogExpose<T = any> {
  /**
   * 打开弹窗
   * @param data 传入的上下文数据（如编辑时的行数据），为空代表新增
   */
  open: (data?: T) => void;
  /** 手动关闭弹窗 */
  close: () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────────────────────
interface Props {
  /** 弹窗标题 */
  title: string;
  /** 弹窗宽度，默认 50% */
  width?: string | number;
  /** 是否显示底部操作栏，默认 true */
  showFooter?: boolean;
  /**
   * 确认按钮的异步回调函数。
   * 当用户点击确定时触发。MyDialog 会自动 await 该函数并展示 Loading。
   * 如果 Promise reject，弹窗保持打开；如果 resolve，弹窗自动关闭。
   * @param data 调用 open() 时传入的上下文数据
   */
  onConfirm?: (data?: T) => Promise<void | boolean> | void | boolean;
  /** 自定义取消按钮文字，不传则使用 i18n 默认值 */
  cancelText?: string;
  /** 自定义确认按钮文字，不传则使用 i18n 默认值 */
  confirmText?: string;
}

const props = withDefaults(defineProps<Props>(), {
  width: '50%',
  showFooter: true,
});

// ─────────────────────────────────────────────────────────────────────────────
// 状态管理
// ─────────────────────────────────────────────────────────────────────────────
const visible = ref(false);
const isFullscreen = ref(false);
const isConfirmLoading = ref(false);

/** 存储 open() 传入的上下文数据，通常用于区分新增/编辑，或作为表单初始值 */
const contextData = ref<T | undefined>();

// ─────────────────────────────────────────────────────────────────────────────
// 核心逻辑
// ─────────────────────────────────────────────────────────────────────────────

/**
 * 打开弹窗
 * @param data 传递给弹窗的任意上下文数据
 */
function open(data?: T) {
  contextData.value = data;
  visible.value = true;
  // 每次打开重置状态
  isFullscreen.value = false;
  isConfirmLoading.value = false;
}

/** 关闭弹窗 */
function close() {
  visible.value = false;
}

function onDialogClose() {
  setTimeout(() => {
    contextData.value = undefined;
    isConfirmLoading.value = false;
  }, 300);
}

/** 切换全屏 */
function toggleFullscreen() {
  isFullscreen.value = !isFullscreen.value;
}

/**
 * 处理确定按钮点击
 */
async function handleConfirm() {
  // 如果没有传入确认逻辑，直接关闭
  if (!props.onConfirm) {
    return close();
  }

  try {
    isConfirmLoading.value = true;
    // 等待外部业务逻辑（如表单校验、API 请求）
    const result = await props.onConfirm(contextData.value);

    // 如果外部显式返回 false，则认为校验不通过，阻止关闭
    if (result === false)
      return;

    // 成功执行完业务逻辑，自动关闭弹窗
    close();
  }
  catch (error) {
    // 业务逻辑报错（校验失败、网络异常等），不关闭弹窗，仅解除 Loading
    console.error('[MyDialog] Confirm failed:', error);
  }
  finally {
    isConfirmLoading.value = false;
  }
}

// 暴露 API
defineExpose<MyDialogExpose<T>>({
  open,
  close,
});
</script>

<template>
  <el-dialog
    v-model="visible"
    :title="title"
    :width="width"
    :fullscreen="isFullscreen"
    :destroy-on-close="true"
    :close-on-click-modal="false"
    append-to-body
    draggable
    class="my-dialog-wrapper"
    @close="onDialogClose"
  >
    <template #header="{ titleId, titleClass }">
      <div class="pr-8 flex w-full items-center justify-between">
        <span :id="titleId" :class="titleClass">{{ title }}</span>

        <el-button link class="fullscreen-btn" @click="toggleFullscreen">
          <el-icon size="16">
            <icon-mdi:fullscreen v-if="!isFullscreen" />
            <icon-mdi:fullscreen-exit v-else />
          </el-icon>
        </el-button>
      </div>
    </template>

    <div class="my-dialog-body-container">
      <slot :data="contextData" />
    </div>

    <template v-if="showFooter" #footer>
      <div class="dialog-footer">
        <slot name="footer" :close="close" :confirm="handleConfirm" :loading="isConfirmLoading">
          <el-button @click="close">
            {{ cancelText || $t('common.cancel') || '取消' }}
          </el-button>
          <el-button
            type="primary"
            :loading="isConfirmLoading"
            @click="handleConfirm"
          >
            {{ confirmText || $t('common.confirm') || '确定' }}
          </el-button>
        </slot>
      </div>
    </template>
  </el-dialog>
</template>

<style scoped>
/*
  绝杀级 CSS 布局优化：
  解决原生 el-dialog 内容过多时撑爆屏幕、出现双滚动条的痛点。
*/

/* 1. 限制弹窗整体的最大高度，并使用 flex 布局 */
:deep(.el-dialog) {
  display: flex;
  flex-direction: column;
  /* 非全屏时，最大高度为视口高度的 85% */
  max-height: 85vh;
  /* 调整顶部间距，比默认的 15vh 稍微靠上一点，视觉更舒服 */
  margin-top: 7vh !important;
  margin-bottom: 7vh !important;
}

/* 2. 让 Body 区域自动分配剩余空间，内容溢出时仅 Body 滚动 */
:deep(.el-dialog__body) {
  flex: 1;
  min-height: 0; /* 必须，防止 flex 子项溢出 */
  overflow-y: auto;
  /* 优化默认的 padding，使其看起来更紧凑专业 */
  padding: 20px 24px;
}

/* 3. 全屏模式下的样式覆盖 */
:deep(.el-dialog.is-fullscreen) {
  max-height: 100vh;
  margin-top: 0 !important;
  margin-bottom: 0 !important;
}

/* 全屏按钮的微调，避免与原生的关闭十字图标重叠 */
.fullscreen-btn {
  margin-right: -10px;
  color: var(--el-color-info);
}
.fullscreen-btn:hover {
  color: var(--el-color-primary);
}
</style>
