"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Playground } from "@/components/fe/Playground";

/**
 * `/fe` の Playground を `?code=` / `?from=` 付きで開くためのラッパー。
 *
 * server component の `searchParams` で受けると `/fe` が Dynamic 扱いになり
 * 静的プリレンダできなくなるので、クエリの読み取りはクライアントに寄せている。
 * (呼び出し側は Suspense で囲むこと)
 */
export function PlaygroundDeepLink() {
  const params = useSearchParams();
  const code = params.get("code") ?? undefined;
  const from = params.get("from");
  // オープンリダイレクト防止: 自サイトの FE 配下だけを戻り先として許可する
  const backHref =
    from && /^\/fe\/(lessons|quiz)\/[a-z0-9-]+$/.test(from) ? from : null;

  return (
    <>
      {backHref && (
        <p className="mb-3 text-sm">
          <Link
            href={backHref}
            className="underline underline-offset-4 hover:opacity-80"
          >
            ← 元のページに戻る
          </Link>
        </p>
      )}
      <Playground initialCode={code} />
    </>
  );
}
