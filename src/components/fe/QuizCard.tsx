"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import {
  feQuizRunnableCode,
  type FeQuizChoiceId,
  type FeQuizMeta,
} from "@/content/fe/quiz";
import { findFeLesson } from "@/content/fe/lessons";
import { recordFeQuizResult } from "@/lib/fe/quizProgress";

/**
 * 練習問題 1 問分の出題 → 解答 → 解説表示。
 *
 * 解説は **常に DOM に出したまま** hidden 属性で隠す。クローラには読ませつつ、
 * 解答前の人間には見せないため (docs/fe-playground/04-quiz-design.md §7)。
 */
export function QuizCard({ quiz }: { quiz: FeQuizMeta }) {
  /** 選んだ選択肢。null = 未解答。押した時点で即採点する */
  const [picked, setPicked] = useState<FeQuizChoiceId | null>(null);
  const groupId = useId();
  const lesson = findFeLesson(quiz.lesson);
  const correct = quiz.choices.find((c) => c.id === quiz.answer)!;
  const answered = picked !== null;
  const isCorrect = picked === quiz.answer;

  // 選択肢は radio ではなく button。radio だとキーボードの矢印キーで
  // フォーカス移動しただけで選択が確定し、意図せず採点されてしまうため。
  const answer = (id: FeQuizChoiceId) => {
    if (answered) return;
    setPicked(id);
    recordFeQuizResult(quiz.slug, id === quiz.answer ? "correct" : "incorrect");
  };

  const retry = () => setPicked(null);

  return (
    <div>
      <p
        className="text-[var(--foreground)] leading-relaxed"
        data-speakable="definition"
        style={{ textWrap: "pretty" }}
      >
        {quiz.prompt}
      </p>

      <pre className="mt-4 overflow-x-auto rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 font-mono text-sm leading-relaxed">
        <code>{quiz.code.trimEnd()}</code>
      </pre>

      <div className="mt-6" role="group" aria-labelledby={`${groupId}-choices`}>
        <div
          id={`${groupId}-choices`}
          className="text-xs font-bold uppercase tracking-wider text-[var(--muted-foreground)]"
        >
          解答を選ぶ
        </div>
        <ul className="mt-3 space-y-2">
          {quiz.choices.map((c) => {
            const reveal = answered && c.id === quiz.answer;
            const wrongPick = picked === c.id && c.id !== quiz.answer;
            return (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => answer(c.id)}
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
                  <span className="min-w-0 flex-1 whitespace-pre-wrap font-mono text-sm leading-relaxed break-words">
                    {c.text}
                  </span>
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
            {isCorrect ? "正解" : `不正解 — 正解は ${quiz.answer}`}
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
        <h2 id={`${groupId}-explanation`} className="text-lg font-bold tracking-tight">
          解説
        </h2>
        <p className="mt-3 text-sm text-[var(--muted-foreground)]">
          正解: <strong className="text-[var(--foreground)]">{quiz.answer}</strong>{" "}
          <span className="whitespace-pre-wrap font-mono">{correct.text}</span>
        </p>
        <div className="mt-4 space-y-4 leading-relaxed" style={{ textWrap: "pretty" }}>
          {quiz.explanation.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>

        <div className="mt-6 border-l-2 border-[var(--foreground)] pl-4">
          <div className="text-xs font-bold uppercase tracking-wider text-[var(--muted-foreground)]">
            引っかけの正体
          </div>
          <p className="mt-1 leading-relaxed" style={{ textWrap: "pretty" }}>
            {quiz.trap}
          </p>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Button asChild size="sm">
            <Link
              href={`/fe?code=${encodeURIComponent(
                feQuizRunnableCode(quiz),
              )}&from=${encodeURIComponent(`/fe/quiz/${quiz.slug}`)}`}
              rel="nofollow"
            >
              このコードを実行シミュレーターで開く →
            </Link>
          </Button>
          {lesson && (
            <Button asChild size="sm" variant="secondary">
              <Link href={`/fe/lessons/${lesson.slug}`}>
                「{lesson.shortTitle}」のレッスンを読む →
              </Link>
            </Button>
          )}
        </div>
      </section>
    </div>
  );
}
