import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const currentDir = path.dirname(fileURLToPath(import.meta.url));

describe('online player profile reset action', () => {
  it('force-kicks before resetting native profile data from the online list', () => {
    const source = readFileSync(path.join(currentDir, 'index.vue'), 'utf8');

    expect(source).toContain('label: t(\'views.playerList.resetProfile.onlineTitle\')');
    expect(source).toContain('resetPlayerProfile(row.playerId');
    expect(source).toContain('forceKickIfOnline: true');
    expect(source).toContain('kickReason: t(\'views.playerList.resetProfile.kickReason\')');
  });
});
