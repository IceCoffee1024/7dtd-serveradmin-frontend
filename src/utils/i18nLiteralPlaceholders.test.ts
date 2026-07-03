import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';
import { createI18n } from 'vue-i18n';
import { translateLiteralPlaceholders } from './i18nLiteralPlaceholders';

const TOKEN_PATTERN = /\{[a-z_]\w*\}/i;
const DIRECT_TRANSLATE_CALL_PATTERN = /(?:\b|\$)(?:t|tc)\(\s*(['"])([^'"]+)\1\s*\)/g;

function flattenLocaleMessages(value: unknown, prefix = '', output = new Map<string, string>()) {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    return output;

  for (const [key, child] of Object.entries(value)) {
    const childKey = prefix ? `${prefix}.${key}` : key;

    if (child && typeof child === 'object' && !Array.isArray(child)) {
      flattenLocaleMessages(child, childKey, output);
      continue;
    }

    if (typeof child === 'string')
      output.set(childKey, child);
  }

  return output;
}

function collectSourceFiles(directory: string, output: string[] = []) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === 'dist')
      continue;

    const fullPath = join(directory, entry.name);

    if (entry.isDirectory()) {
      collectSourceFiles(fullPath, output);
      continue;
    }

    if (/\.(?:ts|tsx|vue)$/.test(entry.name) && !entry.name.endsWith('.d.ts') && !entry.name.endsWith('.test.ts'))
      output.push(fullPath);
  }

  return output;
}

function createTranslator() {
  const i18n = createI18n({
    legacy: false,
    locale: 'zh-cn',
    messages: {
      'zh-cn': {
        tooltip: '支持占位符：{amount}, {currency}',
      },
    },
  });

  return i18n.global.t as (key: string, named?: Record<string, string>) => string;
}

describe('translateLiteralPlaceholders', () => {
  it('keeps placeholder tokens visible when the message is documentation text', () => {
    const t = createTranslator();

    expect(t('tooltip')).toBe('支持占位符：, ');

    const tooltip = translateLiteralPlaceholders(t, 'tooltip', ['amount', 'currency']);

    expect(tooltip).toBe('支持占位符：{amount}, {currency}');
  });

  it('does not call locale messages containing placeholders without named params', () => {
    const projectRoot = process.cwd();
    const localeDirectory = join(projectRoot, 'src/locales');
    const placeholderKeys = new Set<string>();
    const offenders: string[] = [];

    for (const localeFileName of readdirSync(localeDirectory).filter(fileName => fileName.endsWith('.json'))) {
      const localePath = join(localeDirectory, localeFileName);
      const localeMessages = JSON.parse(readFileSync(localePath, 'utf8')) as unknown;

      for (const [key, message] of flattenLocaleMessages(localeMessages).entries()) {
        if (TOKEN_PATTERN.test(message))
          placeholderKeys.add(key);
      }
    }

    for (const filePath of collectSourceFiles(join(projectRoot, 'src'))) {
      const source = readFileSync(filePath, 'utf8');

      for (const match of source.matchAll(DIRECT_TRANSLATE_CALL_PATTERN)) {
        const key = match[2];

        if (!placeholderKeys.has(key))
          continue;

        const line = source.slice(0, match.index ?? 0).split(/\r?\n/).length;
        offenders.push(`${relative(projectRoot, filePath).replaceAll('\\', '/')}:${line} ${key}`);
      }
    }

    expect(offenders).toEqual([]);
  });
});
