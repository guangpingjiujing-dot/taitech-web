"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { recordQuizResult, type QuizNamespace } from "@/lib/quiz/progress";

/**
 * 練習問題 1 問分の出題 → 解答 → 解説表示 (presentation)。
 *
 * 解説は **常に DOM に出したまま** hidden 属性で隠す。クローラには読ませつつ、
 * 解答前の人間には見せないため (docs/sections/fe-playground.md の作問方針)。
 *
 * `/fe` と `/joho1` で問題の型が違うので、ここはセクション固有の型を受け取らない。
 * データ層は `components/{section}/QuizCard.tsx` のラッパが持つ。
 */
export interface QuizCardChoice {
  id: string;
  /**
   * 選択肢の中身。**採点と読み上げの正本はこちら**なので、`node` を渡す場合も必ず埋める。
   * 擬似言語の出力のように素のテキストで読めるものは、これだけで足りる。
   */
  text: string;
  /**
   * `text` の代わりに描画する要素。SQL の結果表のように、
   * **区切り文字を並べた文字列では読めないもの**をきちんと組んで見せるために使う。
   */
  node?: React.ReactNode;
}

export function QuizCard({
  namespace,
  slug,
  prompt,
  code,
  choices,
  answer,
  explanation,
  trap,
  runHref,
  lessonHref,
  lessonLabel,
  /** コードの上に出す前置き (情報I では添字の基点をここで明示する) */
  codeNote,
  /**
   * コードの直前に差し込む要素。SQL の練習問題で**問題が使う表そのもの**を
   * 出すのに使う。表の中身が見えないと解答できないので、
   * 「使用する表: 商品・在庫」という注記だけでは足りない。
   */
  beforeCode,
}: {
  namespace: QuizNamespace;
  slug: string;
  prompt: string;
  code: string;
  choices: readonly QuizCardChoice[];
  answer: string;
  explanation: readonly string[];
  trap: string;
  runHref: string;
  lessonHref?: string;
  lessonLabel?: string;
  codeNote?: string;
  beforeCode?: React.ReactNode;
}) {
  /** 選んだ選択肢。null = 未解答。押した時点で即採点する */
  const [picked, setPicked] = useState<string | null>(null);
  const groupId = useId();
  const correct = choices.find((c) => c.id === answer)!;
  const answered = picked !== null;
  const isCorrect = picked === answer;

  // 選択肢は radio ではなく button。radio だとキーボードの矢印キーで
  // フォーカス移動しただけで選択が確定し、意図せず採点されてしまうため。
  const pick = (id: string) => {
    if (answered) return;
    setPicked(id);
    recordQuizResult(namespace, slug, id === answer ? "correct" : "incorrect");
  };

  const retry = () => setPicked(null);

  return (
    <div>
      <p
        className="text-[var(--foreground)] leading-relaxed"
        data-speakable="definition"
        style={{ textWrap: "pretty" }}
      >
        {prompt}
      </p>

      {/* 改行区切りで複数行渡せる (情報I では 添字の基点 + 与えられた関数の説明) */}
      {codeNote && (
        <p className="mt-3 whitespace-pre-line border-l-2 border-[var(--foreground)] pl-3 text-sm text-[var(--muted-foreground)] leading-relaxed">
          {codeNote}
        </p>
      )}

      {beforeCode}

      <pre className="mt-4 overflow-x-auto rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 font-mono text-sm leading-relaxed">
        <code>{code.trimEnd()}</code>
      </pre>

      <div className="mt-6" role="group" aria-labelledby={`${groupId}-choices`}>
        <div
          id={`${groupId}-choices`}
          className="text-xs font-bold uppercase tracking-wider text-[var(--muted-foreground)]"
        >
          解答を選ぶ
        </div>
        <ul className="mt-3 space-y-2">
          {choices.map((c) => {
            const reveal = answered && c.id === answer;
            const wrongPick = picked === c.id && c.id !== answer;
            return (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => pick(c.id)}
                  aria-disabled={answered}
                  className={[
                    "flex w-full items-start gap-3 rounded-lg border p-3 text-left transition-colors",
                    reveal
                      ? "border-[var(--foreground)] bg-[var(--muted)]/60"
                      : wrongPick
                        ? "border-[var(--border-strong)] bg-[var(--muted)]/30 line-through decoration-1"
                        : answered
                          ? "border-[var(--border)] opacity-60"
                          : "border-[var(--border)] hover:border-[var(--border-strong)] hover:bg-[var(--muted)]/40",
                    answered ? "cursor-default" : "cursor-pointer",
                  ].join(" ")}
                >
                  <span className="mt-px shrink-0 font-bold">{c.id}</span>
                  {c.node ? (
                    <span className="min-w-0 flex-1">{c.node}</span>
                  ) : (
                    <span className="min-w-0 flex-1 whitespace-pre-wrap font-mono text-sm leading-relaxed break-words">
                      {c.text}
                    </span>
                  )}
                  {reveal && (
                    <span className="shrink-0 rounded-sm bg-[var(--foreground)] px-1.5 py-0.5 text-[10px] font-semibold text-[var(--background)]">
                      正解
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {answered && (
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <span
            className={[
              "inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm font-bold",
              isCorrect
                ? "border-[var(--foreground)] bg-[var(--foreground)] text-[var(--background)]"
                : "border-[var(--border-strong)] text-[var(--foreground)]",
            ].join(" ")}
            role="status"
          >
            {isCorrect ? "正解" : `不正解 — 正解は ${answer}`}
          </span>
          <Button type="button" variant="secondary" onClick={retry}>
            もう一度考える
          </Button>
        </div>
      )}

      {/* 解説: 解答前は hidden で隠すが DOM には常に存在する (SEO / クローラ向け) */}
      <section
        hidden={!answered}
        aria-labelledby={`${groupId}-explanation`}
        className="mt-8 border-t border-[var(--border)] pt-8"
      >
        <h2
          id={`${groupId}-explanation`}
          className="text-lg font-bold tracking-tight"
        >
          解説
        </h2>
        {/* 選択肢と同じ見せ方をする。表を選ばせておいて解説では `|` 区切りの
            文字列に戻ると、答え合わせのときに見比べられない */}
        <div className="mt-3 flex flex-wrap items-start gap-x-2 gap-y-1 text-sm text-[var(--muted-foreground)]">
          <span>
            正解: <strong className="text-[var(--foreground)]">{answer}</strong>
          </span>
          {correct.node ?? (
            <span className="whitespace-pre-wrap font-mono">{correct.text}</span>
          )}
        </div>
        <div
          className="mt-4 space-y-4 leading-relaxed"
          style={{ textWrap: "pretty" }}
        >
          {explanation.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>

        <div className="mt-6 border-l-2 border-[var(--foreground)] pl-4">
          <div className="text-xs font-bold uppercase tracking-wider text-[var(--muted-foreground)]">
            引っかけの正体
          </div>
          <p className="mt-1 leading-relaxed" style={{ textWrap: "pretty" }}>
            {trap}
          </p>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Button asChild size="sm">
            <Link href={runHref} rel="nofollow">
              このコードを実行シミュレーターで開く →
            </Link>
          </Button>
          {lessonHref && lessonLabel && (
            <Button asChild size="sm" variant="secondary">
              <Link href={lessonHref}>「{lessonLabel}」のレッスンを読む →</Link>
            </Button>
          )}
        </div>
      </section>
    </div>
  );
}
