"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useSqlPlayground } from "./sqlPlaygroundStore";
import { isDatasetKey } from "@/content/fe/sql/datasets";

/**
 * `/fe/sql` を `?sql=` / `?dataset=` / `?from=` 付きで開いたときの処理。
 *
 * **Playground 本体の外には出さない**: server component の `searchParams` で
 * 受けると `/fe/sql` が Dynamic になり静的プリレンダできなくなる一方、
 * Playground ごとクライアントに寄せると prerender HTML からエディタの markup が
 * 消える。クエリの読み取りだけをこの小さな client component に閉じ込める
 * (`components/fe/PlaygroundDeepLink.tsx` と同じ設計)。
 */
export function SqlPlaygroundDeepLink() {
  const params = useSearchParams();
  const setSql = useSqlPlayground((s) => s.setSql);
  const selectDataset = useSqlPlayground((s) => s.selectDataset);
  const applied = useRef(false);

  const sql = params.get("sql");
  const dataset = params.get("dataset");
  const from = params.get("from");

  // オープンリダイレクト防止: 自サイトの SQL 練習問題・レッスンだけを戻り先に許可する
  const backHref =
    from && /^\/fe\/sql\/(quiz|lessons)\/[a-z0-9-]+$/.test(from) ? from : null;

  useEffect(() => {
    // 適用は 1 回だけ。ユーザーが編集し始めた後に上書きしない
    if (applied.current) return;
    if (!sql && !dataset) return;
    applied.current = true;
    // **表を先に切り替える。** 逆順だと selectDataset が SQL を既定値へ戻してしまう
    if (dataset && isDatasetKey(dataset)) {
      selectDataset(dataset, { keepSql: true });
    }
    if (sql) setSql(sql);
  }, [sql, dataset, setSql, selectDataset]);

  if (!backHref) return null;
  return (
    <p className="mb-3 text-sm">
      <Link
        href={backHref}
        className="underline underline-offset-4 hover:opacity-80"
      >
        ← 元のページに戻る
      </Link>
    </p>
  );
}
