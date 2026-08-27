/**
 * `src/content/page-dates.ts` の初期値を git 履歴から一括生成する **使い捨てスクリプト**。
 *
 * **一度実行したら二度と実行しない。** 生成後は `page-dates.ts` が正で、
 * `updated` は「コンテンツを実質的に変えたときだけ手で上げる」運用に切り替わる
 * (docs/wip/20260828-seo-aeo-review/01-implementation-plan.md §C)。
 * 再実行すると手で直した `updated` が git の最終コミット日で潰れる。
 *
 *   node scripts/seed-page-dates.mjs > src/content/page-dates.ts
 *
 * 前提: `npm run build` 済み (`.next/server/app/sitemap.xml.body` から URL を読む)。
 */
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const SITEMAP = ".next/server/app/sitemap.xml.body";

/** path → 日付の根拠にするソースファイル。先に match したものを使う */
const SOURCE_RULES = [
  // 動的ルート: レッスンは 1 本 1 ファイルなので、そのファイルが根拠になる
  [/^\/fe\/algorithm\/lessons\/(.+)$/, (m) => `src/content/fe/lessons/${m[1]}.tsx`],
  [/^\/fe\/sql\/lessons\/(.+)$/, (m) => `src/content/fe/sql/lessons/${m[1]}.tsx`],
  [/^\/joho1\/lessons\/(.+)$/, (m) => `src/content/joho1/lessons/${m[1]}.tsx`],
  // クイズは 1 ファイルに全問入っている。slug で初出コミットを引く (published のみ精度が出る)
  [/^\/fe\/algorithm\/quiz\/(.+)$/, (m) => ["src/content/fe/quiz.ts", m[1]]],
  [/^\/fe\/sql\/quiz\/(.+)$/, (m) => ["src/content/fe/sql/quiz.ts", m[1]]],
  [/^\/joho1\/quiz\/(.+)$/, (m) => ["src/content/joho1/quiz.ts", m[1]]],
];

function sourceFor(path) {
  for (const [re, fn] of SOURCE_RULES) {
    const m = path.match(re);
    if (m) {
      const out = fn(m);
      return Array.isArray(out) ? { file: out[0], slug: out[1] } : { file: out };
    }
  }
  // 静的ルートは app ディレクトリがそのままパスに対応している
  const seg = path === "/" ? "(hub)" : path.slice(1);
  return { file: `src/app/${seg}/page.tsx`, alt: `src/app/(hub)/${seg}/page.tsx` };
}

function git(args) {
  try {
    return execFileSync("git", args, { encoding: "utf8" }).trim();
  } catch {
    return "";
  }
}

function dayOf(iso) {
  return iso ? iso.slice(0, 10) : "";
}

function datesFor({ file, alt, slug }) {
  let target = file;
  if (git(["log", "-1", "--format=%aI", "--", target]) === "" && alt) target = alt;

  const updated = dayOf(git(["log", "-1", "--format=%aI", "--", target]));

  let published;
  if (slug) {
    // その slug の文字列を最初に持ち込んだコミット
    const all = git(["log", "--reverse", "--format=%aI", `-S${slug}`, "--", target]);
    published = dayOf(all.split("\n")[0]);
  } else {
    // **`--follow` は `--reverse --diff-filter=A` と併用すると空を返す** (git の癖)。
    // 併用すると全ページが「最終更新日 = 公開日」に潰れるので、まず素で引く。
    const added = git([
      "log", "--diff-filter=A", "--reverse", "--format=%aI", "--", target,
    ]);
    published = dayOf(added.split("\n")[0]);
    if (!published) {
      // 素で取れないのはリネームで履歴が切れている場合。ここで初めて --follow を使う
      // (--reverse は付けられないので、最後の行が最初の追加になる)
      const followed = git([
        "log", "--follow", "--diff-filter=A", "--format=%aI", "--", target,
      ]).split("\n").filter(Boolean);
      published = dayOf(followed[followed.length - 1]);
    }
  }
  if (!published) published = updated;
  if (!updated) return null;
  // 履歴の取り方の違いで前後することがあるので必ず published <= updated にする
  return { published: published > updated ? updated : published, updated, target };
}

const xml = readFileSync(SITEMAP, "utf8");
const paths = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)]
  .map((m) => new URL(m[1]).pathname)
  .sort();

const rows = [];
const missing = [];
for (const p of paths) {
  const d = datesFor(sourceFor(p));
  if (!d) {
    missing.push(p);
    continue;
  }
  rows.push([p, d]);
}

if (missing.length) {
  process.stderr.write(`ソースを解決できなかった path:\n${missing.join("\n")}\n`);
}
process.stderr.write(`${rows.length} / ${paths.length} 件を生成\n`);

const body = rows
  .map(([p, d]) => `  "${p}": { published: "${d.published}", updated: "${d.updated}" },`)
  .join("\n");

process.stdout.write(`${body}\n`);
