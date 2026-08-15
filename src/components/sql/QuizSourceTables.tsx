import { collectTableNames, parse, sameName } from "@/lib/sql";
import { findDataset, type DatasetKey } from "@/content/fe/sql/datasets";
import { ResultTableView } from "./ResultTableView";

/**
 * 練習問題が使う表の中身。
 *
 * **これが無いと問題が解けない。** 「使用する表: 商品・在庫」という注記だけでは
 * どんな行が入っているか分からず、実行結果を選べない。
 *
 * データセットの全表ではなく、**その SQL が実際に参照している表だけ**を出す。
 * 無関係な表が並ぶと、どれを見て考えればよいのか分からなくなる。
 */
export function QuizSourceTables({
  sql,
  datasetKey,
}: {
  sql: string;
  datasetKey: DatasetKey;
}) {
  const dataset = findDataset(datasetKey);
  const db = dataset.build();

  let referenced: string[];
  try {
    referenced = collectTableNames(parse(sql));
  } catch {
    // 解析できない SQL は作問ミスだが、ここで落として問題ページごと消さない
    referenced = [];
  }

  const tables = db.tables.filter((t) =>
    referenced.some((name) => sameName(name, t.schema.name)),
  );
  // 参照が拾えなかったときは全表を出す (見えないより多いほうがまだ解ける)
  const shown = tables.length > 0 ? tables : db.tables;

  return (
    <section aria-label="問題で使う表" className="mt-4">
      <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--muted-foreground)]">
        この問題で使う表
      </h2>
      <div className="mt-3 grid gap-4 sm:grid-cols-2">
        {shown.map((table) => (
          <div key={table.schema.name} className="min-w-0">
            <div className="mb-1.5 font-mono text-sm font-bold">
              {table.schema.name}
            </div>
            <ResultTableView
              columns={table.schema.columns.map((c) => ({
                name: c.name,
                qualifier: null,
              }))}
              rows={table.rows}
              emptyMessage="この表には行がありません（0 行）"
            />
          </div>
        ))}
      </div>
    </section>
  );
}
