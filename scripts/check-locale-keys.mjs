#!/usr/bin/env node
// CI check: every locale file must have exactly the same keys as locales/en.json (the source).
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

export function flattenKeys(value, prefix = '') {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    return [prefix];
  }
  return Object.entries(value).flatMap(([key, child]) =>
    flattenKeys(child, prefix ? `${prefix}.${key}` : key),
  );
}

export function compareLocales(source, target) {
  const sourceKeys = new Set(flattenKeys(source));
  const targetKeys = new Set(flattenKeys(target));
  return {
    missing: [...sourceKeys].filter((key) => !targetKeys.has(key)).sort(),
    extra: [...targetKeys].filter((key) => !sourceKeys.has(key)).sort(),
  };
}

function main() {
  const dir = fileURLToPath(new URL('../locales', import.meta.url));
  const read = (file) => JSON.parse(readFileSync(join(dir, file), 'utf8'));
  const source = read('en.json');
  const others = readdirSync(dir).filter((file) => file.endsWith('.json') && file !== 'en.json');
  let failed = false;
  for (const file of others) {
    const { missing, extra } = compareLocales(source, read(file));
    for (const key of missing) console.error(`${file}: missing key "${key}"`);
    for (const key of extra) console.error(`${file}: key "${key}" is not in en.json`);
    failed ||= missing.length > 0 || extra.length > 0;
  }
  if (failed) process.exit(1);
  console.log(`Locale keys match en.json in: ${others.join(', ')}`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
