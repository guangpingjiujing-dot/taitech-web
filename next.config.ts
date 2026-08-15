import type { NextConfig } from "next";

/*
 * ============================================================================
 * 恒久リダイレクトは「いつ消すか」を必ず添えること
 * ============================================================================
 *
 * 308 は放っておくと永久に residue として残る。**消える契機が書かれていない
 * リダイレクトは負債**なので、新しく足すときは必ず下記 2 つをコメントに書く:
 *
 *   1. **削除トリガー** — 何が観測できたら消してよいか
 *   2. **最終期限** — トリガーが来なくても無条件に消す日
 *
 * トリガーの確認方法 (Google):
 *   GSC の URL Inspection で旧 URL を検査し、`coverage_state` が
 *   "Submitted and indexed" から外れていれば index から落ちている。
 *   Claude Code からは skill `/taitech-analytics` 経由の GSC MCP
 *   (`inspect_url_enhanced`) で確認できる。
 *
 * 削除の実行は `strategy/roadmap.md` の優先アクション表に積んだタスクが担保する
 * (docs/wip/ の harvest タスクと同じ運用)。表に載っていない削除契機は永久に来ない。
 */
const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.taitech.dev" }],
        destination: "https://taitech.dev/:path*",
        permanent: true,
      },
      /*
       * 2026-07-20: 「識別関係」を「弱エンティティ」に統合 / 「読み方チェックリスト」を
       * 旗艦ページ末尾に吸収。旧 URL は GSC 履歴・外部リンクのために 308 で流す。
       *
       * 削除トリガー: GSC URL Inspection で下記 2 URL がいずれも
       *   "Submitted and indexed" から外れていること
       * 最終期限: **2027-01-20** (統合から 18 ヶ月)。トリガー未達でも無条件に削除する
       */
      {
        source: "/data-modeling/er-diagram/identifying",
        destination: "/data-modeling/er-diagram/weak-entity",
        permanent: true,
      },
      {
        source: "/data-modeling/er-diagram/reading",
        destination: "/data-modeling/er-diagram",
        permanent: true,
      },
      /*
       * 2026-08-15: `/fe` を擬似言語 Playground からセクションハブに変更し、
       * 擬似言語ツール一式を `/fe/algorithm/*` へ移設
       * (docs/wip/20260815-fe-sql/00-overview.md §5)。
       *
       * **`/fe` 自体はリダイレクトしない。** ハブとして 200 で残る。
       *
       * なぜ 404 にせず 308 を置いたか (2026-08-15 に GSC で実測して判断):
       *   `/fe` `/fe/transpile` `/fe/lessons/array` は "Submitted and indexed" だった。
       *   このサイトの目下のボトルネックは**クロール予算と被リンク不足**
       *   (roadmap #26: Bing は 35 URL 中 3 しかインデックスしていない) なので、
       *   成功したクロールを自分から 404 にして捨てるのは診断と矛盾する。
       *   加えて X の投稿は編集できない (Premium でも投稿から 1 時間以内)。
       *
       * **削除トリガー**: GSC URL Inspection で `/fe/transpile` と
       *   `/fe/lessons/array` の `coverage_state` が
       *   "Submitted and indexed" から外れていること (両方)
       * **最終期限**: **2027-02-15** (移設から 6 ヶ月)。トリガー未達でも無条件に削除する
       * 実行タスク: `strategy/roadmap.md` の優先アクション表
       *
       * `:slug` は 1 セグメントだけにマッチする (ネストしない) ので、
       * 一覧ページと個別ページで 2 本ずつ要る。クエリは自動で引き継がれる。
       */
      {
        source: "/fe/lessons",
        destination: "/fe/algorithm/lessons",
        permanent: true,
      },
      {
        source: "/fe/lessons/:slug",
        destination: "/fe/algorithm/lessons/:slug",
        permanent: true,
      },
      {
        source: "/fe/quiz",
        destination: "/fe/algorithm/quiz",
        permanent: true,
      },
      {
        source: "/fe/quiz/:slug",
        destination: "/fe/algorithm/quiz/:slug",
        permanent: true,
      },
      {
        source: "/fe/transpile",
        destination: "/fe/algorithm/transpile",
        permanent: true,
      },
      /*
       * Playground の deep link (`/fe?code=...&from=...`) だけはツール側へ流す。
       * `?code=` が無い素の `/fe` はハブなので、`has` で絞って巻き込まないようにする。
       * source は `/fe` 完全一致なので `/fe/algorithm?code=` は再マッチしない (無限ループ回避)。
       */
      {
        source: "/fe",
        has: [{ type: "query", key: "code" }],
        destination: "/fe/algorithm",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
