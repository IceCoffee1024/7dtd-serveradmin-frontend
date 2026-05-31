<script setup lang="ts">
/**
 * MyDialog - an advanced dialog wrapper.
 * * Key capabilities:
 * 1. Imperative API: open the dialog through ref.value.open() instead of wiring a verbose v-model:visible.
 * 2. Async confirmation handling: pass an onConfirm function to decide whether the dialog should close after confirm; loading is controlled by the caller through the loading prop.
 * 3. Compact layout: keep the header and footer in place while the dialog content is rendered inside the body slot.
 * 4. Fullscreen toggle: built-in fullscreen action for complex forms and different screen sizes.
 * 5. Practical details: draggable by default and includes custom header actions for fullscreen and close.
 */

import type { ElDialog } from 'element-plus';
import { ref } from 'vue';

// ─────────────────────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────────────────────
type ElDialogProps = InstanceType<typeof ElDialog>['$props'];
interface Props extends /* @vue-ignore */ Omit<ElDialogProps, 'title' | 'fullscreen'> {
  /** Dialog title. */
  title: string;
  /** Whether to show the loading state. */
  loading?: boolean;
  /** Whether to show the footer action bar. Defaults to true. */
  showFooter?: boolean;
  /**
   * Async callback for the confirm button.
    * Triggered when the user clicks confirm. MyDialog awaits the callback and closes only when it resolves successfully.
    * If the callback returns false or throws, the dialog stays open.
   */
  onConfirm?: () => Promise<void | boolean> | void | boolean;
  /** Custom cancel button text; falls back to the i18n default when omitted. */
  cancelText?: string;
  /** Custom confirm button text; falls back to the i18n default when omitted. */
  confirmText?: string;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  showFooter: true,
});

// ─────────────────────────────────────────────────────────────────────────────
// State
// ─────────────────────────────────────────────────────────────────────────────
const visible = ref(false);
const fullscreen = ref(false);

// ─────────────────────────────────────────────────────────────────────────────
// Core logic
// ─────────────────────────────────────────────────────────────────────────────

/** Opens the dialog. */
function open() {
  // Reset dialog state each time it opens.
  fullscreen.value = false;
  visible.value = true;
}

/** Closes the dialog. */
function close() {
  visible.value = false;
}

/** Toggles fullscreen mode. */
function toggleFullscreen() {
  fullscreen.value = !fullscreen.value;
}

/** Handles confirm button clicks. */
async function handleConfirm() {
  // If no confirm handler is provided, close immediately.
  if (!props.onConfirm) {
    return close();
  }

  try {
    // Wait for external business logic (for example, form validation or API calls).
    const result = await props.onConfirm();

    // If the callback explicitly returns false, treat it as validation failure and keep the dialog open.
    if (result === false)
      return;

    // Close automatically once the business logic succeeds.
    close();
  }
  catch (error) {
    // Keep the dialog open on business errors (validation failures, network errors, etc.) and only clear loading.
    console.error('[MyDialog] Confirm failed:', error);
  }
}

// Expose public API.
defineExpose({
  open,
  close,
});
</script>

<template>
  <el-dialog
    v-model="visible"
    :title="title"
    :fullscreen="fullscreen"
    :close-on-click-modal="false"
    :append-to-body="true"
    :draggable="true"
    :align-center="true"
    :show-close="false"
  >
    <template #header="{ titleId, titleClass }">
      <div class="flex w-full items-center justify-between">
        <span :id="titleId" :class="titleClass" class="font-bold">{{ title }}</span>
        <span>
          <IconButton

            round border
            icon-size="22" class="fullscreen-btn" :tooltip-content="fullscreen ? $t('layout.header.exitFullscreen') : $t('layout.header.fullscreen')"
            @click="toggleFullscreen"
          >
            <icon-mdi:fullscreen v-if="!fullscreen" />
            <icon-mdi:fullscreen-exit v-else />
          </IconButton>
          <IconButton round border icon-size="22" class="close-btn" :tooltip-content="$t('common.close')" @click="close">
            <icon-mdi:close />
          </IconButton>
        </span>
      </div>
    </template>
    <div v-loading="loading">
      <slot :fullscreen="fullscreen" />
    </div>
    <template v-if="showFooter" #footer>
      <div v-loading="loading">
        <slot name="footer" :close="close" :confirm="handleConfirm">
          <el-button class="my-dialog__secondary-btn" @click="close">
            {{ cancelText || $t('common.cancel') || '取消' }}
          </el-button>
          <el-button
            type="primary"
            class="my-dialog__primary-btn"
            @click="handleConfirm"
          >
            {{ confirmText || $t('common.confirm') || '确定' }}
          </el-button>
        </slot>
      </div>
    </template>
  </el-dialog>
</template>

<style scoped lang="scss">
:deep(.el-dialog) {
  border-radius: 28px;
  overflow: hidden;
  border: 1px solid color-mix(in srgb, var(--el-border-color-light) 68%, white 32%);
  background:
    radial-gradient(circle at top right, color-mix(in srgb, var(--colors-primary) 8%, transparent), transparent 30%),
    linear-gradient(180deg, color-mix(in srgb, var(--el-bg-color) 97%, white 3%), var(--el-bg-color));
  box-shadow:
    0 24px 60px color-mix(in srgb, var(--colors-primary) 10%, transparent),
    0 10px 28px rgba(15, 23, 42, 0.08);
}

:deep(.el-dialog__header) {
  padding: 1rem 1.1rem 0.85rem;
  border-bottom: 1px solid color-mix(in srgb, var(--el-border-color-light) 62%, white 38%);
}

:deep(.el-dialog__body) {
  padding: 1rem 1.1rem 1.1rem;
}

:deep(.el-dialog__footer) {
  padding: 0.9rem 1.1rem 1.1rem;
  border-top: 1px solid color-mix(in srgb, var(--el-border-color-light) 62%, white 38%);
  background: color-mix(in srgb, var(--el-bg-color) 96%, white 4%);
}

.fullscreen-btn,
.close-btn {
  color: var(--el-color-info);
}
.fullscreen-btn:hover {
  color: var(--el-color-primary);
}
.close-btn:hover {
  color: var(--el-color-danger);
}

.my-dialog__secondary-btn,
.my-dialog__primary-btn {
  min-width: 88px;
  border-radius: 999px;
}
</style>
