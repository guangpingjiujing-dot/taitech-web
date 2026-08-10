"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { usePlayground } from "@/components/playground/playgroundStore";

/**
 * `/joho1` を `?code=` / `?base=` / `?from=` 付きで開いたときの処理。
 *
 * FE の `PlaygroundDeepLink` と同じ理由でここに閉じ込めている: server component の
 * `searchParams` で受けると `/joho1` が Dynamic になり静的プリレンダできなくなる一方、
 * Playground ごとクライアントに寄せると prerender HTML からエディタの markup が消える。
 *
 * FE と違い `base` を受けるのは、**添字の基点が問題ごとに変わる**ため
 * (00-overview.md §7-4 (2))。練習問題から飛んできたコードを既定の 1 始まりで
 * 走らせると、0 始まりの問題では答えが変わってしまう。
 */
export function Joho1PlaygroundDeepLink({
  onIndexBase,
}: {
  onIndexBase: (base: 0 | 1) => void;
}) {
  const params = useSearchParams();
  const setCode = usePlayground((s) => s.setCode);
  const applied = useRef(false);

  const code = params.get("code");
  const base = params.get("base");
  const from = params.get("from");
  // オープンリダイレクト防止: 自サイトの joho1 配下だけを戻り先として許可する
  const backHref =
    from && /^\/joho1\/(lessons|quiz)\/[a-z0-9-]+$/.test(from) ? from : null;

  useEffect(() => {
    // 適用は 1 回だけ。ユーザーが編集し始めた後に上書きしない
    if (applied.current || !code) return;
    applied.current = true;
    if (base === "0" || base === "1") onIndexBase(base === "0" ? 0 : 1);
    setCode(code);
  }, [code, base, setCode, onIndexBase]);

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
