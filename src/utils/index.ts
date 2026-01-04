import type { AsyncComponentLoader, FunctionalComponent, SVGAttributes } from 'vue';

export function markIcon(loader: AsyncComponentLoader<FunctionalComponent<SVGAttributes>>) {
  return markRaw(defineAsyncComponent(loader));
}
