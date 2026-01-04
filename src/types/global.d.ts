import type { FunctionalComponent, Raw, SVGAttributes } from 'vue';

declare global {
  type Icon = FunctionalComponent<SVGAttributes> | Raw<FunctionalComponent<SVGAttributes>>;
}
