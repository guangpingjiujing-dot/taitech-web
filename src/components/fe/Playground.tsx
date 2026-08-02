"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import {
  DEFAULT_CODE,
  PlaygroundStoreProvider,
  usePlayground,
} from "./playgroundStore";
import {
  transpileToPython,
  transpileToTypeScript,
  parse,
  PseudoLexError,
  PseudoParseError,
} from "@/lib/pseudo";
import { Button } from "@/components/ui/Button";

const EDITOR_HEIGHT = "460px";

const PseudoEditor = dynamic(
  () => import("./PseudoEditor").then((m) => m.PseudoEditor),
  { ssr: false, loading: () => <EditorSkeleton /> },
);

function EditorSkeleton() {
  return (
    <div
      style={{
        height: EDITOR_HEIGHT,
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
}

export function Playground({ initialCode }: PlaygroundProps) {
  return (
    <PlaygroundStoreProvider initialCode={initialCode ?? DEFAULT_CODE}>
      <PlaygroundInner />
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

function PlaygroundInner() {
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
        return `// 変換できません (構文エラー)\n// ${e.message}`;
      }
      return `// 変換に失敗しました`;
    }
  }, [code, transpileTarget]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <div
        className="fe-playground-grid"
        style={{
          display: "grid",
          gap: "16px",
          gridTemplateColumns: "minmax(0, 1fr) 320px",
          alignItems: "stretch",
        }}
      >
        {/* Left: editor with toolbar */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "8px",
            }}
          >
            <StatusBadge status={status} />
            <div
              style={{
                display: "flex",
                gap: "4px",
                flexWrap: "wrap",
                marginLeft: "auto",
              }}
            >
              <span
                style={{
                  fontSize: "0.75rem",
                  color: "var(--color-muted-foreground, #6b7280)",
                  alignSelf: "center",
                  marginRight: "4px",
                }}
              >
                テンプレートを挿入
              </span>
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
                    fontFamily:
                      "var(--font-geist-mono), monospace",
                    cursor: "pointer",
                  }}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
          <PseudoEditor
            value={code}
            onChange={setCode}
            highlightLine={highlight.line}
            highlightVersion={highlight.version}
            height={EDITOR_HEIGHT}
            onReady={({ insertText: insert }) => {
              editorInsertRef.current = insert;
            }}
          />
        </div>

        {/* Right column: controls + variables + output */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "10px",
            height: EDITOR_HEIGHT,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
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

      <style>{`
        @media (max-width: 900px) {
          .fe-playground-grid {
            grid-template-columns: minmax(0, 1fr) !important;
          }
          .fe-playground-grid > div:nth-child(2) {
            height: auto !important;
          }
        }
      `}</style>
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
