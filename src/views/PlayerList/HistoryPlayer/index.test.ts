import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const localesDir = path.resolve(currentDir, '../../../locales');

const requiredLocaleKeys = [
  'views.playerList.totalTimePlayed',
  'views.playerList.longestLife',
  'components.playerDetailsDialog.score',
  'components.playerDetailsDialog.distanceWalked',
  'components.playerDetailsDialog.totalItemsCrafted',
  'components.playerDetailsDialog.currentLife',
];

function flattenMessages(source: unknown, prefix = '', output: Record<string, unknown> = {}) {
  if (source === null || typeof source !== 'object' || Array.isArray(source)) {
    return output;
  }

  for (const [key, value] of Object.entries(source)) {
    const pathKey = prefix ? `${prefix}.${key}` : key;
    if (value !== null && typeof value === 'object' && Array.isArray(value) === false) {
      flattenMessages(value, pathKey, output);
      continue;
    }

    output[pathKey] = value;
  }

  return output;
}

describe('history player locale keys', () => {
  it('defines every table column label used by the page', () => {
    const localeFiles = readdirSync(localesDir)
      .filter(fileName => fileName.endsWith('.json'))
      .sort();

    for (const localeFile of localeFiles) {
      const messages = flattenMessages(JSON.parse(readFileSync(path.join(localesDir, localeFile), 'utf8')));

      for (const key of requiredLocaleKeys) {
        expect(messages[key], `${localeFile} should define ${key}`).toEqual(expect.any(String));
        expect(messages[key], `${localeFile} should not leave ${key} empty`).not.toBe('');
      }
    }
  });
});

describe('history player details action', () => {
  it('opens player details dialog with the cached history source', () => {
    const source = readFileSync(path.join(currentDir, 'index.vue'), 'utf8');

    expect(source).toContain("playerDetailsDialogRef.value?.open(row.playerId, row.playerName, 'history')");
  });
});

describe('history player ranking fields', () => {
  it('shows and sorts every persisted ranking field from history snapshots', () => {
    const source = readFileSync(path.join(currentDir, 'index.vue'), 'utf8');

    for (const field of ['score', 'distanceWalked', 'totalItemsCrafted', 'currentLife']) {
      expect(source, `missing column for ${field}`).toContain(`prop: '${field}'`);
    }

    expect(source).toContain("case 'score': return 'Score'");
    expect(source).toContain("case 'distanceWalked': return 'DistanceWalked'");
    expect(source).toContain("case 'totalItemsCrafted': return 'TotalItemsCrafted'");
    expect(source).toContain("case 'currentLife': return 'CurrentLife'");
  });
});
