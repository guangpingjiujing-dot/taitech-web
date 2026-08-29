/**
 * ページごとの公開日 / 最終更新日。**JSON-LD と可視表示と sitemap の唯一の正。**
 *
 * ## なぜこれがあるか
 *
 * 以前は `JsonLd.tsx` の `BUILD_DATE`（= ビルド時刻）を全ページに配っていたため、
 * **ビルドするたび 144 URL 全部が「今日更新」**になっていた。`sitemap.ts` の
 * `lastModified` も `now` で同じ。実際の更新頻度の情報が失われるうえ、
 * ページに更新日表示が無い状態で全ページ今日更新を主張するのは
 * 「構造化データは可視情報と一致している必要がある」という原則からも外れる
 * (docs/wip/20260828-seo-aeo-review/00-review.md §4)。
 *
 * ## なぜ path をキーにした 1 枚なのか
 *
 * `topics.*.ts` の各オブジェクトに生やす案を取らなかった理由:
 *
 * 1. 日付は 4 つの Topic 型すべてに要るので、Topic union に手を入れることになる
 *    (AGENTS.md が「5〜10 箇所に波及する」と警告している変更)
 * 2. `/`, `/about`, `/books`, セクションハブは Topic オブジェクトを持たない。
 *    sitemap の全 URL をカバーするには結局ここが要る
 * 3. 1 枚なら「全 URL に日付があるか」を `page-dates.test.ts` で機械的に保証できる
 *
 * ## 運用ルール（これを守らないと元の木阿弥）
 *
 * **コンテンツを実質的に変えたときだけ `updated` を手で上げる。**
 * 誤字修正・リファクタ・依存更新では上げない。「毎ビルド更新」をやめた意味がそこにある。
 * ページを新設したら `published` と `updated` に同じ日を入れる
 * (入れ忘れは `page-dates.test.ts` が落ちて気付く)。
 *
 * ## 既知の粒度の限界
 *
 * **練習問題は 1 ファイルに全問入っている** (`content/fe/quiz.ts` ほか)。初期値は
 * slug の初出コミットから引いたので `published` は問題ごとに正しいが、`updated` を
 * 手で上げるときに「1 問直したら同ファイルの全問を上げる」のか迷う。
 * **迷ったら直した問題だけ上げる。** 気になるようになったら問題ごとにファイルを分ける。
 *
 * 初期値は `scripts/seed-page-dates.mjs` が git 履歴から生成した。
 * **あのスクリプトは再実行しない** — 手で直した `updated` が git の最終コミット日で潰れる。
 */

export type PageDates = {
  /** 公開日 (YYYY-MM-DD)。JSON-LD の datePublished */
  published: string;
  /** 最終更新日 (YYYY-MM-DD)。JSON-LD の dateModified / sitemap の lastModified / 可視表示 */
  updated: string;
};

export const pageDates: Record<string, PageDates> = {
  "/": { published: "2026-07-05", updated: "2026-08-26" },
  "/about": { published: "2026-07-02", updated: "2026-08-29" },
  "/books": { published: "2026-08-21", updated: "2026-08-21" },
  "/contact": { published: "2026-07-02", updated: "2026-07-05" },
  "/data-modeling": { published: "2026-07-14", updated: "2026-08-16" },
  "/data-modeling/er-diagram": { published: "2026-07-18", updated: "2026-08-02" },
  "/data-modeling/er-diagram/cardinality": { published: "2026-07-18", updated: "2026-07-20" },
  "/data-modeling/er-diagram/entity": { published: "2026-07-18", updated: "2026-07-20" },
  "/data-modeling/er-diagram/many-to-many": { published: "2026-07-18", updated: "2026-07-26" },
  "/data-modeling/er-diagram/notation": { published: "2026-07-18", updated: "2026-07-20" },
  "/data-modeling/er-diagram/optionality": { published: "2026-07-18", updated: "2026-07-20" },
  "/data-modeling/er-diagram/relationship": { published: "2026-07-18", updated: "2026-07-20" },
  "/data-modeling/er-diagram/weak-entity": { published: "2026-07-18", updated: "2026-07-26" },
  "/data-modeling/normalization": { published: "2026-07-14", updated: "2026-08-02" },
  "/data-modeling/normalization/1nf": { published: "2026-07-14", updated: "2026-07-15" },
  "/data-modeling/normalization/2nf": { published: "2026-07-14", updated: "2026-07-15" },
  "/data-modeling/normalization/3nf": { published: "2026-07-14", updated: "2026-07-15" },
  "/data-modeling/normalization/denormalization": { published: "2026-07-14", updated: "2026-07-15" },
  "/data-modeling/normalization/functional-dependency": { published: "2026-07-14", updated: "2026-07-26" },
  "/data-modeling/normalization/keys": { published: "2026-07-14", updated: "2026-07-26" },
  "/data-modeling/normalization/why": { published: "2026-07-14", updated: "2026-07-15" },
  "/fe": { published: "2026-08-01", updated: "2026-08-16" },
  "/fe/algorithm": { published: "2026-08-15", updated: "2026-08-29" },
  "/fe/algorithm/lessons": { published: "2026-08-15", updated: "2026-08-15" },
  "/fe/algorithm/lessons/array": { published: "2026-08-02", updated: "2026-08-15" },
  "/fe/algorithm/lessons/for": { published: "2026-08-02", updated: "2026-08-15" },
  "/fe/algorithm/lessons/function": { published: "2026-08-02", updated: "2026-08-15" },
  "/fe/algorithm/lessons/if": { published: "2026-08-02", updated: "2026-08-15" },
  "/fe/algorithm/lessons/variable": { published: "2026-08-02", updated: "2026-08-15" },
  "/fe/algorithm/lessons/while": { published: "2026-08-02", updated: "2026-08-15" },
  "/fe/algorithm/quiz": { published: "2026-08-15", updated: "2026-08-15" },
  "/fe/algorithm/quiz/array-one-based": { published: "2026-08-04", updated: "2026-08-07" },
  "/fe/algorithm/quiz/array-reverse-scan": { published: "2026-08-04", updated: "2026-08-07" },
  "/fe/algorithm/quiz/assign-swap": { published: "2026-08-04", updated: "2026-08-07" },
  "/fe/algorithm/quiz/boundary-operator": { published: "2026-08-04", updated: "2026-08-07" },
  "/fe/algorithm/quiz/elseif-first-match": { published: "2026-08-04", updated: "2026-08-07" },
  "/fe/algorithm/quiz/fib-recursion": { published: "2026-08-04", updated: "2026-08-07" },
  "/fe/algorithm/quiz/for-loop-step": { published: "2026-08-04", updated: "2026-08-07" },
  "/fe/algorithm/quiz/function-return-flow": { published: "2026-08-04", updated: "2026-08-07" },
  "/fe/algorithm/quiz/indirect-index": { published: "2026-08-04", updated: "2026-08-07" },
  "/fe/algorithm/quiz/insertion-sort-inner": { published: "2026-08-04", updated: "2026-08-07" },
  "/fe/algorithm/quiz/leap-year": { published: "2026-08-04", updated: "2026-08-07" },
  "/fe/algorithm/quiz/linked-list-traverse": { published: "2026-08-04", updated: "2026-08-07" },
  "/fe/algorithm/quiz/merge-two-sorted": { published: "2026-08-04", updated: "2026-08-07" },
  "/fe/algorithm/quiz/operator-precedence": { published: "2026-08-04", updated: "2026-08-07" },
  "/fe/algorithm/quiz/queue-ring-buffer": { published: "2026-08-04", updated: "2026-08-07" },
  "/fe/algorithm/quiz/selection-sort-swaps": { published: "2026-08-04", updated: "2026-08-07" },
  "/fe/algorithm/quiz/stack-push-pop": { published: "2026-08-04", updated: "2026-08-07" },
  "/fe/algorithm/quiz/while-exact-repeat": { published: "2026-08-04", updated: "2026-08-07" },
  "/fe/algorithm/quiz/while-loop-count": { published: "2026-08-04", updated: "2026-08-07" },
  "/fe/algorithm/quiz/while-search-not-found": { published: "2026-08-04", updated: "2026-08-07" },
  "/fe/algorithm/transpile": { published: "2026-08-15", updated: "2026-08-15" },
  "/fe/sql": { published: "2026-08-15", updated: "2026-08-29" },
  "/fe/sql/lessons": { published: "2026-08-15", updated: "2026-08-29" },
  "/fe/sql/lessons/aggregate": { published: "2026-08-15", updated: "2026-08-16" },
  "/fe/sql/lessons/cursor": { published: "2026-08-15", updated: "2026-08-15" },
  "/fe/sql/lessons/ddl-constraints": { published: "2026-08-15", updated: "2026-08-16" },
  "/fe/sql/lessons/dml": { published: "2026-08-15", updated: "2026-08-16" },
  "/fe/sql/lessons/grant": { published: "2026-08-15", updated: "2026-08-15" },
  "/fe/sql/lessons/group-by": { published: "2026-08-15", updated: "2026-08-16" },
  "/fe/sql/lessons/join": { published: "2026-08-15", updated: "2026-08-16" },
  "/fe/sql/lessons/select": { published: "2026-08-15", updated: "2026-08-16" },
  "/fe/sql/lessons/set-ops": { published: "2026-08-15", updated: "2026-08-16" },
  "/fe/sql/lessons/subquery": { published: "2026-08-15", updated: "2026-08-16" },
  "/fe/sql/lessons/view": { published: "2026-08-15", updated: "2026-08-16" },
  "/fe/sql/lessons/where": { published: "2026-08-15", updated: "2026-08-16" },
  "/fe/sql/quiz": { published: "2026-08-15", updated: "2026-08-16" },
  "/fe/sql/quiz/avg-with-null": { published: "2026-08-15", updated: "2026-08-16" },
  "/fe/sql/quiz/between-boundary": { published: "2026-08-15", updated: "2026-08-16" },
  "/fe/sql/quiz/count-star-vs-column": { published: "2026-08-15", updated: "2026-08-16" },
  "/fe/sql/quiz/cross-product-rows": { published: "2026-08-15", updated: "2026-08-16" },
  "/fe/sql/quiz/except-set-op": { published: "2026-08-15", updated: "2026-08-16" },
  "/fe/sql/quiz/having-group-count": { published: "2026-08-15", updated: "2026-08-16" },
  "/fe/sql/quiz/join-matching-rows": { published: "2026-08-15", updated: "2026-08-16" },
  "/fe/sql/quiz/like-underscore": { published: "2026-08-15", updated: "2026-08-16" },
  "/fe/sql/quiz/not-in-subquery": { published: "2026-08-15", updated: "2026-08-16" },
  "/fe/sql/quiz/outer-join-count-column": { published: "2026-08-15", updated: "2026-08-16" },
  "/fe/sql/quiz/outer-join-null": { published: "2026-08-15", updated: "2026-08-16" },
  "/fe/sql/quiz/scalar-subquery-average": { published: "2026-08-15", updated: "2026-08-16" },
  "/fe/sql/quiz/select-projection": { published: "2026-08-15", updated: "2026-08-16" },
  "/fe/sql/quiz/update-where-scope": { published: "2026-08-15", updated: "2026-08-16" },
  "/joho1": { published: "2026-08-07", updated: "2026-08-16" },
  "/joho1/dncl": { published: "2026-08-07", updated: "2026-08-29" },
  "/joho1/lessons": { published: "2026-08-07", updated: "2026-08-11" },
  "/joho1/lessons/array": { published: "2026-08-07", updated: "2026-08-11" },
  "/joho1/lessons/function": { published: "2026-08-07", updated: "2026-08-11" },
  "/joho1/lessons/if": { published: "2026-08-07", updated: "2026-08-11" },
  "/joho1/lessons/loop": { published: "2026-08-07", updated: "2026-08-11" },
  "/joho1/lessons/loop-while": { published: "2026-08-07", updated: "2026-08-11" },
  "/joho1/lessons/variable": { published: "2026-08-07", updated: "2026-08-11" },
  "/joho1/quiz": { published: "2026-08-11", updated: "2026-08-11" },
  "/joho1/quiz/array-base-changes-answer": { published: "2026-08-11", updated: "2026-08-11" },
  "/joho1/quiz/array-diff-previous": { published: "2026-08-11", updated: "2026-08-11" },
  "/joho1/quiz/array-find-max-fill": { published: "2026-08-11", updated: "2026-08-11" },
  "/joho1/quiz/array-indirect-stock": { published: "2026-08-11", updated: "2026-08-11" },
  "/joho1/quiz/array-tally-fill": { published: "2026-08-11", updated: "2026-08-11" },
  "/joho1/quiz/array-zero-based-sum": { published: "2026-08-11", updated: "2026-08-11" },
  "/joho1/quiz/display-no-separator": { published: "2026-08-11", updated: "2026-08-11" },
  "/joho1/quiz/function-element-count": { published: "2026-08-11", updated: "2026-08-11" },
  "/joho1/quiz/function-max-with-count": { published: "2026-08-11", updated: "2026-08-11" },
  "/joho1/quiz/if-boundary": { published: "2026-08-11", updated: "2026-08-11" },
  "/joho1/quiz/if-equality-operator": { published: "2026-08-11", updated: "2026-08-11" },
  "/joho1/quiz/if-sequential-overwrite": { published: "2026-08-11", updated: "2026-08-11" },
  "/joho1/quiz/loop-decreasing": { published: "2026-08-11", updated: "2026-08-11" },
  "/joho1/quiz/loop-inclusive-end": { published: "2026-08-11", updated: "2026-08-11" },
  "/joho1/quiz/loop-step-fill": { published: "2026-08-11", updated: "2026-08-11" },
  "/joho1/quiz/multiple-assign-div": { published: "2026-08-11", updated: "2026-08-11" },
  "/joho1/quiz/while-and-two-conditions": { published: "2026-08-11", updated: "2026-08-11" },
  "/joho1/quiz/while-until-short": { published: "2026-08-11", updated: "2026-08-11" },
  "/joho1/transpile": { published: "2026-08-11", updated: "2026-08-11" },
  "/privacy": { published: "2026-07-02", updated: "2026-07-05" },
  "/query-plan": { published: "2026-08-26", updated: "2026-08-26" },
  "/query-plan/estimated-rows": { published: "2026-08-26", updated: "2026-08-26" },
  "/query-plan/explain-analyze": { published: "2026-08-26", updated: "2026-08-26" },
  "/query-plan/explain-basics": { published: "2026-08-26", updated: "2026-08-26" },
  "/query-plan/find-bottleneck": { published: "2026-08-26", updated: "2026-08-26" },
  "/query-plan/index-cond-vs-filter": { published: "2026-08-26", updated: "2026-08-26" },
  "/query-plan/join-nodes": { published: "2026-08-26", updated: "2026-08-26" },
  "/query-plan/read-tree": { published: "2026-08-26", updated: "2026-08-26" },
  "/query-plan/scan-nodes": { published: "2026-08-26", updated: "2026-08-26" },
  "/query-plan/sort-and-memory": { published: "2026-08-26", updated: "2026-08-26" },
  "/query-plan/what-is": { published: "2026-08-26", updated: "2026-08-26" },
  "/rdb-index": { published: "2026-07-05", updated: "2026-08-26" },
  "/rdb-index/basics/data-structure": { published: "2026-07-05", updated: "2026-07-15" },
  "/rdb-index/basics/why-index": { published: "2026-07-05", updated: "2026-07-15" },
  "/rdb-index/btree": { published: "2026-07-05", updated: "2026-07-16" },
  "/rdb-index/clustered": { published: "2026-07-05", updated: "2026-08-26" },
  "/rdb-index/composite": { published: "2026-07-05", updated: "2026-08-26" },
  "/rdb-index/cost": { published: "2026-07-05", updated: "2026-08-26" },
  "/rdb-index/covering": { published: "2026-07-05", updated: "2026-08-26" },
  "/rdb-index/explain": { published: "2026-07-05", updated: "2026-08-26" },
  "/rdb-index/hash": { published: "2026-07-05", updated: "2026-07-26" },
  "/rdb-index/partial": { published: "2026-07-05", updated: "2026-07-15" },
  "/rdb-index/statistics": { published: "2026-07-05", updated: "2026-08-26" },
  "/rdb-index/unique": { published: "2026-07-05", updated: "2026-08-26" },
  "/terms": { published: "2026-07-02", updated: "2026-07-05" },
  "/why-need-rdb": { published: "2026-07-27", updated: "2026-08-20" },
  "/why-need-rdb/atomicity": { published: "2026-07-27", updated: "2026-08-02" },
  "/why-need-rdb/concurrency": { published: "2026-07-27", updated: "2026-08-20" },
  "/why-need-rdb/durability": { published: "2026-07-27", updated: "2026-08-02" },
  "/why-need-rdb/isolation-levels": { published: "2026-08-20", updated: "2026-08-20" },
  "/why-need-rdb/recap": { published: "2026-07-27", updated: "2026-08-02" },
  "/why-need-rdb/referential-integrity": { published: "2026-07-27", updated: "2026-08-26" },
  "/why-need-rdb/uniqueness": { published: "2026-07-27", updated: "2026-08-26" },
};

/**
 * path から日付を引く。**登録漏れは `undefined` を返す**ので、
 * 呼び出し側は「日付を出さない」に倒す (嘘の日付を出すよりよい)。
 * 漏れ自体は `page-dates.test.ts` が sitemap と突き合わせて落とす。
 */
export function findPageDates(path: string): PageDates | undefined {
  return pageDates[path] ?? pageDates[path.replace(/\/$/, "")];
}
