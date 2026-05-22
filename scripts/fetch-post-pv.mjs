#!/usr/bin/env node
/**
 * 从不蒜子 API 拉取各文章 page_pv，写入 data/postpageviews.json。
 * 首页「最热文章」在 Hugo 构建时读取该文件排序，无需浏览器实时请求。
 *
 * 用法（仓库根目录）：
 *   node scripts/fetch-post-pv.mjs
 *
 * 依赖：Node.js 18+、已安装 hugo 且能在 PATH 中执行。
 * HTTP 503 时若已有 data/postpageviews.json，则沿用该文上次的 pv。
 */

import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DATA_DIR = join(ROOT, 'data');
const OUT_FILE = join(DATA_DIR, 'postpageviews.json');
const BUSUANZI_URL = 'https://busuanzi.ibruce.info/busuanzi?jsonpCallback=BusuanziCallback';
const CONCURRENCY = 4;
const DELAY_MS = 120;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function parseBaseURL() {
  const toml = readFileSync(join(ROOT, 'hugo.toml'), 'utf8');
  const m = toml.match(/^\s*baseURL\s*=\s*["']([^"']+)["']/m);
  return m ? m[1] : 'https://ean7.top/';
}

/** @returns {{ title: string, permalink: string, rel: string, draft: boolean }[]} */
function listPostsFromHugo() {
  const csv = execSync('hugo list all', { cwd: ROOT, encoding: 'utf8' });
  const lines = csv.trim().split(/\r?\n/);
  const header = lines.shift();
  if (!header || !header.startsWith('path,')) {
    throw new Error('无法解析 hugo list 输出，请确认已安装 hugo');
  }
  const posts = [];
  for (const line of lines) {
    const row = parseCsvLine(line);
    if (row.length < 10) continue;
    const path = row[0];
    const title = row[2];
    const draft = row[6] === 'true';
    const permalink = row[7];
    const kind = row[8];
    const section = row[9];
    if (kind !== 'page' || section !== 'posts') continue;
    if (!path.startsWith('content/posts/') || path.endsWith('_index.md')) continue;
    if (draft) continue;
    let rel;
    try {
      rel = new URL(permalink).pathname;
      if (!rel.endsWith('/')) rel += '/';
    } catch {
      rel = permalink;
    }
    posts.push({ title, permalink, rel, draft });
  }
  return posts;
}

/** 简易 CSV 行解析（支持引号内逗号） */
function parseCsvLine(line) {
  const out = [];
  let cur = '';
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      inQ = !inQ;
      continue;
    }
    if (c === ',' && !inQ) {
      out.push(cur);
      cur = '';
      continue;
    }
    cur += c;
  }
  out.push(cur);
  return out;
}

class BusuanziHttpError extends Error {
  /** @param {number} status */
  constructor(status) {
    super(`HTTP ${status}`);
    this.name = 'BusuanziHttpError';
    this.status = status;
  }
}

/** @returns {Map<string, number>} permalink / rel → 上次 pv */
function loadPreviousPvMap() {
  const map = new Map();
  if (!existsSync(OUT_FILE)) return map;
  try {
    const data = JSON.parse(readFileSync(OUT_FILE, 'utf8'));
    for (const item of data.items || []) {
      const pv = Number(item.pv);
      if (!Number.isFinite(pv)) continue;
      if (item.permalink) map.set(item.permalink, pv);
      if (item.rel) map.set(item.rel, pv);
    }
  } catch {
    console.warn(`无法读取上次数据 ${OUT_FILE}，503 时将无法回退`);
  }
  return map;
}

function lookupPreviousPv(previous, permalink, rel) {
  if (previous.has(permalink)) return previous.get(permalink);
  if (rel && previous.has(rel)) return previous.get(rel);
  return undefined;
}

async function fetchPagePv(permalink) {
  const res = await fetch(BUSUANZI_URL, {
    headers: { Referer: permalink, 'User-Agent': 'YQisme.github.io-fetch-post-pv/1.0' },
  });
  if (!res.ok) throw new BusuanziHttpError(res.status);
  const text = await res.text();
  const m = text.match(/"page_pv"\s*:\s*(\d+)/);
  if (!m) throw new Error('JSONP 响应无效');
  return parseInt(m[1], 10);
}

async function mapPool(items, mapper, concurrency) {
  const results = new Array(items.length);
  let next = 0;
  async function worker() {
    while (true) {
      const i = next++;
      if (i >= items.length) return;
      results[i] = await mapper(items[i], i);
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, () => worker())
  );
  return results;
}

async function main() {
  const baseURL = parseBaseURL();
  const previousPv = loadPreviousPvMap();
  const posts = listPostsFromHugo();
  if (!posts.length) {
    console.warn('未找到已发布的 posts 文章');
  }
  console.log(`拉取 ${posts.length} 篇文章阅读量（Referer → 不蒜子）…`);
  if (previousPv.size) {
    console.log(`已加载上次 ${OUT_FILE}，HTTP 503 时将沿用对应 pv`);
  }

  const items = await mapPool(
    posts,
    async (p, i) => {
      if (i > 0) await sleep(DELAY_MS);
      let pv = 0;
      try {
        pv = await fetchPagePv(p.permalink);
        console.log(`  [${i + 1}/${posts.length}] ${p.title}: ${pv}`);
      } catch (e) {
        const is503 = e instanceof BusuanziHttpError && e.status === 503;
        const prev = is503 ? lookupPreviousPv(previousPv, p.permalink, p.rel) : undefined;
        if (is503 && prev !== undefined) {
          pv = prev;
          console.warn(
            `  [${i + 1}/${posts.length}] ${p.title}: 失败 (HTTP 503)，沿用上次 pv=${pv}`
          );
        } else {
          console.warn(`  [${i + 1}/${posts.length}] ${p.title}: 失败 (${e.message})`);
        }
      }
      return {
        rel: p.rel,
        permalink: p.permalink,
        title: p.title,
        pv,
      };
    },
    CONCURRENCY
  );

  items.sort((a, b) => b.pv - a.pv || a.title.localeCompare(b.title, 'zh'));

  const payload = {
    updatedAt: new Date().toISOString(),
    baseURL,
    items,
  };

  mkdirSync(DATA_DIR, { recursive: true });
  writeFileSync(OUT_FILE, JSON.stringify(payload, null, 2) + '\n', 'utf8');
  console.log(`\n已写入 ${OUT_FILE}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
