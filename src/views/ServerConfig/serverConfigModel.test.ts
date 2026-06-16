import { describe, expect, it } from 'vitest';
import { buildServerConfigGroups, getServerConfigDisplayName } from './serverConfigModel';

function createTranslator(messages: Record<string, string>) {
  return {
    t: (key: string) => messages[key] ?? key,
    te: (key: string) => Object.prototype.hasOwnProperty.call(messages, key),
  };
}

describe('serverConfigModel', () => {
  it('uses translated group and description when available', () => {
    const groups = buildServerConfigGroups(
      { ServerName: 'My Server' },
      createTranslator({
        'views.serverConfig.settings.ServerName.group': 'Server',
        'views.serverConfig.settings.ServerName.desc': 'Server display name',
        'views.serverConfig.fallbackGroup': 'Other',
      }),
    );

    expect(groups).toEqual([
      {
        group: 'Server',
        children: [
          {
            name: 'ServerName',
            value: 'My Server',
            desc: 'Server display name',
            group: 'Server',
          },
        ],
      },
    ]);
  });

  it('falls back for unknown 7dtd serverconfig keys', () => {
    const groups = buildServerConfigGroups(
      { SandboxCode: 'AAAJABJACJADJARFBNC' },
      createTranslator({
        'views.serverConfig.fallbackGroup': 'Other',
      }),
    );

    expect(groups).toEqual([
      {
        group: 'Other',
        children: [
          {
            name: 'SandboxCode',
            value: 'AAAJABJACJADJARFBNC',
            desc: 'SandboxCode',
            group: 'Other',
          },
        ],
      },
    ]);
  });

  it('capitalizes server config display names without altering empty strings', () => {
    expect(getServerConfigDisplayName('serverName')).toBe('ServerName');
    expect(getServerConfigDisplayName('')).toBe('');
  });
});
