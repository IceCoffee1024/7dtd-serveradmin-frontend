import type { RouteLocationNormalized } from 'vue-router';
import { defineStore } from 'pinia';
import { useRoute, useRouter } from 'vue-router';
import { useMenus } from '~/composables';
import { useKeepAliveStore } from '~/stores/keepAlive';

export interface TabItem {
  title: string;
  name: string;
  closable?: boolean;
  icon?: Icon;
}

export const useNavTabStore = defineStore('nav-tab', () => {
  const route = useRoute();
  const router = useRouter();

  const keepAliveStore = useKeepAliveStore();
  const { menus } = useMenus();

  const activeTab = ref<string>('');
  const tabsList = ref<string[]>([]);

  function findMenuByKey(menus: App.Menu[], key: string): App.Menu | null {
    for (const menu of menus) {
      if (menu.index === key) {
        return menu;
      }
      if (menu.children && menu.children.length) {
        const found = findMenuByKey(menu.children, key);
        if (found)
          return found;
      }
    }
    return null;
  }

  const getOpenedTabs = () => {
    const result = tabsList.value.map((name) => {
      const menu = findMenuByKey(menus.value, name);
      if (!menu) {
        return null;
      }
      return {
        title: menu.label,
        name: menu.index,
        closable: true,
        icon: menu.icon,
      } as TabItem;
    }).filter(item => item !== null) as TabItem[];

    if (result.length === 1) {
      result[0].closable = false;
    }

    return result;
  };

  function addTab(route: RouteLocationNormalized) {
    const { name } = route;
    if (!name)
      return;

    activeTab.value = name as string;

    const isExist = tabsList.value.includes(activeTab.value);
    if (isExist)
      return;

    tabsList.value.push(activeTab.value);
  }

  function removeCachedViews(names: string[]) {
    names.forEach(name => keepAliveStore.removeCachedView(name));
  }

  async function removeTab(targetName: string) {
    const index = tabsList.value.findIndex(item => item === targetName);
    if (index === -1)
      return;

    if (activeTab.value === targetName) {
      const nextTab = tabsList.value[index + 1] || tabsList.value[index - 1];
      if (nextTab) {
        activeTab.value = nextTab;
        await router.push({ name: nextTab });
      }
    }

    tabsList.value = tabsList.value.filter(item => item !== targetName);
    keepAliveStore.removeCachedView(targetName);
  }

  async function closeOtherTabs(currentName: string) {
    const closedTabs = tabsList.value.filter(item => item !== currentName);
    removeCachedViews(closedTabs);
    tabsList.value = tabsList.value.filter(item => item === currentName);

    if (activeTab.value !== currentName) {
      activeTab.value = currentName;
      await router.push({ name: currentName });
    }
  }

  async function closeLeftTabs(currentName: string) {
    const index = tabsList.value.findIndex(item => item === currentName);
    if (index === -1)
      return;

    const closedTabs = tabsList.value.slice(0, index);
    removeCachedViews(closedTabs);
    tabsList.value = tabsList.value.slice(index);

    if (!tabsList.value.includes(activeTab.value)) {
      activeTab.value = currentName;
    }
  }

  async function closeRightTabs(currentName: string) {
    const index = tabsList.value.findIndex(item => item === currentName);
    if (index === -1)
      return;

    const closedTabs = tabsList.value.slice(index + 1);
    removeCachedViews(closedTabs);
    tabsList.value = tabsList.value.slice(0, index + 1);

    if (!tabsList.value.includes(activeTab.value)) {
      activeTab.value = currentName;
    }
  }

  async function closeAllTabs() {
    tabsList.value.forEach((name) => {
      keepAliveStore.removeCachedView(name);
    });

    const firstTab = tabsList.value[0];
    tabsList.value = [firstTab];

    if (activeTab.value === firstTab) {
      return;
    }

    activeTab.value = firstTab;
    await router.push({ name: firstTab });
  }

  watch(
    () => route.name,
    () => {
      addTab(route);
    },
    { immediate: true },
  );

  watch(activeTab, (newVal) => {
    router.push({ name: newVal });
  });

  return {
    tabsList,
    activeTab,
    addTab,
    removeTab,
    closeOtherTabs,
    closeLeftTabs,
    closeRightTabs,
    closeAllTabs,
    getOpenedTabs,
  };
});
