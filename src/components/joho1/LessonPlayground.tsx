import { Joho1Playground } from "./Joho1Playground";
import { findJoho1Lesson, type Joho1LessonSlug } from "@/content/joho1/lessons";

/**
 * レッスン本文に埋める実行シミュレーター。
 *
 * **コードは slug から `lesson.sampleCode` を引く。** 本文にベタ書きすると、
 * `lessons.test.ts` がインタプリタに通して検証しているのは `sampleCode` のほうなので、
 * 片方だけ直したときに誰も気付かない (`docs/sections/fe-playground.md` §4 が
 * 「最大の事故」と書いた解答キーずれと同じ構造)。
 *
 * `not-prose` で包むのは、`.prose-jp a` の specificity がボタン類に勝ってしまい
 * 黒背景に黒文字になるため (AGENTS.md「prose-jp の specificity trap」)。
 */
export function LessonPlayground({ slug }: { slug: Joho1LessonSlug }) {
  const lesson = findJoho1Lesson(slug);
  if (!lesson) return null;
  return (
    <div className="not-prose my-6">
      <Joho1Playground
        initialCode={lesson.sampleCode}
        initialIndexBase={lesson.indexBase}
      />
    </div>
  );
}
