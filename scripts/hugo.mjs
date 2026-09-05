#!/usr/bin/env node
/**
 * 构建/预览入口：先 ensure-index，再转调 hugo。
 *
 * 用法：
 *   node scripts/hugo.mjs server --buildDrafts
 *   node scripts/hugo.mjs --minify
 */

import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const ensure = join(ROOT, 'scripts', 'ensure-index.mjs');

const prep = spawnSync(process.execPath, [ensure], {
  cwd: ROOT,
  stdio: 'inherit',
});
if (prep.status !== 0) {
  process.exit(prep.status ?? 1);
}

const hugoArgs = process.argv.slice(2);
const result = spawnSync('hugo', hugoArgs, {
  cwd: ROOT,
  stdio: 'inherit',
  shell: true, // Windows 上便于找到 PATH 中的 hugo
});
process.exit(result.status ?? 1);
