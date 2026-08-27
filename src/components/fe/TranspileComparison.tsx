"use client";

import dynamic from "next/dynamic";
import { useMemo, useRef, useState } from "react";
import {
  parse,
  transpileToPython,
  transpileToTypeScript,
  PseudoLexError,
  PseudoParseError,
} from "@/lib/pseudo";

import { lineNumbers } from "@codemirror/view";
import { pseudoLanguage } from "./pseudoLanguage";
import {
  EditorFallback,
  EditorFallbackProvider,
} from "@/components/playground/EditorFallback";

// 言語定義と行番号は言語ごとに違うのでエディタ本体から出してある
// (`/joho1` は `(01)` 形式の行番号 + ブロック罫線)
const FE_EDITOR_EXTENSIONS = [lineNumbers(), pseudoLanguage];

const CodeEditor = dynamic(
  () => import("@/components/playground/CodeEditor").then((m) => m.CodeEditor),
  {
    ssr: false,
    // 変換元の擬似言語を初期 HTML に残す。ここが空だと、変換結果の Python / TypeScript
    // だけが HTML にあって入力が無いという状態になり、このページの主題が
    // AI から読めなくなる (docs/wip/20260828-seo-aeo-review/00-review.md §2)
    loading: () => <EditorFallback height="380px" />,
  },
);

const DEFAULT_CODE = `整数型: n ← 5
整数型: 合計 ← 0
for (i を 1 から n まで 1 ずつ増やす)
  合計 ← 合計 + i
endfor
print(合計)
`;

interface Snippet {
  label: string;
  text: string;
  hint: string;
}

const SNIPPETS: Snippet[] = [
  { label: "if", text: "if (x > 0) then\n  \nendif\n", hint: "条件分岐" },
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
  { label: "変数", text: "整数型: x ← 0\n", hint: "変数宣言 + 初期化" },
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
  { label: "print", text: "print()\n", hint: "値を出力" },
];

export function TranspileComparison() {
  const [code, setCode] = useState(DEFAULT_CODE);
  const insertRef = useRef<((text: string) => void) | null>(null);

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
    <EditorFallbackProvider code={DEFAULT_CODE}>
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* Snippet toolbar sits ABOVE the 3-column grid so the three code panes
          always line up horizontally regardless of how many snippet buttons
          wrap onto a second row. */}
      <SnippetToolbar onInsert={(text) => insertRef.current?.(text)} />

      <div
        style={{
          display: "grid",
          gap: "16px",
          gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
          alignItems: "start",
        }}
        className="fe-transpile-grid"
      >
        <Pane title="擬似言語 (入力)">
          <CodeEditor
            extensions={FE_EDITOR_EXTENSIONS}
            value={code}
            onChange={setCode}
            height="380px"
            onReady={({ insertText }) => {
              insertRef.current = insertText;
            }}
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
    </EditorFallbackProvider>
  );
}

function SnippetToolbar({
  onInsert,
}: {
  onInsert: (text: string) => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "6px",
      }}
    >
      <span
        style={{
          fontSize: "0.75rem",
          color: "var(--color-muted-foreground, #6b7280)",
          marginRight: "2px",
        }}
      >
        テンプレートを挿入
      </span>
      {SNIPPETS.map((s) => (
        <button
          key={s.label}
          type="button"
          onClick={() => onInsert(s.text)}
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
          fontSize: "0.8rem",
          fontWeight: 700,
          margin: 0,
          opacity: 0.7,
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
