import axios from 'axios';
import { load } from 'cheerio';
import fs from 'fs';
import path from 'path';

const CATALOG_URLS = [
  'https://www.furukawa.co.jp/en/product/catalogue/',
  'https://www.furukawa.co.jp/en/product/catalogue/#anchor_1_1',
  'https://www.furukawa.co.jp/en/product/catalogue/#anchor_1_2',
  'https://www.furukawa.co.jp/en/product/catalogue/#anchor_1_4',
];

function stripPdfSuffix(name) {
  if (!name) return '';
  return name.replace(/\s*\(PDF[^)]*\)\s*$/i, '').trim();
}

function makeSku(name) {
  const base = name.toUpperCase();
  // Try to find model-like tokens containing letters+digits (and hyphens)
  const matches = base.match(/[A-Z0-9-]{3,}/g) || [];
  const withDigits = matches.filter(m => /\d/.test(m));
  // Prefer tokens that look like product codes (contain digits)
  const candidate = withDigits.sort((a, b) => b.length - a.length)[0] || matches.sort((a, b) => b.length - a.length)[0];
  const cleaned = (candidate || base)
    .replace(/[^A-Z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40);
  return cleaned || 'FURUKAWA-ITEM';
}

function escapeSqlString(str) {
  return str.replace(/'/g, "''");
}

async function fetchHtml(url) {
  const res = await axios.get(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; ITFACT-ERP-Ingest/1.0)',
      'Accept-Language': 'en-US,en;q=0.9',
    },
    timeout: 30000,
  });
  return res.data;
}

async function extractItemsFromPage(url) {
  const html = await fetchHtml(url);
  const $ = load(html);
  const items = [];
  $('a[href$=".pdf"]').each((_, el) => {
    const text = $(el).text().trim();
    if (!text) return;
    const name = stripPdfSuffix(text);
    if (!name) return;
    const sku = makeSku(name);
    items.push({ name, sku });
  });
  return items;
}

async function main() {
  const all = [];
  for (const url of CATALOG_URLS) {
    try {
      const items = await extractItemsFromPage(url);
      all.push(...items);
    } catch (err) {
      console.error('Failed to extract from', url, err.message);
    }
  }

  // Deduplicate by SKU
  const seen = new Set();
  const unique = [];
  for (const it of all) {
    if (!seen.has(it.sku)) {
      seen.add(it.sku);
      unique.push(it);
    }
  }

  if (unique.length === 0) {
    console.error('No items extracted from Furukawa catalog pages.');
    process.exit(2);
  }

  const deletes = unique.map(it => `'$${escapeSqlString(it.sku)}$`.replace(/\$/g, "'")); // ensure proper quoting
  const values = unique.map(it => `('${escapeSqlString(it.name)}','${escapeSqlString(it.sku)}',0,0)`).join(',\n');

  const sql = `BEGIN;\n\nDELETE FROM materials WHERE sku IN (${unique.map(it => `'${escapeSqlString(it.sku)}'`).join(',')});\n\nINSERT INTO materials (name, sku, "unitPrice", "stockQuantity") VALUES\n${values};\n\nCOMMIT;\n`;

  const outPath = path.join('db', 'seeds', 'materials_furukawa_full.sql');
  fs.writeFileSync(outPath, sql, 'utf-8');
  console.log(`Wrote ${unique.length} items to ${outPath}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});