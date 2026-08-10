"use client";

import { Suspense, useCallback, useMemo, useRef, useState } from "react";
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
import { formatJoho1Value } from "./formatValue";
import { normalizePasteExtension } from "./pasteExtension";
import { Joho1PlaygroundDeepLink } from "./Joho1PlaygroundDeepLink";

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

export function Joho1Playground({
  initialCode,
  initialIndexBase = 1,
  enableDeepLink = false,
}: {
  initialCode?: string;
  /** レッスンや練習問題は「その問題の前提」に合わせて基点を指定する */
  initialIndexBase?: 0 | 1;
  /**
   * `?code=` / `?base=` を読んでエディタに流し込む。**セクショントップだけで true**。
   * レッスンや練習問題に埋め込んだ Playground まで URL で書き換わると、
   * そのページが説明している題材と中身がずれる。
   */
  enableDeepLink?: boolean;
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
      formatValue: formatJoho1Value,
    }),
    [],
  );

  return (
    <PlaygroundStoreProvider
      // 末尾の改行を落とす。残すと試験の紙面に無い行番号が 1 行余計に振られる
      initialCode={(initialCode ?? DEFAULT_CODE).replace(/\n+$/, "")}
      adapter={adapter}
    >
      <Panel
        indexBaseRef={indexBaseRef}
        initialIndexBase={initialIndexBase}
        enableDeepLink={enableDeepLink}
      />
    </PlaygroundStoreProvider>
  );
}

function Panel({
  indexBaseRef,
  initialIndexBase,
  enableDeepLink,
}: {
  indexBaseRef: { current: 0 | 1 };
  initialIndexBase: 0 | 1;
  enableDeepLink: boolean;
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
  const [pasteNormalized, setPasteNormalized] = useState(false);

  const editorExtensions = useMemo(
    () => [
      ...JOHO1_EDITOR_EXTENSIONS,
      normalizePasteExtension(() => setPasteNormalized(true)),
    ],
    [],
  );

  // deep link の effect 依存に入るので、参照を固定して再実行を防ぐ
  const changeIndexBase = useCallback(
    (next: 0 | 1) => {
      indexBaseRef.current = next;
      setIndexBase(next);
      // 実行中の状態は古い基点で作られているので捨てる
      reset();
    },
    [indexBaseRef, reset],
  );

  const error = parseError ?? runtimeError;

  return (
    <div className="not-prose @container/pg">
      {/* ?code= / ?base= の読み取りだけを Suspense 配下の client に閉じ込める
          (server の searchParams で受けると /joho1 が Dynamic になる) */}
      {enableDeepLink && (
        <Suspense fallback={null}>
          <Joho1PlaygroundDeepLink onIndexBase={changeIndexBase} />
        </Suspense>
      )}
      {/* 縦積みのときはツールバーを追従させ、「1 行ずつ実行 → 変数を見る」を
          片手で回せるようにする。**判定軸は 2 カラム化と同じ container query に揃える**
          — viewport で切ると「1 カラムだが sticky でない」帯ができる */}
      <div className="mb-3 flex flex-wrap items-center gap-2 @max-5xl/pg:sticky @max-5xl/pg:top-14 @max-5xl/pg:z-5 @max-5xl/pg:bg-[var(--background)] @max-5xl/pg:py-1.5">
        <Button onClick={step} size="sm">
          1 行ずつ実行
        </Button>
        <Button onClick={run} size="sm" variant="outline">
          最後まで実行
        </Button>
        <Button onClick={reset} size="sm" variant="outline">
          リセット
        </Button>

        <StatusBadge status={status} />

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

      {pasteNormalized && (
        <p className="mb-3 border-l-2 border-[var(--foreground)] bg-[var(--muted)] px-3 py-2 text-xs [overflow-wrap:anywhere]">
          貼り付けたプログラムから、行番号とブロックの罫線を取り除きました。
        </p>
      )}

      <p className="mb-3 text-xs text-[var(--muted-foreground)] [overflow-wrap:anywhere]">
        添字が 0 から始まるか 1 から始まるかは、共通テストでは
        <strong>問題文のなかで毎回指定されます</strong>。解いている問題に合わせて切り替えてください。
      </p>

      {/* 2 カラムにするかは **viewport ではなくコンテナ幅**で決める。
          レッスン本文は max-w-3xl (768px) なので、viewport が xl でも 2 カラムにすると
          エディタが 430px 程度に潰れてコードが右で切れる。1024px 以上のときだけ横に並べる */}
      <div className="grid gap-4 @5xl/pg:grid-cols-[minmax(0,1fr)_18rem]">
        <CodeEditor
          extensions={editorExtensions}
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
        <div
          role="alert"
          className="mt-3 border border-[#c53030] bg-[#fff5f5] px-3 py-2 text-sm text-[#9b2c2c] [overflow-wrap:anywhere]"
        >
          <p className="font-bold">
            {error.pos.line} 行目: {error.detail}
          </p>
          {error.hint && (
            <p className="mt-1 whitespace-pre-wrap text-[var(--foreground)]">
              ヒント: {error.hint}
            </p>
          )}
        </div>
      )}

    </div>
  );
}

/**
 * ウィジェット内のパネル。**見出しタグにしない**。
 * このコンポーネントはトップ (h1 直下) にもレッスン本文 (h2 の下) にも置かれるので、
 * 見出しレベルを固定するとどちらかで見出しの階層が飛ぶ。
 */
function Pane({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section aria-label={title} className="border border-[var(--border)] p-3">
      <div className="mb-2 text-xs font-bold tracking-wide text-[var(--muted-foreground)]">
        {title}
      </div>
      {children}
    </section>
  );
}

const STATUS_LABEL: Record<string, string> = {
  idle: "待機中",
  paused: "実行中",
  running: "実行中",
  finished: "終了",
  parseError: "構文エラー",
  runtimeError: "実行エラー",
};

/** 実行状態。パースエラー時も黄色のハイライトが付くので、文字で状態を出す */
function StatusBadge({ status }: { status: string }) {
  const isError = status === "parseError" || status === "runtimeError";
  return (
    <span
      aria-live="polite"
      className={`border px-2 py-1 text-xs font-bold ${
        isError
          ? "border-[#c53030] text-[#9b2c2c]"
          : "border-[var(--border)] text-[var(--muted-foreground)]"
      }`}
    >
      {STATUS_LABEL[status] ?? status}
    </span>
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
