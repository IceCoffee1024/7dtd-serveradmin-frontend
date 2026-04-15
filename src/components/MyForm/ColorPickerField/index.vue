<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

interface Props {
  disabled?: boolean;
  placeholder?: string;
  clearable?: boolean;
  presets?: string[];
  isViewMode?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  placeholder: '',
  clearable: true,
  presets: () => [],
  isViewMode: false,
});

const modelValue = defineModel<string>({ default: '' });

const { t } = useI18n();

const FALLBACK_PRESETS = ['#FFFFFF', '#FFCC00', '#FF8C00', '#FF4D4D', '#00BB00', '#D00000', '#4DA3FF', '#8A5CF6'];
const HEX_BODY_REGEX = /[^0-9A-F]/gi;

const normalizedValue = computed<string>({
  get() {
    return normalizeColor(modelValue.value);
  },
  set(value) {
    modelValue.value = normalizeColor(value);
  },
});

const colorPickerValue = computed<string | null>({
  get() {
    return normalizedValue.value ? `#${normalizedValue.value}` : null;
  },
  set(value) {
    normalizedValue.value = value ?? '';
  },
});

const inputValue = computed<string>({
  get() {
    return normalizedValue.value;
  },
  set(value) {
    normalizedValue.value = value;
  },
});

const swatchStyle = computed(() => ({
  backgroundColor: colorPickerValue.value ?? 'transparent',
}));

const displayText = computed(() => colorPickerValue.value ?? t('common.unknown'));

const presetColors = computed(() => {
  const colors = props.presets.length > 0 ? props.presets : FALLBACK_PRESETS;
  return colors
    .map(color => normalizeColor(color))
    .filter((color, index, array) => color.length === 6 && array.indexOf(color) === index)
    .map(color => `#${color}`);
});

/**
 * Normalizes any supported input into an uppercase 6-digit hexadecimal string without '#'.
 * @param value - Raw text or color picker output.
 * @returns A normalized uppercase hex string, or an empty string when the value is blank.
 */
function normalizeColor(value: string | null | undefined): string {
  if (!value)
    return '';
  return value.replace(HEX_BODY_REGEX, '').slice(0, 6).toUpperCase();
}

function onPresetSelect(color: string): void {
  if (props.disabled || props.isViewMode)
    return;
  colorPickerValue.value = color;
}

function onClear(): void {
  normalizedValue.value = '';
}
</script>

<template>
  <div class="flex flex-col gap-2 w-full">
    <template v-if="isViewMode">
      <div class="flex gap-3 min-h-10 w-full items-center">
        <div
          class="border border-gray-300 rounded-lg bg-[length:12px_12px] bg-[linear-gradient(45deg,#f3f4f6_25%,transparent_25%,transparent_75%,#f3f4f6_75%,#f3f4f6),linear-gradient(45deg,#f3f4f6_25%,transparent_25%,transparent_75%,#f3f4f6_75%,#f3f4f6)] bg-[position:0_0,6px_6px] shrink-0 h-10 w-10 dark:border-gray-600 dark:bg-[linear-gradient(45deg,#374151_25%,transparent_25%,transparent_75%,#374151_75%,#374151),linear-gradient(45deg,#374151_25%,transparent_25%,transparent_75%,#374151_75%,#374151)]"
        >
          <div
            class="rounded-lg h-full w-full"
            :style="swatchStyle"
          />
        </div>
        <span class="text-sm text-gray-700 dark:text-gray-200">
          {{ displayText }}
        </span>
      </div>
    </template>

    <template v-else>
      <div class="flex flex-wrap gap-2 w-full items-center">
        <div
          class="border border-gray-300 rounded-lg bg-[length:12px_12px] bg-[linear-gradient(45deg,#f3f4f6_25%,transparent_25%,transparent_75%,#f3f4f6_75%,#f3f4f6),linear-gradient(45deg,#f3f4f6_25%,transparent_25%,transparent_75%,#f3f4f6_75%,#f3f4f6)] bg-[position:0_0,6px_6px] shrink-0 h-10 w-10 dark:border-gray-600 dark:bg-[linear-gradient(45deg,#374151_25%,transparent_25%,transparent_75%,#374151_75%,#374151),linear-gradient(45deg,#374151_25%,transparent_25%,transparent_75%,#374151_75%,#374151)]"
        >
          <div
            class="rounded-lg h-full w-full"
            :style="swatchStyle"
          />
        </div>

        <el-color-picker
          v-model="colorPickerValue"
          :disabled="disabled || isViewMode"
          :predefine="presetColors"
          color-format="hex"
          @active-change="(value) => { if (value) colorPickerValue = value }"
        />

        <el-input
          v-model="inputValue"
          :disabled="disabled || isViewMode"
          :placeholder="placeholder || t('components.colorPicker.placeholder')"
          maxlength="6"
          class="flex-1 min-w-44"
        >
          <template #prefix>
            <span class="text-gray-500 dark:text-gray-400">#</span>
          </template>
        </el-input>

        <IconButton
          v-if="clearable && !isViewMode"
          :disabled="disabled || !normalizedValue"
          plain
          border
          :tooltip-content="t('components.colorPicker.clear')"
          @click="onClear"
        >
          <icon-mdi-close />
        </IconButton>
      </div>

      <div class="flex flex-wrap gap-2 items-center">
        <span class="text-xs text-gray-500 dark:text-gray-400">
          {{ t('components.colorPicker.presets') }}
        </span>
        <button
          v-for="color in presetColors"
          :key="color"
          type="button"
          class="border border-gray-300 rounded-full h-6 w-6 transition-transform dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-110"
          :class="{ 'ring-2 ring-primary ring-offset-2 ring-offset-white dark:ring-offset-gray-900': color === colorPickerValue }"
          :disabled="disabled"
          :aria-label="color"
          :style="{ backgroundColor: color }"
          @click="onPresetSelect(color)"
        />
      </div>

      <p class="text-xs text-gray-500 dark:text-gray-400">
        {{ t('components.colorPicker.hint') }}
      </p>
    </template>
  </div>
</template>
