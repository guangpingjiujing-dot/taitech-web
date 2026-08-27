"use client";

import { createContext, useContext } from "react";

/**
 * `ssr: false` の `CodeEditor` が描かれるまでの間に出すフォールバック。
 *
 * **これは見た目のためではなく、初期 HTML にサンプルコードを残すためにある。**
 * Googlebot は JS を実行するが GPTBot / ClaudeBot / PerplexityBot は実行しないので、
 * ここが空だと「動かして学べる」教材ページが AI から見て本文だけのページになる
 * (docs/wip/20260828-seo-aeo-review/00-review.md §2)。
 * `next/dynamic` の `loading` は SSR 時にサーバでレンダリングされるため、
 * ここに実際のコードを出せば初期 HTML に入る。
 *
 * `loading` は引数を取らない module scope の関数なので prop でコードを渡せない。
 * そのため context で流す。
 */
const EditorFallbackCodeContext = createContext<string>("");

/**
 * **流すのは「初期コード」であって、ストアの現在値ではない。**
 * `initialCode` は prop なのでサーバとクライアント初回レンダリングで必ず一致し、
 * ハイドレーション不一致が構造的に起きない。ストアの live な値を読むと
 * `PlaygroundDeepLink` が `?code=` を適用するタイミング次第で不一致になりうる。
 */
export function EditorFallbackProvider({
  code,
  children,
}: {
  code: string;
  children: React.ReactNode;
}) {
  return (
    <EditorFallbackCodeContext.Provider value={code}>
      {children}
    </EditorFallbackCodeContext.Provider>
  );
}

/**
 * `dynamic(..., { loading: () => <EditorFallback height="..." /> })` の形で使う。
 *
 * **`height` / `minHeight` は差し替わる `CodeEditor` に渡しているのと同じ値にすること。**
 * 高さが変わると本体がマウントした瞬間にレイアウトが動いて CLS になる。
 * サンプルコードは 3〜10 行で箱に収まるが、念のため `overflow: hidden` で
 * 溢れても箱が伸びないようにしてある。
 */
export function EditorFallback({
  height,
  minHeight,
  className,
}: {
  height?: string;
  minHeight?: string;
  className?: string;
}) {
  const code = useContext(EditorFallbackCodeContext);
  return (
    <pre
      className={className}
      style={{
        height,
        minHeight,
        margin: 0,
        overflow: "hidden",
        border: "1px solid var(--color-border, #e5e7eb)",
        borderRadius: "8px",
        background: "var(--color-muted, #f9fafb)",
        padding: "12px",
        color: "var(--color-muted-foreground, #6b7280)",
        fontFamily:
          "var(--font-geist-mono), ui-monospace, SFMono-Regular, Menlo, monospace",
        fontSize: "0.85rem",
        lineHeight: 1.6,
        whiteSpace: "pre",
      }}
    >
      <code>{code}</code>
    </pre>
  );
}
