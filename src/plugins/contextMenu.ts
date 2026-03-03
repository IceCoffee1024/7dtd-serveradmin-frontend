import type { MenuItem } from '@imengyu/vue3-context-menu';
import ContextMenu from '@imengyu/vue3-context-menu';
import { useZIndex } from 'element-plus';
import { h } from 'vue';
import { useTheme } from '~/composables';

export interface ContextMenuOption<T = any> {
  label?: string;
  icon?: Icon;
  disabled?: boolean | ((data?: T) => boolean);
  divided?: boolean;
  command?: (data?: T) => void | Promise<void>;
  children?: ContextMenuOption<T>[];
}

export interface ContextMenuConfig {
  x: number;
  y: number;
  zIndex?: number;
}

function transformMenuItems<T>(options: ContextMenuOption<T>[], data?: T): MenuItem[] {
  return options.map((item) => {
    const children = item.children ? transformMenuItems(item.children, data) : undefined;

    return {
      label: item.label,
      icon: item.icon ? h(item.icon) : undefined,
      disabled: typeof item.disabled === 'function' ? item.disabled(data) : item.disabled,
      children,
      onClick: () => {
        if (typeof item.command === 'function') {
          item.command(data);
        }
      },
    };
  });
}

export function showCustomContextMenu<T>(
  event: MouseEvent | { x: number; y: number },
  options: ContextMenuOption<T>[],
  data?: T,
) {
  const items = transformMenuItems(options, data);
  const { currentTheme, isDark } = useTheme();

  ContextMenu.showContextMenu({
    x: event.x,
    y: event.y,
    zIndex: useZIndex().nextZIndex(),
    theme: isDark.value ? `${currentTheme.value.general.contextMenuStyle} dark` : currentTheme.value.general.contextMenuStyle,
    items,
  });
}
