import type { FormControlDefinition, FormControlType } from './types';

import { builtinControls } from './builtinControls';
import { customControls } from './customControls';

/**
 * Resolves a control key to its runtime component definition.
 * Built-in Element Plus controls are checked first, then project custom controls.
 * @param type - Control key declared in the field schema.
 * @returns The resolved control definition, or `undefined` when the key is unknown.
 */
export function resolveFormControl(type: FormControlType): FormControlDefinition | undefined {
  return builtinControls[type as keyof typeof builtinControls] ?? customControls[type as keyof typeof customControls];
}
