import { SqlPlayground } from "./SqlPlayground";
import type { DatasetKey } from "@/content/fe/sql/datasets";

/**
 * レッスン本文に埋め込む Playground。
 *
 * `not-prose` で包むのは、`globals.css` の `.prose-jp a` などが
 * Playground の中のボタンやリンクに効いてしまうため（AGENTS.md の
 * 「prose-jp の specificity trap」）。埋め込み Playground はこの形で統一する。
 */
export function SqlLessonPlayground({
  sql,
  datasetKey,
}: {
  sql: string;
  datasetKey: DatasetKey;
}) {
  return (
    <div className="not-prose my-6">
      <SqlPlayground initialSql={sql} datasetKey={datasetKey} compact />
    </div>
  );
}
