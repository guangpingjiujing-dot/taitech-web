"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import { parse } from "@/lib/joho1/parser";
import { transpileJoho1ToPython } from "@/lib/joho1/transpiler/python";
import { PseudoLexError, PseudoParseError } from "@/lib/pseudo/errors";
import { JOHO1_EDITOR_EXTENSIONS } from "./joho1Language";

const CodeEditor = dynamic(
  () => import("@/components/playground/CodeEditor").then((m) => m.CodeEditor),
  { ssr: false, loading: () => <EditorSkeleton /> },
);

/** 繰り返し・配列・外部関数がひととおり入った題材。授業の Python と対応が付きやすい形 */
const DEFAULT_CODE = `Tokuten = [62, 78, 55, 91, 70]
ninzuu = 要素数(Tokuten)
goukei = 0
i を 1 から ninzuu まで 1 ずつ増やしながら繰り返す：
  goukei = goukei + Tokuten[i]
heikin = goukei ÷ ninzuu
表示する("平均は", heikin, "点")`;

const EDITOR_HEIGHT = "360px";

export function Joho1TranspileComparison() {
  const [code, setCode] = useState(DEFAULT_CODE);
  const [indexBase, setIndexBase] = useState<0 | 1>(1);

  const result = useMemo(() => {
    try {
      return {
        python: transpileJoho1ToPython(parse(code), { indexBase }),
        error: null as string | null,
      };
    } catch (e) {
      if (e instanceof PseudoLexError || e instanceof PseudoParseError) {
        return { python: null, error: `${e.pos.line} 行目: ${e.detail}` };
      }
      return { python: null, error: "変換できませんでした" };
    }
  }, [code, indexBase]);

  return (
    <div className="not-prose @container/tp flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="text-[var(--muted-foreground)]">配列の添字</span>
        <div className="inline-flex border border-[var(--border)]">
          {([0, 1] as const).map((base) => (
            <button
              key={base}
              type="button"
              onClick={() => setIndexBase(base)}
              aria-pressed={indexBase === base}
              className={`cursor-pointer px-3 py-1 font-bold ${
                indexBase === base
                  ? "bg-[var(--foreground)] text-[var(--background)]"
                  : "hover:bg-[var(--muted)]"
              }`}
            >
              {base} から
            </button>
          ))}
        </div>
        <span className="text-xs text-[var(--muted-foreground)] [overflow-wrap:anywhere]">
          Python の添字は必ず 0 から始まるので、1 始まりの問題では変換のときに -1 されます
        </span>
      </div>

      {/* 横に並べるかは viewport ではなくコンテナ幅で決める (レッスン本文にも置けるように) */}
      <div className="grid grid-cols-1 gap-4 @3xl/tp:grid-cols-2">
        <Pane title="プログラム表記（入力）">
          <CodeEditor
            extensions={JOHO1_EDITOR_EXTENSIONS}
            value={code}
            onChange={setCode}
            minHeight={EDITOR_HEIGHT}
          />
        </Pane>
        <Pane title="Python">
          <pre
            className="m-0 overflow-auto border border-[var(--border)] bg-[var(--muted)] p-3 font-mono text-sm leading-relaxed"
            style={{ minHeight: EDITOR_HEIGHT, maxHeight: "480px" }}
          >
            {result.error
              ? `# 変換できません\n# ${result.error}`
              : (result.python ?? "")}
          </pre>
        </Pane>
      </div>

      {result.error && (
        <div
          role="alert"
          className="border border-[#c53030] bg-[#fff5f5] px-3 py-2 text-sm text-[#9b2c2c] [overflow-wrap:anywhere]"
        >
          {result.error}
        </div>
      )}
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
    <section aria-label={title} className="flex min-w-0 flex-col gap-1.5">
      <div className="text-xs font-bold tracking-wide text-[var(--muted-foreground)]">
        {title}
      </div>
      {children}
    </section>
  );
}

function EditorSkeleton() {
  return (
    <div
      className="border border-[var(--border)]"
      style={{ minHeight: EDITOR_HEIGHT }}
      aria-hidden
    />
  );
}
