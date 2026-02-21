import type { FormRules } from 'element-plus';
import type { AsyncComponentLoader, FunctionalComponent, SVGAttributes } from 'vue';
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
