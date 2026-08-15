import { SqlPlayground } from "./SqlPlayground";
import type { DatasetKey } from "@/content/fe/sql/datasets";

/**
 * レッスン本文に埋め込む Playground。
 *
 * **1 ページに何台でも置いてよい。** 節ごとに、その節で説明した SQL が
 * 入った状態で置くと、読んだ直後にそのまま動かせる。擬似言語のレッスンも
 * 同じ形（1 ページに 3 台）で運用している。
 *
 * `not-prose` で包むのは、`globals.css` の `.prose-jp` が Playground の中の
 * 表・リスト・リンクにまで効いてしまうため。**この仕組みは typography プラグインの
 * ものではなく、`globals.css` 側で `:not(.not-prose, .not-prose *)` を
 * 自前で書いて成立させている**（プラグインは入っていない）。
 */
export function SqlLessonPlayground({
  sql,
  datasetKey,
  /** 何を試す台なのかの一行見出し。1 ページに複数置くときは必ず付ける */
  caption,
}: {
  sql: string;
  datasetKey: DatasetKey;
  caption?: string;
}) {
  return (
    <div className="not-prose my-6">
      {caption && (
        <p className="mb-2 text-xs font-bold text-[var(--muted-foreground)]">
          {caption}
        </p>
      )}
      <SqlPlayground initialSql={sql} datasetKey={datasetKey} compact />
    </div>
  );
}
