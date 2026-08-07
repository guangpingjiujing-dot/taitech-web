import { Joho1Playground } from "./Joho1Playground";

/**
 * レッスン本文に埋める実行シミュレーター。
 *
 * `not-prose` で包むのは、`.prose-jp a` の specificity がボタン類に勝ってしまい
 * 黒背景に黒文字になるため (AGENTS.md「prose-jp の specificity trap」)。
 */
export function LessonPlayground({
  code,
  indexBase,
}: {
  code: string;
  indexBase: 0 | 1;
}) {
  return (
    <div className="not-prose my-6">
      <Joho1Playground initialCode={code} initialIndexBase={indexBase} />
    </div>
  );
}
