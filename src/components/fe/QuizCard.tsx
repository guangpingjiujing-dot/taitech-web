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
  const [selected, setSelected] = useState<FeQuizChoiceId | null>(null);
  const [answered, setAnswered] = useState(false);
  const groupId = useId();
  const lesson = findFeLesson(quiz.lesson);
  const correct = quiz.choices.find((c) => c.id === quiz.answer)!;
  const isCorrect = answered && selected === quiz.answer;

  const submit = () => {
    if (!selected) return;
    setAnswered(true);
    recordFeQuizResult(quiz.slug, selected === quiz.answer ? "correct" : "incorrect");
  };

  const retry = () => {
    setAnswered(false);
    setSelected(null);
  };

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

      <fieldset className="mt-6" disabled={answered}>
        <legend className="text-xs font-bold uppercase tracking-wider text-[var(--muted-foreground)]">
          解答を選ぶ
        </legend>
        <ul className="mt-3 space-y-2">
          {quiz.choices.map((c) => {
            const checked = selected === c.id;
            const reveal = answered && c.id === quiz.answer;
            const wrongPick = answered && checked && c.id !== quiz.answer;
            return (
              <li key={c.id}>
                <label
                  className={[
                    "flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors",
                    reveal
                      ? "border-[var(--foreground)] bg-[var(--muted)]/60"
                      : wrongPick
                        ? "border-[var(--border-strong)] bg-[var(--muted)]/30 line-through decoration-1"
                        : checked
                          ? "border-[var(--foreground)]"
                          : "border-[var(--border)] hover:border-[var(--border-strong)] hover:bg-[var(--muted)]/40",
                    answered ? "cursor-default" : "",
                  ].join(" ")}
                >
                  <input
                    type="radio"
                    name={groupId}
                    value={c.id}
                    checked={checked}
                    onChange={() => setSelected(c.id)}
                    className="sr-only"
                  />
                  <span className="mt-px shrink-0 font-bold">{c.id}</span>
                  <span className="min-w-0 flex-1 whitespace-pre-wrap font-mono text-sm leading-relaxed break-words">
                    {c.text}
                  </span>
                  {reveal && (
                    <span className="shrink-0 rounded-sm bg-[var(--foreground)] px-1.5 py-0.5 text-[10px] font-semibold text-[var(--background)]">
                      正解
                    </span>
                  )}
                </label>
              </li>
            );
          })}
        </ul>
      </fieldset>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        {!answered ? (
          <Button type="button" onClick={submit} disabled={!selected}>
            答え合わせ
          </Button>
        ) : (
          <>
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
          </>
        )}
        {!answered && !selected && (
          <span className="text-xs text-[var(--muted-foreground)]">
            選択肢を選ぶと答え合わせできます
          </span>
        )}
      </div>

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
              href={`/fe?code=${encodeURIComponent(feQuizRunnableCode(quiz))}`}
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
