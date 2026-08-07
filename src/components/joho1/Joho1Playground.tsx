"use client";

import { useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import {
  PlaygroundStoreProvider,
  usePlayground,
  type LanguageAdapter,
} from "@/components/playground/playgroundStore";
import { Button } from "@/components/ui/Button";
import { parse } from "@/lib/joho1/parser";
import { createJoho1State } from "@/lib/joho1";
import { JOHO1_EDITOR_EXTENSIONS } from "./joho1Language";
import { normalizePasteExtension } from "./pasteExtension";

const CodeEditor = dynamic(
  () => import("@/components/playground/CodeEditor").then((m) => m.CodeEditor),
  { ssr: false, loading: () => <EditorSkeleton /> },
);

/** 令和8年度本試験 図2 と同じ題材を、空欄なしで書いたもの */
const DEFAULT_CODE = `Touchaku = [0, 3, 4, 10, 11, 12]
kyakusu = 要素数(Touchaku)
taiken = 3
Shuryou = [0, 0, 0, 0, 0, 0]
Shuryou[1] = taiken
i を 2 から kyakusu まで 1 ずつ増やしながら繰り返す：
  matsu = 最大値(Touchaku[i], Shuryou[i - 1]) - Touchaku[i]
  Shuryou[i] = Touchaku[i] + matsu + taiken
  表示する(i, "人目の待ち時間：", matsu, "分間")
`;

const EDITOR_EXTENSIONS = [...JOHO1_EDITOR_EXTENSIONS, normalizePasteExtension];

export function Joho1Playground({
  initialCode,
  initialIndexBase = 1,
}: {
  initialCode?: string;
  /** レッスンや練習問題は「その問題の前提」に合わせて基点を指定する */
  initialIndexBase?: 0 | 1;
}) {
  /**
   * 添字の基点は **問題ごとに宣言されるもの**で言語の性質ではない
   * (00-overview.md §7-4 (2))。ストアは 1 度しか作られないので、
   * 実行のたびに最新の値を読めるよう ref 経由で adapter に渡す。
   */
  const indexBaseRef = useRef<0 | 1>(initialIndexBase);

  const adapter = useMemo<LanguageAdapter>(
    () => ({
      parse,
      createState: (program) =>
        createJoho1State(program, { indexBase: indexBaseRef.current }),
    }),
    [],
  );

  return (
    <PlaygroundStoreProvider
      initialCode={initialCode ?? DEFAULT_CODE}
      adapter={adapter}
    >
      <Panel indexBaseRef={indexBaseRef} initialIndexBase={initialIndexBase} />
    </PlaygroundStoreProvider>
  );
}

function Panel({
  indexBaseRef,
  initialIndexBase,
}: {
  indexBaseRef: { current: 0 | 1 };
  initialIndexBase: 0 | 1;
}) {
  const code = usePlayground((s) => s.code);
  const setCode = usePlayground((s) => s.setCode);
  const status = usePlayground((s) => s.status);
  const parseError = usePlayground((s) => s.parseError);
  const runtimeError = usePlayground((s) => s.runtimeError);
  const highlight = usePlayground((s) => s.highlight);
  const variables = usePlayground((s) => s.variables);
  const output = usePlayground((s) => s.output);
  const step = usePlayground((s) => s.step);
  const run = usePlayground((s) => s.run);
  const reset = usePlayground((s) => s.reset);

  const [indexBase, setIndexBase] = useState<0 | 1>(initialIndexBase);

  const changeIndexBase = (next: 0 | 1) => {
    indexBaseRef.current = next;
    setIndexBase(next);
    // 実行中の状態は古い基点で作られているので捨てる
    reset();
  };

  const error = parseError ?? runtimeError;

  return (
    <div className="not-prose">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Button onClick={step} size="sm">
          1 行ずつ実行
        </Button>
        <Button onClick={run} size="sm" variant="outline">
          最後まで実行
        </Button>
        <Button onClick={reset} size="sm" variant="outline">
          リセット
        </Button>

        <div className="ml-auto flex items-center gap-2 text-sm">
          <span className="text-[var(--muted-foreground)]">配列の添字</span>
          <div className="inline-flex border border-[var(--border)]">
            {([0, 1] as const).map((base) => (
              <button
                key={base}
                type="button"
                onClick={() => changeIndexBase(base)}
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
        </div>
      </div>

      <p className="mb-3 text-xs text-[var(--muted-foreground)] [overflow-wrap:anywhere]">
        添字が 0 から始まるか 1 から始まるかは、共通テストでは
        <strong>問題文のなかで毎回指定されます</strong>。解いている問題に合わせて切り替えてください。
      </p>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <CodeEditor
          extensions={EDITOR_EXTENSIONS}
          value={code}
          onChange={setCode}
          highlightLine={highlight.line}
          highlightVersion={highlight.version}
          minHeight="320px"
        />

        <div className="flex min-w-0 flex-col gap-4">
          <Pane title="変数">
            {variables.length === 0 ? (
              <Empty>まだ実行していません</Empty>
            ) : (
              <table className="w-full text-sm">
                <tbody>
                  {variables.map((v) => (
                    <tr key={`${v.frame}:${v.name}`} className="border-b border-[var(--border)] last:border-0">
                      <th scope="row" className="py-1 pr-2 text-left font-bold [overflow-wrap:anywhere]">
                        {v.name}
                      </th>
                      <td className="py-1 text-right font-mono [overflow-wrap:anywhere]">
                        {v.displayValue}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Pane>

          <Pane title="表示">
            {output.length === 0 ? (
              <Empty>まだ出力はありません</Empty>
            ) : (
              <ul className="space-y-1 font-mono text-sm">
                {output.map((line, i) => (
                  <li key={i} className="[overflow-wrap:anywhere]">
                    {line.text}
                  </li>
                ))}
              </ul>
            )}
          </Pane>
        </div>
      </div>

      {error && (
        <p
          role="alert"
          className="mt-3 border-l-2 border-[#c53030] bg-[#fff5f5] px-3 py-2 text-sm [overflow-wrap:anywhere]"
        >
          {error.pos.line} 行目: {error.message.replace(/^\d+行目[^:：]*[:：]\s*/, "")}
        </p>
      )}

      {status === "finished" && !error && (
        <p className="mt-3 text-sm text-[var(--muted-foreground)]">
          最後まで実行しました。
        </p>
      )}
    </div>
  );
}

function Pane({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border border-[var(--border)] p-3">
      <h3 className="mb-2 text-xs font-bold tracking-wide text-[var(--muted-foreground)]">
        {title}
      </h3>
      {children}
    </section>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-[var(--muted-foreground)]">{children}</p>;
}

function EditorSkeleton() {
  return (
    <div
      className="border border-[var(--border)]"
      style={{ minHeight: "320px" }}
      aria-hidden
    />
  );
}
