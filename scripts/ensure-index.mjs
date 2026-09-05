#!/usr/bin/env node
/**
 * Hugo 叶子包要求目录内必须有 index.md。本脚本在构建前补齐：
 * 正文以「目录同名 .md」为准，复制/同步为 index.md。
 *
 * 选用规则：
 *   1. 优先同名文件：<目录名>.md（始终同步到 index.md）
 *   2. 否则若无可用 index.md，取排序后的第一个其他 .md
 *   3. 已有 _index.md 的分区目录跳过
 *
 * 用法（仓库根目录）：
 *   node scripts/ensure-index.mjs
 *   node scripts/ensure-index.mjs --dry-run
 */

import {
  existsSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { basename, dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CONTENT_DIR = join(ROOT, 'content');
const args = new Set(process.argv.slice(2));
const dryRun = args.has('--dry-run');

/** @param {string} filePath */
function isEmptyMarkdown(filePath) {
  if (!existsSync(filePath)) return true;
  const text = readFileSync(filePath, 'utf8').trim();
  return text.length === 0;
}

/**
 * @param {string} dir
 * @returns {string[]}
 */
function listMarkdownFiles(dir) {
  return readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isFile() && /\.md$/i.test(d.name))
    .map((d) => d.name)
    .sort((a, b) => a.localeCompare(b, 'en'));
}

/**
 * Windows 上部分特殊字符文件名比较需忽略大小写；
 * 目录名本身可含 #、空格、括号等，直接用 basename 拼接即可。
 * @param {string} a
 * @param {string} b
 */
function sameBaseName(a, b) {
  return a.localeCompare(b, undefined, { sensitivity: 'accent' }) === 0;
}

/**
 * @param {string} dir
 * @returns {{ source: string, alwaysSync: boolean } | null}
 */
function pickSourceMarkdown(dir) {
  const names = listMarkdownFiles(dir);
  const branchIndex = names.find((n) => /^_index\.md$/i.test(n));
  if (branchIndex) return null;

  const folderName = basename(dir);
  const candidates = names.filter(
    (n) => !/^index\.md$/i.test(n) && !/^_index\.md$/i.test(n),
  );

  const sameName = candidates.find((n) =>
    sameBaseName(n.slice(0, -3), folderName),
  );
  if (sameName) {
    return { source: join(dir, sameName), alwaysSync: true };
  }

  const indexName = names.find((n) => /^index\.md$/i.test(n));
  if (indexName && !isEmptyMarkdown(join(dir, indexName))) {
    return null;
  }

  if (candidates.length === 0) return null;

  if (candidates.length > 1) {
    const rel = relative(ROOT, dir);
    console.warn(
      `[ensure-index] ${rel}: 多个 .md（${candidates.join(', ')}），选用 ${candidates[0]}`,
    );
  }
  return { source: join(dir, candidates[0]), alwaysSync: false };
}

/**
 * @param {string} dir
 * @returns {string[]}
 */
function walkDirs(dir) {
  /** @type {string[]} */
  const out = [dir];
  for (const ent of readdirSync(dir, { withFileTypes: true })) {
    if (!ent.isDirectory()) continue;
    if (ent.name.startsWith('.')) continue;
    out.push(...walkDirs(join(dir, ent.name)));
  }
  return out;
}

/** @param {string} a @param {string} b */
function sameFileContent(a, b) {
  if (!existsSync(b)) return false;
  return Buffer.compare(readFileSync(a), readFileSync(b)) === 0;
}

function main() {
  if (!existsSync(CONTENT_DIR)) {
    console.error(`[ensure-index] 未找到 content 目录: ${CONTENT_DIR}`);
    process.exit(1);
  }

  let synced = 0;
  let skipped = 0;

  for (const dir of walkDirs(CONTENT_DIR)) {
    if (dir === CONTENT_DIR) continue;

    const picked = pickSourceMarkdown(dir);
    if (!picked) {
      skipped += 1;
      continue;
    }

    const { source, alwaysSync } = picked;
    const target = join(dir, 'index.md');
    const relSource = relative(ROOT, source);
    const relTarget = relative(ROOT, target);

    if (!alwaysSync && existsSync(target) && !isEmptyMarkdown(target)) {
      skipped += 1;
      continue;
    }

    if (sameFileContent(source, target)) {
      skipped += 1;
      continue;
    }

    if (dryRun) {
      console.log(`[dry-run] ${relSource} → ${relTarget}`);
      synced += 1;
      continue;
    }

    writeFileSync(target, readFileSync(source));
    const size = statSync(target).size;
    console.log(`[ensure-index] ${relSource} → ${relTarget} (${size} bytes)`);
    synced += 1;
  }

  const mode = dryRun ? '（dry-run）' : '';
  console.log(`[ensure-index] 完成${mode}：同步 ${synced}，跳过 ${skipped}`);
}

main();
