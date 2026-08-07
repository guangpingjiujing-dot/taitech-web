"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  DEFAULT_CODE,
  PlaygroundStoreProvider,
  usePlayground,
} from "@/components/playground/playgroundStore";
import {
  transpileToPython,
  transpileToTypeScript,
  parse,
  PseudoLexError,
  PseudoParseError,
} from "@/lib/pseudo";
import { Button } from "@/components/ui/Button";

const EDITOR_HEIGHT = "460px";
// モバイル (≤900px) の高さは globals.css の .fe-playground-grid 側で
// --fe-editor-height を上書きして与える (ここでは持たない)

import { lineNumbers } from "@codemirror/view";
import { pseudoLanguage } from "./pseudoLanguage";

// 言語定義と行番号は言語ごとに違うのでエディタ本体から出してある
// (`/joho1` は `(01)` 形式の行番号 + ブロック罫線)
const FE_EDITOR_EXTENSIONS = [lineNumbers(), pseudoLanguage];

const CodeEditor = dynamic(
  () => import("@/components/playground/CodeEditor").then((m) => m.CodeEditor),
  { ssr: false, loading: () => <EditorSkeleton /> },
);

function EditorSkeleton() {
  return (
    <div
      style={{
        height: "var(--fe-editor-height)",
        border: "1px solid var(--color-border, #e5e7eb)",
        borderRadius: "8px",
        background: "var(--color-muted, #f9fafb)",
        padding: "12px",
        color: "var(--color-muted-foreground, #9ca3af)",
        fontFamily:
          "var(--font-geist-mono), ui-monospace, SFMono-Regular, Menlo, monospace",
        fontSize: "0.9rem",
      }}
    >
      エディタを読み込み中…
    </div>
  );
}

export interface PlaygroundProps {
  initialCode?: string;
  /** lesson 埋め込み用: 「このコードを実行シミュレーターで開く →」
   *  リンクを Playground 下部に表示する。/fe 本体では既に本体なので
   *  出す必要が無く、default は false。 */
  showOpenInFullEditor?: boolean;
  /** 読み物に埋め込むときの縮小版。テンプレート挿入ツールバーを畳む
   *  (レッスン中に「テンプレートを挿入」は使われず、縦幅とノイズだけ増える) */
  compact?: boolean;
  /** ストアの中に差し込む要素。`?code=` の適用など store を触るものを置く。
   *  Playground 本体より前に描画される */
  children?: React.ReactNode;
}

export function Playground({
  initialCode,
  showOpenInFullEditor = false,
  compact = false,
  children,
}: PlaygroundProps) {
  return (
    <PlaygroundStoreProvider initialCode={initialCode ?? DEFAULT_CODE}>
      {children}
      <PlaygroundInner showOpenInFullEditor={showOpenInFullEditor} compact={compact} />
    </PlaygroundStoreProvider>
  );
}

interface Snippet {
  label: string;
  text: string;
  hint?: string;
}

const SNIPPETS: Snippet[] = [
  {
    label: "if",
    text: "if (x > 0) then\n  \nendif\n",
    hint: "条件分岐",
  },
  {
    label: "while",
    text: "while (i < n)\n  \nendwhile\n",
    hint: "条件が真の間くり返す",
  },
  {
    label: "for",
    text: "for (i を 1 から n まで 1 ずつ増やす)\n  \nendfor\n",
    hint: "回数指定のくり返し",
  },
  {
    label: "変数",
    text: "整数型: x ← 0\n",
    hint: "変数宣言 + 初期化",
  },
  {
    label: "配列",
    text: "整数型の配列: arr ← {1, 2, 3}\n",
    hint: "配列宣言 (1 始まり)",
  },
  {
    label: "関数",
    text: "○整数型: name(整数型: a)\n  return a\n",
    hint: "関数定義",
  },
  {
    label: "print",
    text: "print()\n",
    hint: "値を出力",
  },
];

function PlaygroundInner({
  showOpenInFullEditor,
  compact,
}: {
  showOpenInFullEditor: boolean;
  compact: boolean;
}) {
  const code = usePlayground((s) => s.code);
  const setCode = usePlayground((s) => s.setCode);
  const highlight = usePlayground((s) => s.highlight);
  const status = usePlayground((s) => s.status);
  const parseError = usePlayground((s) => s.parseError);
  const runtimeError = usePlayground((s) => s.runtimeError);
  const variables = usePlayground((s) => s.variables);
  const output = usePlayground((s) => s.output);
  const step = usePlayground((s) => s.step);
  const runAll = usePlayground((s) => s.run);
  const reset = usePlayground((s) => s.reset);
  const insertText = usePlayground((s) => s.insertText);
  const editorInsertRef = usePlayground((s) => s.editorInsertRef);

  const [transpileTarget, setTranspileTarget] = useState<
    "python" | "typescript" | null
  >(null);

  const transpiled = useMemo(() => {
    if (!transpileTarget) return null;
    try {
      const ast = parse(code);
      return transpileTarget === "python"
        ? transpileToPython(ast)
        : transpileToTypeScript(ast);
    } catch (e) {
      if (e instanceof PseudoLexError || e instanceof PseudoParseError) {
        // message は複数行 (ヒント付き) になりうるので全行をコメント化する
        return `// 変換できません (構文エラー)\n${e.message
          .split("\n")
          .map((l) => `// ${l}`)
          .join("\n")}`;
      }
      return `// 変換に失敗しました`;
    }
  }, [code, transpileTarget]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/*
        2×2 grid:
          row 1 [左ツールバー] [右ツールバー]  ← 高さは両セルの max で揃う
          row 2 [エディタ]     [変数/出力]      ← 上端が必ず一致する
       */}
      <div
        className="fe-playground-grid"
        style={{
          ["--fe-editor-height" as string]: EDITOR_HEIGHT,
          display: "grid",
          columnGap: "16px",
          rowGap: "8px",
          gridTemplateColumns: "minmax(0, 1fr) 320px",
          gridTemplateRows: "auto var(--fe-editor-height)",
          alignItems: "stretch",
        }}
      >
        {/* row 1 col 1: status badge / template label / template chips
            を縦 3 段に積む。エラー時などバッジが横に伸びても他要素を
            押し出さないよう、それぞれを独立行にする */}
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <div>
            <StatusBadge status={status} />
          </div>
          {!compact && (
            <span
              style={{
                fontSize: "0.75rem",
                color: "var(--color-muted-foreground, #6b7280)",
              }}
            >
              テンプレートを挿入
            </span>
          )}
          <div
            style={{
              display: compact ? "none" : "flex",
              gap: "4px",
              flexWrap: "wrap",
            }}
          >
            {SNIPPETS.map((s) => (
              <button
                key={s.label}
                type="button"
                onClick={() => insertText(s.text)}
                title={s.hint}
                style={{
                  padding: "3px 8px",
                  border: "1px solid var(--color-border, #e5e7eb)",
                  background: "#fff",
                  borderRadius: "4px",
                  fontSize: "0.75rem",
                  fontFamily: "var(--font-geist-mono), monospace",
                  cursor: "pointer",
                }}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* row 1 col 2: control buttons。左ツールバーが縦 3 段で背が高い
            ので、右ツールバーは alignSelf: end で下寄せにして変数ペインとの
            隙間を最小化する */}
        <div
          className="fe-playground-controls"
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "6px",
            alignSelf: "end",
          }}
        >
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
            <Button variant="primary" size="sm" onClick={runAll}>
              ▶ 実行
            </Button>
            <Button variant="primary" size="sm" onClick={step}>
              一行ずつ実行
            </Button>
            <Button variant="secondary" size="sm" onClick={reset}>
              ⟲ リセット
            </Button>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
            <Button
              variant={transpileTarget === "python" ? "primary" : "secondary"}
              size="sm"
              aria-pressed={transpileTarget === "python"}
              onClick={() =>
                setTranspileTarget((t) => (t === "python" ? null : "python"))
              }
            >
              Python変換
            </Button>
            <Button
              variant={
                transpileTarget === "typescript" ? "primary" : "secondary"
              }
              size="sm"
              aria-pressed={transpileTarget === "typescript"}
              onClick={() =>
                setTranspileTarget((t) =>
                  t === "typescript" ? null : "typescript",
                )
              }
            >
              TypeScript変換
            </Button>
          </div>
        </div>

        {/* row 2 col 1: editor */}
        <CodeEditor
          extensions={FE_EDITOR_EXTENSIONS}
          value={code}
          onChange={setCode}
          highlightLine={highlight.line}
          highlightVersion={highlight.version}
          height="var(--fe-editor-height)"
          onReady={({ insertText: insert }) => {
            editorInsertRef.current = insert;
          }}
        />

        {/* row 2 col 2: variables + output stacked */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "10px",
            minHeight: 0,
          }}
        >
          <Panel title="変数" flex="1 1 auto" minHeight="120px">
            {variables.length === 0 ? (
              <Empty>まだ実行されていません</Empty>
            ) : (
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: "0.85rem",
                }}
              >
                <thead>
                  <tr
                    style={{
                      textAlign: "left",
                      opacity: 0.7,
                      borderBottom:
                        "1px solid var(--color-border, #e5e7eb)",
                    }}
                  >
                    <th style={{ padding: "4px 6px", fontWeight: 600 }}>
                      名前
                    </th>
                    <th style={{ padding: "4px 6px", fontWeight: 600 }}>
                      型
                    </th>
                    <th style={{ padding: "4px 6px", fontWeight: 600 }}>
                      値
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {variables.map((v, i) => (
                    <tr
                      key={`${v.frame}:${v.name}:${i}`}
                      style={{
                        borderBottom:
                          "1px solid var(--color-border, #f0f0f0)",
                      }}
                    >
                      <td
                        style={{
                          padding: "6px 6px",
                          fontFamily:
                            "var(--font-geist-mono), monospace",
                          verticalAlign: "top",
                        }}
                      >
                        {v.name}
                        {v.frame !== "main" && (
                          <span
                            style={{
                              opacity: 0.5,
                              fontSize: "0.75rem",
                              marginLeft: 4,
                            }}
                          >
                            ({v.frame})
                          </span>
                        )}
                      </td>
                      <td
                        style={{
                          padding: "6px 6px",
                          opacity: 0.7,
                          verticalAlign: "top",
                        }}
                      >
                        {v.typeLabel}
                      </td>
                      <td
                        style={{
                          padding: "6px 6px",
                          fontFamily:
                            "var(--font-geist-mono), monospace",
                          wordBreak: "break-all",
                          verticalAlign: "top",
                        }}
                      >
                        {v.displayValue}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Panel>

          <Panel title="出力" height="160px">
            {/* ステップ実行で増える出力を読み上げに通知する */}
            <div aria-live="polite" aria-atomic="false">
              {output.length === 0 ? (
                <Empty>まだ出力はありません (print で表示します)</Empty>
              ) : (
                <pre
                  style={{
                    margin: 0,
                    fontFamily: "var(--font-geist-mono), monospace",
                    fontSize: "0.9rem",
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {output.map((o) => o.text).join("\n")}
                </pre>
              )}
            </div>
          </Panel>
        </div>
      </div>

      {(parseError || runtimeError) && (
        <ErrorBox message={(parseError ?? runtimeError)!.message} />
      )}

      {transpiled && (
        <Panel
          title={
            transpileTarget === "python"
              ? "Python への変換結果"
              : "TypeScript への変換結果"
          }
        >
          <pre
            style={{
              margin: 0,
              fontFamily: "var(--font-geist-mono), monospace",
              fontSize: "0.85rem",
              whiteSpace: "pre",
              overflowX: "auto",
            }}
          >
            {transpiled}
          </pre>
        </Panel>
      )}

      {showOpenInFullEditor && (
        <div className="mt-2">
          <Button
            asChild
            variant="primary"
            size="md"
            /* Tailwind v4 の ! suffix で .prose-jp a のグローバル
             * (specificity 0,1,1) を上書きする。
             * lesson の prose-jp コンテナ内で primary button が
             * 黒地に黒文字 + 下線になるのを回避 */
            className="text-[var(--primary-foreground)]! no-underline! hover:no-underline!"
          >
            <Link
              href={`/fe?code=${encodeURIComponent(code)}`}
              rel="nofollow"
            >
              このコードを実行シミュレーターで開く →
            </Link>
          </Button>
        </div>
      )}

    </div>
  );
}

function Panel({
  title,
  children,
  height,
  minHeight,
  flex,
}: {
  title: string;
  children: React.ReactNode;
  /** Fixed height. Content overflows via scroll. */
  height?: string;
  /** Minimum height when using flex sizing. */
  minHeight?: string;
  /** flex shorthand for use inside a flex column parent. */
  flex?: string;
}) {
  return (
    <section
      style={{
        border: "1px solid var(--color-border, #e5e7eb)",
        borderRadius: "8px",
        padding: "8px 12px 10px 12px",
        background: "var(--color-background, #fff)",
        display: "flex",
        flexDirection: "column",
        flex,
        height,
        minHeight,
        minWidth: 0,
      }}
    >
      <h3
        style={{
          fontSize: "0.8rem",
          fontWeight: 700,
          margin: "0 0 6px 0",
          opacity: 0.7,
          flexShrink: 0,
        }}
      >
        {title}
      </h3>
      <div style={{ flex: "1 1 auto", overflow: "auto", minHeight: 0 }}>
        {children}
      </div>
    </section>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ opacity: 0.5, fontSize: "0.85rem" }}>{children}</div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const label: Record<string, string> = {
    idle: "待機中",
    paused: "一時停止中",
    running: "実行中",
    finished: "終了",
    parseError: "構文エラー",
    runtimeError: "実行時エラー",
  };
  const color: Record<string, string> = {
    idle: "#6b7280",
    paused: "#1d4ed8",
    running: "#059669",
    finished: "#111827",
    parseError: "#b91c1c",
    runtimeError: "#b91c1c",
  };
  const dotColor = color[status] ?? "#6b7280";
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        padding: "3px 10px",
        border: `1px solid ${dotColor}`,
        color: dotColor,
        borderRadius: "999px",
        fontSize: "0.75rem",
        whiteSpace: "nowrap",
      }}
    >
      <span
        aria-hidden
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: dotColor,
        }}
      />
      {label[status] ?? status}
    </span>
  );
}

function ErrorBox({ message }: { message: string }) {
  return (
    <div
      role="alert"
      style={{
        border: "1px solid #b91c1c",
        background: "#fef2f2",
        color: "#7f1d1d",
        padding: "10px 12px",
        borderRadius: "8px",
        fontSize: "0.9rem",
        whiteSpace: "pre-wrap",
        fontFamily: "var(--font-geist-mono), monospace",
      }}
    >
      {message}
    </div>
  );
}
