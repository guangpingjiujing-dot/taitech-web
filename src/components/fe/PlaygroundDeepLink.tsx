"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { usePlayground } from "@/components/playground/playgroundStore";

/**
 * `/fe` を `?code=` / `?from=` 付きで開いたときの処理。
 *
 * **Playground 本体の外には出さない**: server component の `searchParams` で
 * 受けると `/fe` が Dynamic になり静的プリレンダできなくなる一方、
 * Playground ごとクライアントに寄せると prerender HTML からエディタの markup が
 * 消える。そこで Playground は SSR したまま、クエリの読み取りだけをこの
 * 小さな client component (Suspense 配下) に閉じ込めてストアへ流し込む。
 */
export function PlaygroundDeepLink() {
  const params = useSearchParams();
  const setCode = usePlayground((s) => s.setCode);
  const applied = useRef(false);

  const code = params.get("code");
  const from = params.get("from");
  // オープンリダイレクト防止: 自サイトの FE 配下だけを戻り先として許可する
  const backHref =
    from && /^\/fe\/(lessons|quiz)\/[a-z0-9-]+$/.test(from) ? from : null;

  useEffect(() => {
    // 適用は 1 回だけ。ユーザーが編集し始めた後に上書きしない
    if (applied.current || !code) return;
    applied.current = true;
    setCode(code);
  }, [code, setCode]);

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
