import type { FormRules } from 'element-plus';
import type { AsyncComponentLoader, FunctionalComponent, SVGAttributes } from 'vue';
import { usePopup } from '~/composables/usePopup';
import { i18n } from '~/plugins/i18n';
import v from '~/plugins/valibot';

export function markIcon(loader: AsyncComponentLoader<FunctionalComponent<SVGAttributes>>) {
  return markRaw(defineAsyncComponent(loader));
}

export function generateElementRules(schema: any, defaultTrigger: 'blur' | 'change' = 'blur'): FormRules {
  const rules: FormRules = {};

  // Check if it's a valid Object Schema
  if (!schema || !schema.entries) {
    console.warn('Invalid Valibot schema provided to generateElementRules:', schema);
    return rules;
  }

  // Foreach field in the schema, generate an Element Plus rule that uses Valibot for validation
  for (const fieldName in schema.entries) {
    const fieldSchema = schema.entries[fieldName];

    rules[fieldName] = [
      {
        validator: (rule: any, value: any, callback: any) => {
          const result = v.safeParse(fieldSchema, value);
          if (result.success) {
            callback();
          }
          else {
            callback(new Error(result.issues[0].message));
          }
        },
        trigger: defaultTrigger,
      },
    ];
  }

  return rules;
}

/**
 * Converts a number of bytes to megabytes (MB).
 * @param {number} bytes - The number of bytes to convert.
 * @param {number} [decimalPlaces] - The number of decimal places to retain in the result, defaulting to 0.
 * @returns {number} The number of megabytes after conversion.
 */
export function bytesToMB(bytes: number, decimalPlaces = 0) {
  // Ensure the input is a valid number
  if (typeof bytes !== 'number' || Number.isNaN(bytes)) {
    return 0;
  }

  const megabytes = bytes / 1048576; // 1 MB = 1024 * 1024 bytes

  // Use the toFixed() method to control the number of decimal places
  return Number(megabytes.toFixed(decimalPlaces));
}

export function formatPosition(position: API.GameServer.Position | null | undefined) {
  if (!position)
    return '';
  return `${position.x}, ${position.y}, ${position.z}`;
}

export function formatMinute(totalMinute: number) {
  const { t } = i18n.global;
  if (totalMinute < 1) {
    return `${t('common.lessThan')} 1 ${t('common.minute')}`;
  }

  const day = Math.floor(totalMinute / 60 / 24);
  const hour = Math.floor((totalMinute / 60) % 24);
  const minute = Math.floor(totalMinute % 60);
  let result = '';
  if (day > 0) {
    result = `${day} ${t('common.day', day)} `;
  }
  if (hour > 0) {
    result += `${hour} ${t('common.hour', hour)} `;
  }
  if (minute > 0) {
    result += `${minute} ${t('common.minute', minute)} `;
  }
  return result;
}

export function searchByKeyword(data: any[], keyword: string, fields: string[] = []) {
  if (!keyword || !keyword.trim()) {
    return data;
  }

  const regex = new RegExp(keyword, 'i');

  return data.filter((item) => {
    const keysToSearch = fields.length ? fields : Object.keys(item);

    return keysToSearch.some((field) => {
      return item[field] != null && regex.test(item[field].toString());
    });
  });
}

export function orderByField(data: any[], field: string, desc: boolean = false) {
  if (!field) {
    return data;
  }
  return data.sort((a, b) => {
    if (!desc) {
      return a[field] > b[field] ? 1 : -1;
    }
    else if (desc) {
      return a[field] < b[field] ? 1 : -1;
    }
    return 0;
  });
}

const DEFAULT_COMMAND_ERROR_PATTERN = /not valid|not a valid|invalid|error|failed|unable|cannot|not found|does not exist/i;

/**
 * Displays a toast for a command-style API result and returns whether the result should be treated as successful.
 * @param result - The command result returned by the backend.
 * @param fallbackText - Fallback text to show when the result array is empty.
 * @param errorPattern - Optional pattern used to detect error-like messages.
 * @returns `true` when the result looks successful; otherwise `false`.
 */
export function showCommandResult(
  result: API.GameServer.CommandExecutionResult | undefined,
  fallbackText: string,
  errorPattern: RegExp = DEFAULT_COMMAND_ERROR_PATTERN,
): boolean {
  const { toast } = usePopup();
  const messages = Array.isArray(result) ? result.filter(Boolean) : [];
  const text = messages.join('\n').trim() || fallbackText;
  const isError = messages.some(message => errorPattern.test(message));

  toast({
    type: isError ? 'error' : 'success',
    text,
  });

  return !isError;
}
