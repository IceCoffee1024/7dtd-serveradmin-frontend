import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const localesDir = path.resolve(currentDir, '../../../locales');

const requiredLocaleKeys = [
  'views.playerList.totalTimePlayed',
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
