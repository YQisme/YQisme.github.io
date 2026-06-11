#!/usr/bin/env node
/**
 * 从不蒜子 API 拉取站点 site_pv / site_uv 与各文章 page_pv，写入 data/postpageviews.json。
 * 首页「最热文章」在 Hugo 构建时读取该文件排序，无需浏览器实时请求。
 *
 * 用法（仓库根目录）：
 *   node scripts/fetch-post-pv.mjs
 *
 * 依赖：Node.js 18+、已安装 hugo 且能在 PATH 中执行。
 * 拉取失败或返回 0 时，若已有 data/postpageviews.json 中的有效值，则沿用上次记录。
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

/** @returns {{ map: Map<string, number>, updatedAt: string | null, sitePv?: number, siteUv?: number }} */
function loadPreviousData() {
  const map = new Map();
  let updatedAt = null;
  let sitePv;
  let siteUv;
  if (!existsSync(OUT_FILE)) return { map, updatedAt, sitePv, siteUv };
  try {
    const data = JSON.parse(readFileSync(OUT_FILE, 'utf8'));
    updatedAt = data.updatedAt || null;
    const prevSitePv = Number(data.site_pv);
    const prevSiteUv = Number(data.site_uv);
    if (Number.isFinite(prevSitePv) && prevSitePv > 0) sitePv = prevSitePv;
    if (Number.isFinite(prevSiteUv) && prevSiteUv > 0) siteUv = prevSiteUv;
    for (const item of data.items || []) {
      const pv = Number(item.pv);
      if (!Number.isFinite(pv) || pv <= 0) continue;
      if (item.permalink) map.set(item.permalink, pv);
      if (item.rel) map.set(item.rel, pv);
    }
  } catch {
    console.warn(`无法读取上次数据 ${OUT_FILE}，失败时将无法回退`);
  }
  return { map, updatedAt, sitePv, siteUv };
}

/** @param {number | undefined} prev @param {number} next */
function formatDelta(prev, next) {
  if (prev === undefined) return '新';
  const d = next - prev;
  if (d === 0) return '=';
  if (d > 0) return `+${d}`;
  return String(d);
}

/** @param {number | undefined} prev @param {number} next */
function formatPvCompare(prev, next) {
  if (prev === undefined) return `${next} (新)`;
  const delta = formatDelta(prev, next);
  if (delta === '=') return `${prev} → ${next} (=)`;
  return `${prev} → ${next} (${delta})`;
}

/** @param {string | null} previousUpdatedAt @param {{ sitePv?: number, siteUv?: number }} previousSite @param {{ site_pv: number, site_uv: number }} site @param {Map<string, number>} previousPv @param {{ title: string, permalink: string, rel: string, pv: number }[]} items */
function printComparisonSummary(previousUpdatedAt, previousSite, site, previousPv, items) {
  console.log('\n=== 站点统计对比 ===');
  console.log(`上次更新: ${previousUpdatedAt || '（无历史数据）'}`);
  console.log(`本次更新: ${new Date().toISOString()}`);
  console.log('');
  console.log(`总访问量  ${formatPvCompare(previousSite.sitePv, site.site_pv)}`);
  console.log(`访客数    ${formatPvCompare(previousSite.siteUv, site.site_uv)}`);

  console.log('\n=== 文章阅读量对比 ===');

  const titleWidth = Math.max(4, ...items.map((i) => i.title.length));
  const head = `${'标题'.padEnd(titleWidth)}  上次    最新    变化`;
  console.log(head);
  console.log('-'.repeat(head.length));

  let totalPrev = 0;
  let totalNew = 0;
  let hasPrev = false;

  for (const item of items) {
    const prev = lookupPreviousPv(previousPv, item.permalink, item.rel);
    const prevStr = prev === undefined ? '—' : String(prev);
    const delta = formatDelta(prev, item.pv);
    if (prev !== undefined) {
      totalPrev += prev;
      hasPrev = true;
    }
    totalNew += item.pv;
    console.log(
      `${item.title.padEnd(titleWidth)}  ${prevStr.padStart(4)}  ${String(item.pv).padStart(4)}  ${delta}`
    );
  }

  if (hasPrev) {
    console.log('-'.repeat(head.length));
    const totalDelta = formatDelta(totalPrev, totalNew);
    console.log(
      `${'合计'.padEnd(titleWidth)}  ${String(totalPrev).padStart(4)}  ${String(totalNew).padStart(4)}  ${totalDelta}`
    );
  }
}

function lookupPreviousPv(previous, permalink, rel) {
  if (previous.has(permalink)) return previous.get(permalink);
  if (rel && previous.has(rel)) return previous.get(rel);
  return undefined;
}

/** 拉取失败或结果为 0 时，若有有效上次 pv 则沿用，不允许覆盖为 0 */
function resolvePv(fetched, prevPv) {
  if (Number.isFinite(fetched) && fetched > 0) return fetched;
  if (prevPv !== undefined && prevPv > 0) return prevPv;
  return Number.isFinite(fetched) ? fetched : 0;
}

/** @param {string} text */
function parseBusuanziJsonp(text) {
  /** @param {string} key */
  const pick = (key) => {
    const m = text.match(new RegExp(`"${key}"\\s*:\\s*(\\d+)`));
    return m ? parseInt(m[1], 10) : undefined;
  };
  return {
    site_pv: pick('site_pv'),
    site_uv: pick('site_uv'),
    page_pv: pick('page_pv'),
  };
}

async function fetchBusuanzi(permalink) {
  const res = await fetch(BUSUANZI_URL, {
    headers: { Referer: permalink, 'User-Agent': 'YQisme.github.io-fetch-post-pv/1.0' },
  });
  if (!res.ok) throw new BusuanziHttpError(res.status);
  return parseBusuanziJsonp(await res.text());
}

async function fetchPagePv(permalink) {
  const data = await fetchBusuanzi(permalink);
  if (!Number.isFinite(data.page_pv)) throw new Error('JSONP 响应无效');
  return data.page_pv;
}

/** @returns {{ site_pv: number, site_uv: number }} */
async function fetchSiteStats(permalink) {
  const data = await fetchBusuanzi(permalink);
  if (!Number.isFinite(data.site_pv) && !Number.isFinite(data.site_uv)) {
    throw new Error('JSONP 响应无效');
  }
  return {
    site_pv: data.site_pv ?? 0,
    site_uv: data.site_uv ?? 0,
  };
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
  const {
    map: previousPv,
    updatedAt: previousUpdatedAt,
    sitePv: previousSitePv,
    siteUv: previousSiteUv,
  } = loadPreviousData();
  const posts = listPostsFromHugo();
  if (!posts.length) {
    console.warn('未找到已发布的 posts 文章');
  }

  console.log(`拉取站点总访问量与访客数（Referer: ${baseURL}）…`);
  let fetchedSite = { site_pv: 0, site_uv: 0 };
  let siteErrMsg = null;
  try {
    fetchedSite = await fetchSiteStats(baseURL);
  } catch (e) {
    siteErrMsg = e.message;
  }
  const site_pv = resolvePv(fetchedSite.site_pv, previousSitePv);
  const site_uv = resolvePv(fetchedSite.site_uv, previousSiteUv);
  if (siteErrMsg) {
    if ((site_pv > 0 && site_pv !== fetchedSite.site_pv) || (site_uv > 0 && site_uv !== fetchedSite.site_uv)) {
      console.warn(
        `  站点统计失败 (${siteErrMsg})，沿用上次 总访问量 ${formatPvCompare(previousSitePv, site_pv)}，访客数 ${formatPvCompare(previousSiteUv, site_uv)}`
      );
    } else {
      console.warn(`  站点统计失败 (${siteErrMsg})`);
    }
  } else {
    const sitePvNote =
      fetchedSite.site_pv === 0 && site_pv > 0 ? '，总访问量沿用上次' : '';
    const siteUvNote =
      fetchedSite.site_uv === 0 && site_uv > 0 ? '，访客数沿用上次' : '';
    console.log(
      `  总访问量 ${formatPvCompare(previousSitePv, site_pv)}${sitePvNote}，访客数 ${formatPvCompare(previousSiteUv, site_uv)}${siteUvNote}`
    );
  }

  console.log(`\n拉取 ${posts.length} 篇文章阅读量（Referer → 不蒜子）…`);
  if (previousPv.size || previousSitePv !== undefined || previousSiteUv !== undefined) {
    console.log(`已加载上次 ${OUT_FILE}（${previousUpdatedAt || '未知时间'}），失败或返回 0 时将沿用对应记录`);
  }

  const items = await mapPool(
    posts,
    async (p, i) => {
      if (i > 0) await sleep(DELAY_MS);
      const prevPv = lookupPreviousPv(previousPv, p.permalink, p.rel);
      let fetched = 0;
      let errMsg = null;
      try {
        fetched = await fetchPagePv(p.permalink);
      } catch (e) {
        errMsg = e.message;
      }
      const pv = resolvePv(fetched, prevPv);
      const tag = `[${i + 1}/${posts.length}] ${p.title}:`;
      if (errMsg) {
        if (pv > 0 && pv !== fetched) {
          console.warn(`  ${tag} 失败 (${errMsg})，沿用上次 ${formatPvCompare(prevPv, pv)}`);
        } else {
          console.warn(`  ${tag} 失败 (${errMsg})`);
        }
      } else if (fetched === 0 && pv > 0) {
        console.warn(`  ${tag} 返回 0，沿用上次 ${formatPvCompare(prevPv, pv)}`);
      } else {
        console.log(`  ${tag} ${formatPvCompare(prevPv, pv)}`);
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

  printComparisonSummary(
    previousUpdatedAt,
    { sitePv: previousSitePv, siteUv: previousSiteUv },
    { site_pv, site_uv },
    previousPv,
    items
  );

  const payload = {
    updatedAt: new Date().toISOString(),
    baseURL,
    site_pv,
    site_uv,
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
