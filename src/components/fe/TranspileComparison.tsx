"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import {
  parse,
  transpileToPython,
  transpileToTypeScript,
  PseudoLexError,
  PseudoParseError,
} from "@/lib/pseudo";

const PseudoEditor = dynamic(
  () => import("./PseudoEditor").then((m) => m.PseudoEditor),
  {
    ssr: false,
    loading: () => (
      <div
        style={{
          minHeight: "260px",
          border: "1px solid var(--color-border, #e5e7eb)",
          borderRadius: "8px",
          padding: "12px",
        }}
      >
        エディタを読み込み中…
      </div>
    ),
  },
);

const DEFAULT_CODE = `整数型: n ← 5
整数型: 合計 ← 0
for (i を 1 から n まで 1 ずつ増やす)
  合計 ← 合計 + i
endfor
print(合計)
`;

export function TranspileComparison() {
  const [code, setCode] = useState(DEFAULT_CODE);

  const transpiled = useMemo(() => {
    try {
      const ast = parse(code);
      return {
        python: transpileToPython(ast),
        typescript: transpileToTypeScript(ast),
        error: null as string | null,
      };
    } catch (e) {
      if (e instanceof PseudoLexError || e instanceof PseudoParseError) {
        return {
          python: null,
          typescript: null,
          error: e.message,
        };
      }
      return {
        python: null,
        typescript: null,
        error: "変換に失敗しました",
      };
    }
  }, [code]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <div
        style={{
          display: "grid",
          gap: "16px",
          gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
        }}
        className="fe-transpile-grid"
      >
        <Pane title="擬似言語 (入力)">
          <PseudoEditor
            value={code}
            onChange={setCode}
            minHeight="380px"
          />
        </Pane>
        <Pane title="Python">
          <CodeReadonly value={transpiled.python} error={transpiled.error} />
        </Pane>
        <Pane title="TypeScript">
          <CodeReadonly
            value={transpiled.typescript}
            error={transpiled.error}
          />
        </Pane>
      </div>
      {transpiled.error && (
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
          {transpiled.error}
        </div>
      )}
      <style>{`
        @media (max-width: 900px) {
          .fe-transpile-grid {
            grid-template-columns: minmax(0, 1fr) !important;
          }
        }
      `}</style>
    </div>
  );
}

function Pane({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      <h3
        style={{
          fontSize: "0.75rem",
          fontWeight: 700,
          margin: 0,
          opacity: 0.7,
          textTransform: "uppercase",
          letterSpacing: "0.05em",
        }}
      >
        {title}
      </h3>
      {children}
    </div>
  );
}

function CodeReadonly({
  value,
  error,
}: {
  value: string | null;
  error: string | null;
}) {
  return (
    <pre
      style={{
        margin: 0,
        padding: "12px 14px",
        border: "1px solid var(--color-border, #e5e7eb)",
        borderRadius: "8px",
        minHeight: "380px",
        maxHeight: "480px",
        overflow: "auto",
        fontFamily: "var(--font-geist-mono), monospace",
        fontSize: "0.85rem",
        lineHeight: 1.5,
        background: "var(--color-muted, #f9fafb)",
        color: error ? "#7f1d1d" : "inherit",
        whiteSpace: "pre",
      }}
    >
      {error ? `// 変換できません\n// ${error}` : value ?? ""}
    </pre>
  );
}
