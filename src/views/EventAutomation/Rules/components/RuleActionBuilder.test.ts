import { flushPromises, mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { loadRewardPackageOptions } from '~/queries/rewardPackages';
import RuleActionBuilder from './RuleActionBuilder.vue';

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('~/queries/rewardPackages', () => ({
  loadRewardPackageOptions: vi.fn(),
}));

describe('rule action builder', () => {
  it('uses reward package options for ExecuteRewardPackage actions', async () => {
    vi.mocked(loadRewardPackageOptions).mockResolvedValue([
      { label: 'Starter Pack (starter)', value: 7 },
    ]);

    const wrapper = mount(RuleActionBuilder, {
      props: {
        modelValue: JSON.stringify([
          {
            type: 'ExecuteRewardPackage',
            target: 'TriggerPlayer',
            packageId: 7,
          },
        ]),
      },
      global: {
        stubs: {
          ElAlert: { template: '<div><slot /></div>' },
          ElButton: { template: '<button><slot /></button>' },
          ElCol: { template: '<div><slot /></div>' },
          ElEmpty: { template: '<div />' },
          ElCheckbox: { template: '<label><slot /></label>' },
          ElFormItem: {
            props: ['label'],
            template: '<label><span>{{ label }}</span><slot /></label>',
          },
          ElInput: { template: '<input />' },
          ElInputNumber: { template: '<input type="number" />' },
          ElOption: {
            props: ['label', 'value'],
            template: '<option :value="value">{{ label }}</option>',
          },
          ElRow: { template: '<div><slot /></div>' },
          ElSelect: { template: '<select><slot /></select>' },
        },
      },
    });
    await flushPromises();

    expect(loadRewardPackageOptions).toHaveBeenCalledWith(true);
    expect(wrapper.text()).toContain('Starter Pack (starter)');
    expect(wrapper.text()).toContain('views.eventAutomation.rules.builder.fields.rewardPackage');
  });
});
