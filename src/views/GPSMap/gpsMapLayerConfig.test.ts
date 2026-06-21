import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { LAYER_ID } from './constants';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const localesDir = path.resolve(currentDir, '../../locales');

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

describe('gps map layer config', () => {
  it('defines a dedicated drone cluster layer id', () => {
    expect(LAYER_ID.DRONES_CLUSTER_LAYER).toBe('sdtd_drones_cluster_layer');
  });

  it('defines the drone label in every locale', () => {
    const localeFiles = readdirSync(localesDir)
      .filter(fileName => fileName.endsWith('.json'))
      .sort();

    for (const localeFile of localeFiles) {
      const messages = flattenMessages(JSON.parse(readFileSync(path.join(localesDir, localeFile), 'utf8')));

      expect(messages['views.map.drone'], `${localeFile} should define views.map.drone`).toEqual(expect.any(String));
      expect(messages['views.map.drone'], `${localeFile} should not leave views.map.drone empty`).not.toBe('');
    }
  });
});
