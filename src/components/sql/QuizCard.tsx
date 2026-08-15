import { QuizCard as QuizCardView } from "@/components/quiz/QuizCard";
import { sqlQuizRunnableSql, type SqlQuizMeta } from "@/content/fe/sql/quiz";
import { findSqlLesson } from "@/content/fe/sql/lessons";
import {
  ChoiceResultTable,
  choicesAreResultTables,
} from "./ChoiceResultTable";
import { QuizSourceTables } from "./QuizSourceTables";

/**
 * SQL の練習問題 1 問。出題 UI は `components/quiz/QuizCard` が持ち、
 * ここは SqlQuizMeta とリンク先の解決だけを担う
 * (`components/fe/QuizCard.tsx` と同じ形)。
 */
export function SqlQuizCard({ quiz }: { quiz: SqlQuizMeta }) {
  const lesson = findSqlLesson(quiz.lesson);
  const tabular = choicesAreResultTables(quiz.choices.map((c) => c.text));
  const runHref = `/fe/sql?sql=${encodeURIComponent(
    sqlQuizRunnableSql(quiz),
  )}&dataset=${encodeURIComponent(quiz.datasetKey)}&from=${encodeURIComponent(
    `/fe/sql/quiz/${quiz.slug}`,
  )}`;

  return (
    <QuizCardView
      namespace="fe-sql"
      slug={quiz.slug}
      prompt={quiz.prompt}
      code={quiz.sql}
      beforeCode={
        <QuizSourceTables sql={quiz.sql} datasetKey={quiz.datasetKey} />
      }
      /* 選択肢が結果表なら、`|` を並べた文字列ではなく表として組む。
         `text` は採点と読み上げの正本として残したまま `node` を足す。
         「3 行」のような選択肢の設問では表にしない */
      choices={quiz.choices.map((c) => ({
        ...c,
        node: tabular ? <ChoiceResultTable text={c.text} tabular /> : undefined,
      }))}
      answer={quiz.answer}
      explanation={quiz.explanation}
      trap={quiz.trap}
      runHref={runHref}
      lessonHref={lesson ? `/fe/sql/lessons/${lesson.slug}` : undefined}
      lessonLabel={lesson?.shortTitle}
    />
  );
}
