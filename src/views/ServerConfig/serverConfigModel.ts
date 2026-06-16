import { groupBy } from 'es-toolkit';

export interface ServerConfigItem {
  name: string;
  value: string;
  desc: string;
  group: string;
}

export interface ServerConfigGroup {
  group: string;
  children: ServerConfigItem[];
}

export interface ServerConfigTranslator {
  t: (key: string) => string;
  te: (key: string) => boolean;
}

export function getServerConfigDisplayName(str: string) {
  if (!str) {
    return str;
  }
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function buildServerConfigGroups(
  data: Record<string, string>,
  translator: ServerConfigTranslator,
): ServerConfigGroup[] {
  const list: ServerConfigItem[] = Object.keys(data).map((key) => {
    const descKey = `views.serverConfig.settings.${key}.desc`;
    const groupKey = `views.serverConfig.settings.${key}.group`;

    return {
      name: key,
      value: data[key],
      desc: translator.te(descKey) ? translator.t(descKey) : key,
      group: translator.te(groupKey) ? translator.t(groupKey) : translator.t('views.serverConfig.fallbackGroup'),
    };
  });

  const grouped = groupBy(list, item => item.group);
  return Object.keys(grouped).map(key => ({
    group: key,
    children: grouped[key],
  }));
}
