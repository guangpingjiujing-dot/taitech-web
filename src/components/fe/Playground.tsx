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

const PseudoEditor = dynamic(
  () => import("./PseudoEditor").then((m) => m.PseudoEditor),
  { ssr: false, loading: () => <EditorSkeleton /> },
);

function EditorSkeleton() {
  return (
    <div
      style={{
        minHeight: "260px",
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

function PlaygroundInner() {
  const code = usePlayground((s) => s.code);
  const setCode = usePlayground((s) => s.setCode);
  const highlight = usePlayground((s) => s.highlight);
  const status = usePlayground((s) => s.status);
  const parseError = usePlayground((s) => s.parseError);
  const runtimeError = usePlayground((s) => s.runtimeError);
  const variables = usePlayground((s) => s.variables);
  const frames = usePlayground((s) => s.frames);
  const output = usePlayground((s) => s.output);
  const step = usePlayground((s) => s.step);
  const runAll = usePlayground((s) => s.run);
  const reset = usePlayground((s) => s.reset);

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
        style={{
          display: "grid",
          gap: "16px",
          gridTemplateColumns: "minmax(0, 1fr) 320px",
        }}
        className="fe-playground-grid"
      >
        <PseudoEditor
          value={code}
          onChange={setCode}
          highlightLine={highlight.line}
        />
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
            <PrimaryButton onClick={runAll}>▶ 実行</PrimaryButton>
            <PrimaryButton onClick={step}>→ ステップ</PrimaryButton>
            <SecondaryButton onClick={reset}>⟲ リセット</SecondaryButton>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
            <SecondaryButton
              onClick={() =>
                setTranspileTarget((t) => (t === "python" ? null : "python"))
              }
              pressed={transpileTarget === "python"}
            >
              Python変換
            </SecondaryButton>
            <SecondaryButton
              onClick={() =>
                setTranspileTarget((t) =>
                  t === "typescript" ? null : "typescript",
                )
              }
              pressed={transpileTarget === "typescript"}
            >
              TypeScript変換
            </SecondaryButton>
          </div>

          <StatusBadge status={status} />

          <Panel title="変数">
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
                  <tr style={{ textAlign: "left", opacity: 0.7 }}>
                    <th style={{ padding: "4px 6px" }}>名前</th>
                    <th style={{ padding: "4px 6px" }}>型</th>
                    <th style={{ padding: "4px 6px" }}>値</th>
                  </tr>
                </thead>
                <tbody>
                  {variables.map((v, i) => (
                    <tr key={`${v.frame}:${v.name}:${i}`}>
                      <td
                        style={{
                          padding: "4px 6px",
                          fontFamily:
                            "var(--font-geist-mono), monospace",
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
                      <td style={{ padding: "4px 6px", opacity: 0.7 }}>
                        {v.typeLabel}
                      </td>
                      <td
                        style={{
                          padding: "4px 6px",
                          fontFamily:
                            "var(--font-geist-mono), monospace",
                          wordBreak: "break-all",
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

          <Panel title="呼び出しスタック">
            {frames.length === 0 ? (
              <Empty>—</Empty>
            ) : (
              <ol style={{ margin: 0, paddingLeft: "1.2em" }}>
                {frames.map((f, i) => (
                  <li key={i} style={{ fontSize: "0.85rem" }}>
                    {f.funcName}
                    {i === frames.length - 1 && f.line != null && (
                      <span style={{ opacity: 0.6 }}> (行 {f.line})</span>
                    )}
                  </li>
                ))}
              </ol>
            )}
          </Panel>
        </div>
      </div>

      <Panel title="出力">
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
          <p style={{ opacity: 0.6, fontSize: "0.8rem", marginTop: 8 }}>
            変換結果は表示のみです。詳細な多言語比較は{" "}
            <a
              href="/fe/transpile/"
              style={{ textDecoration: "underline" }}
            >
              /fe/transpile/
            </a>{" "}
            を利用してください。
          </p>
        </Panel>
      )}

      <style>{`
        @media (max-width: 900px) {
          .fe-playground-grid {
            grid-template-columns: minmax(0, 1fr) !important;
          }
        }
      `}</style>
    </div>
  );
}

function PrimaryButton({
  onClick,
  children,
}: {
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: "6px 12px",
        border: "1px solid #111",
        background: "#111",
        color: "#fff",
        borderRadius: "6px",
        fontSize: "0.9rem",
        cursor: "pointer",
      }}
    >
      {children}
    </button>
  );
}

function SecondaryButton({
  onClick,
  children,
  pressed = false,
}: {
  onClick: () => void;
  children: React.ReactNode;
  pressed?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={pressed}
      style={{
        padding: "6px 12px",
        border: "1px solid #111",
        background: pressed ? "#111" : "#fff",
        color: pressed ? "#fff" : "#111",
        borderRadius: "6px",
        fontSize: "0.9rem",
        cursor: "pointer",
      }}
    >
      {children}
    </button>
  );
}

function Panel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section
      style={{
        border: "1px solid var(--color-border, #e5e7eb)",
        borderRadius: "8px",
        padding: "10px 12px",
        background: "var(--color-background, #fff)",
      }}
    >
      <h3
        style={{
          fontSize: "0.85rem",
          fontWeight: 600,
          margin: "0 0 8px 0",
          opacity: 0.7,
          textTransform: "uppercase",
          letterSpacing: "0.03em",
        }}
      >
        {title}
      </h3>
      {children}
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
    paused: "実行中 (一時停止)",
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
  return (
    <span
      style={{
        display: "inline-block",
        padding: "2px 8px",
        border: `1px solid ${color[status] ?? "#6b7280"}`,
        color: color[status] ?? "#6b7280",
        borderRadius: "999px",
        fontSize: "0.75rem",
        alignSelf: "flex-start",
      }}
    >
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
