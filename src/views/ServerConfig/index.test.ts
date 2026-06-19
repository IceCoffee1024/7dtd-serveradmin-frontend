import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { nextTick, ref } from 'vue';
import ServerConfig from './index.vue';

const queryState = {
  data: ref<Record<string, string> | null>(null),
};

vi.mock('@pinia/colada', () => ({
  useMutation: () => ({
    mutateAsync: vi.fn(),
  }),
  useQuery: () => ({
    data: queryState.data,
    refetch: vi.fn(async () => ({ status: 'success', data: queryState.data.value })),
  }),
}));

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    locale: ref('en'),
    t: (key: string) => {
      const messages: Record<string, string> = {
        'views.serverConfig.settings.ServerName.group': 'Server',
        'views.serverConfig.settings.ServerName.desc': 'Server display name',
        'views.serverConfig.fallbackGroup': 'Other',
        'common.edit': 'Edit',
      };
      return messages[key] ?? key;
    },
    te: (key: string) => [
      'views.serverConfig.settings.ServerName.group',
      'views.serverConfig.settings.ServerName.desc',
      'views.serverConfig.fallbackGroup',
      'common.edit',
    ].includes(key),
  }),
}));

vi.mock('~/composables', () => ({
  usePopup: () => ({
    prompt: vi.fn(),
  }),
}));

vi.mock('~/generated/api/@pinia/colada.gen', () => ({
  gameServerSettingsGetQuery: vi.fn(() => ({})),
  gameServerSettingsPutMutation: vi.fn(() => ({})),
}));

vi.mock('~/queries/generated', () => ({
  invalidateGeneratedQueries: vi.fn(),
}));

const renderedRows: unknown[] = [];

describe('serverConfig page', () => {
  it('uses fallback text for unknown serverconfig keys instead of rendering raw i18n keys', async () => {
    renderedRows.length = 0;
    queryState.data.value = {
      ServerName: 'My Server',
      SandboxCode: 'AAAJABJACJADJARFBNC',
    };

    const wrapper = mount(ServerConfig, {
      global: {
        stubs: {
          'ElCard': { template: '<section><slot /></section>' },
          'ElCollapse': { template: '<div><slot /></div>' },
          'ElCollapseItem': {
            props: ['title'],
            template: '<article><h2>{{ title }}</h2><slot /></article>',
          },
          'ElTable': {
            props: ['data'],
            setup(props) {
              renderedRows.push(...props.data);
              return () => null;
            },
          },
          'ElTableColumn': true,
          'ElTag': { template: '<span><slot /></span>' },
          'IconButton': { template: '<button><slot /></button>' },
          'icon-mdi:pencil': true,
        },
        mocks: {
          $t: (key: string) => key,
        },
      },
    });

    await nextTick();

    expect(wrapper.text()).toContain('Server');
    expect(wrapper.text()).toContain('Other');
    expect(renderedRows).toEqual(expect.arrayContaining([
      expect.objectContaining({
        name: 'SandboxCode',
        desc: 'SandboxCode',
        group: 'Other',
      }),
    ]));
    expect(wrapper.text()).not.toContain('views.serverConfig.settings.SandboxCode');
  });
});
