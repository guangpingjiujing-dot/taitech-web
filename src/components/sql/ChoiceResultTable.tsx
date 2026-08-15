import { cn } from "@/lib/utils";

/**
 * 選択肢の結果表。
 *
 * 選択肢の正本は `formatSqlResult()` が作った 1 本の文字列
 * (`"商品番号 | 単価\nP03 | 80"`)。**採点テストがこの文字列を実行結果と
 * 突き合わせているので、構造化データを別に持たせて二重管理にはしない。**
 * 描画のためにここで読み直す。
 *
 * すべての選択肢が表とは限らない。「3 行」「監査室 | 0」「監査室 の行は出ない」
 * のような形もあるので、**表として読めるときだけ表にし、それ以外は素で出す**。
 */

const CELL_SEPARATOR = " | ";

interface ParsedTable {
  columns: string[];
  rows: string[][];
}

/**
 * 表として読めるなら列と行に分解する。読めなければ null。
 *
 * 条件は「**2 行以上**あり、どの行もセル数が同じ」。1 行だけのものを表にしないのは、
 * 見出しなのか本文なのかが決まらないため (「監査室 | 0」を見出し行として描くと嘘になる)。
 *
 * `allowHeaderOnly` を渡すと 1 行を「見出しだけ = 0 行の結果」として読む。
 * **設問の他の選択肢が表だと分かっているときにだけ使う** — 単独では
 * 「3 行」のような選択肢と区別が付かない。
 */
export function parseChoiceTable(
  text: string,
  { allowHeaderOnly = false }: { allowHeaderOnly?: boolean } = {},
): ParsedTable | null {
  const lines = text.split("\n").filter((l) => l.length > 0);
  if (lines.length < (allowHeaderOnly ? 1 : 2)) return null;

  const grid = lines.map((l) => l.split(CELL_SEPARATOR));
  const width = grid[0].length;
  if (!grid.every((cells) => cells.length === width)) return null;

  return { columns: grid[0], rows: grid.slice(1) };
}

/**
 * 設問の選択肢が結果表かどうか。
 *
 * **選択肢ごとに判定すると、同じ設問の中で表と素のテキストが混ざる。**
 * 「0 行」を表す見出しだけの選択肢が仲間外れになるのが典型。
 * 1 つでも表として読めたら、その設問はすべて表として描く。
 */
export function choicesAreResultTables(texts: string[]): boolean {
  return texts.some((t) => parseChoiceTable(t) !== null);
}

export function ChoiceResultTable({
  text,
  /** 設問全体が結果表のとき true。見出しだけの選択肢も表として描く */
  tabular = false,
}: {
  text: string;
  tabular?: boolean;
}) {
  const parsed = parseChoiceTable(text, { allowHeaderOnly: tabular });

  if (!parsed) {
    return (
      <span className="whitespace-pre-wrap font-mono text-sm leading-relaxed break-words">
        {text}
      </span>
    );
  }

  return (
    // 選択肢はボタンの中なので、幅が足りないときは自分の中でスクロールさせる
    <span className="block min-w-0 overflow-x-auto">
      {/* 枠は内側の span が持つ。表そのものに付けると border-collapse で
          角丸が潰れるうえ、幅いっぱいに伸びて中身から浮く。
          結果表 (ResultTableView) と同じ見た目に揃えている */}
      <span className="inline-block overflow-hidden rounded border border-[var(--border)] align-top">
        <table className="border-collapse text-sm">
          <thead>
            <tr className="bg-[var(--muted)]/60">
              {parsed.columns.map((c, i) => (
                <th
                  key={i}
                  scope="col"
                  className={cn(
                    "whitespace-nowrap border-b border-[var(--border)] px-2 py-1 text-left text-xs font-bold",
                    i > 0 && "border-l border-[var(--border)]",
                  )}
                >
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {parsed.rows.map((row, ri) => (
              <tr
                key={ri}
                className="border-b border-[var(--border)] last:border-b-0"
              >
                {row.map((cell, ci) => (
                  <td
                    key={ci}
                    className={cn(
                      "whitespace-nowrap px-2 py-1 font-mono text-xs",
                      ci > 0 && "border-l border-[var(--border)]",
                    )}
                  >
                    {cell === "NULL" ? (
                      <span className="text-[var(--muted-foreground)] italic">
                        NULL
                      </span>
                    ) : (
                      cell
                    )}
                  </td>
                ))}
              </tr>
            ))}
            {parsed.rows.length === 0 && (
              <tr>
                <td
                  colSpan={parsed.columns.length}
                  className="px-2 py-1.5 text-center text-xs text-[var(--muted-foreground)]"
                >
                  0 行
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </span>
    </span>
  );
}
