import type { CustomControlType, FormControlDefinition } from './types';

import { defineAsyncComponent } from 'vue';

/**
 * Custom control map for project-specific form widgets.
 * These controls are lazy-loaded to keep the base form shell lightweight.
 */
export const customControls = {
  upload: {
    component: defineAsyncComponent(() => import('../../UploadField/index.vue')),
  },
} as const satisfies Partial<Record<CustomControlType, FormControlDefinition>>;
