import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const localesDir = path.resolve(currentDir, '../src/locales');
const baseLocaleFile = 'en.json';
const placeholderPattern = /\{[^}]+\}/g;

function flattenMessages(source, prefix = '', output = {}) {
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

function readLocaleMessages(fileName) {
  const filePath = path.join(localesDir, fileName);
  return JSON.parse(readFileSync(filePath, 'utf8'));
}

function readPlaceholders(message) {
  if (typeof message !== 'string') {
    return [];
  }

  return [...message.matchAll(placeholderPattern)].map(([token]) => token).sort();
}

const localeFiles = readdirSync(localesDir)
  .filter(fileName => fileName.endsWith('.json'))
  .sort();

if (localeFiles.includes(baseLocaleFile) === false) {
  console.error(`[locale-check] Missing base locale file: ${baseLocaleFile}`);
  process.exit(1);
}

const baseMessages = flattenMessages(readLocaleMessages(baseLocaleFile));
const baseKeys = Object.keys(baseMessages).sort();
const failures = [];

for (const localeFile of localeFiles) {
  const localeMessages = flattenMessages(readLocaleMessages(localeFile));
  const localeKeys = Object.keys(localeMessages).sort();
  const isScaffoldLocale = localeKeys.length > 0 && localeKeys.every(key => typeof localeMessages[key] === 'string' && localeMessages[key] === '');

  console.log(`[locale-check] ${localeFile}: ${localeKeys.length} leaf keys`);
  if (isScaffoldLocale) {
    console.log(`[locale-check] ${localeFile} is a scaffold locale; placeholder checks are skipped.`);
  }

  if (localeFile === baseLocaleFile) {
    continue;
  }

  const missingKeys = baseKeys.filter(key => key in localeMessages === false);
  const extraKeys = localeKeys.filter(key => key in baseMessages === false);
  const placeholderMismatches = isScaffoldLocale
    ? []
    : baseKeys
        .filter(key => key in localeMessages)
        .filter((key) => {
          const expected = JSON.stringify(readPlaceholders(baseMessages[key]));
          const actual = JSON.stringify(readPlaceholders(localeMessages[key]));
          return expected !== actual;
        })
        .map(key => ({
          key,
          expected: readPlaceholders(baseMessages[key]),
          actual: readPlaceholders(localeMessages[key]),
        }));

  if (missingKeys.length === 0 && extraKeys.length === 0 && placeholderMismatches.length === 0) {
    continue;
  }

  failures.push({
    localeFile,
    missingKeys,
    extraKeys,
    placeholderMismatches,
  });
}

if (failures.length === 0) {
  console.log(`[locale-check] All locale files are aligned with ${baseLocaleFile}.`);
  process.exit(0);
}

for (const failure of failures) {
  console.error(`\n[locale-check] ${failure.localeFile} is out of sync with ${baseLocaleFile}.`);

  if (failure.missingKeys.length > 0) {
    console.error('[locale-check] Missing keys:');
    for (const key of failure.missingKeys) {
      console.error(`  - ${key}`);
    }
  }

  if (failure.extraKeys.length > 0) {
    console.error('[locale-check] Extra keys:');
    for (const key of failure.extraKeys) {
      console.error(`  - ${key}`);
    }
  }

  if (failure.placeholderMismatches.length > 0) {
    console.error('[locale-check] Placeholder mismatches:');
    for (const mismatch of failure.placeholderMismatches) {
      console.error(`  - ${mismatch.key}`);
      console.error(`    expected: ${mismatch.expected.join(', ') || '(none)'}`);
      console.error(`    actual:   ${mismatch.actual.join(', ') || '(none)'}`);
    }
  }
}

process.exit(1);
