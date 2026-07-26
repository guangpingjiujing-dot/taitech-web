import { VizFrame } from "@/components/viz/VizFrame";

export type ExcelCellHighlight = {
  row: number; // 0-indexed data row
  col: number; // 0-indexed column
  tone?: "warn" | "wrong" | "correct";
};

export type ExcelTableProps = {
  title: string;
  sheetName?: string;
  columns: string[];
  rows: (string | number | null)[][];
  highlightCells?: ExcelCellHighlight[];
  note?: React.ReactNode;
  legend?: React.ReactNode;
};

/**
 * Excel シート風の静的テーブル。事故シーンを示す用途で使う。
 * 単一シート、A/B/C の列見出し、1〜N の行番号を持ち、指定したセルを
 * --warn / --wrong / --correct のトーンで淡くハイライトできる。
 */
export function ExcelTable({
  title,
  sheetName = "Sheet1",
  columns,
  rows,
  highlightCells = [],
  note,
  legend,
}: ExcelTableProps) {
  const highlightKey = (r: number, c: number) => `${r}:${c}`;
  const highlightMap = new Map(
    highlightCells.map((h) => [highlightKey(h.row, h.col), h.tone ?? "wrong"]),
  );

  const toneClass = (tone: string | undefined) => {
    if (tone === "wrong") return "bg-[var(--wrong-soft)]";
    if (tone === "correct") return "bg-[var(--correct-soft)]";
    if (tone === "warn") return "bg-[var(--muted)]";
    return "";
  };

  return (
    <VizFrame title={title} legend={legend}>
      <div className="overflow-x-auto border border-[var(--border-strong)] bg-[var(--card)]">
        {/* Excel シートのタブ風 header */}
        <div className="flex items-center justify-between border-b border-[var(--border)] bg-[var(--muted)] px-3 py-1.5">
          <span className="font-mono text-xs font-bold text-[var(--foreground)]">
            {sheetName}
          </span>
        </div>
        <table className="min-w-full font-mono text-xs">
          <thead>
            {/* Excel 風の A/B/C 列見出し */}
            <tr className="border-b border-[var(--border)] bg-[var(--muted)]/60">
              <th className="w-8 border-r border-[var(--border)] px-2 py-1 text-center text-[var(--muted-foreground)]">
                {" "}
              </th>
              {columns.map((_, i) => (
                <th
                  key={i}
                  className="border-r border-[var(--border)] px-2 py-1 text-center font-bold text-[var(--muted-foreground)]"
                >
                  {String.fromCharCode(65 + i)}
                </th>
              ))}
            </tr>
            {/* 実際の列名の行 */}
            <tr className="border-b border-[var(--border)] bg-[var(--muted)]/30">
              <th className="w-8 border-r border-[var(--border)] px-2 py-1 text-center text-[var(--muted-foreground)]">
                1
              </th>
              {columns.map((c, i) => (
                <th
                  key={i}
                  className="border-r border-[var(--border)] px-3 py-1.5 text-left font-bold text-[var(--foreground)]"
                >
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, r) => (
              <tr
                key={r}
                className="border-b border-[var(--border)] last:border-b-0"
              >
                <th className="w-8 border-r border-[var(--border)] bg-[var(--muted)]/30 px-2 py-1 text-center font-normal text-[var(--muted-foreground)]">
                  {r + 2}
                </th>
                {row.map((cell, c) => {
                  const tone = highlightMap.get(highlightKey(r, c));
                  return (
                    <td
                      key={c}
                      className={
                        "whitespace-nowrap border-r border-[var(--border)] px-3 py-1.5 text-[var(--foreground)] " +
                        toneClass(tone)
                      }
                    >
                      {cell === null || cell === "" ? (
                        <span className="text-[var(--muted-foreground)]">
                          &nbsp;
                        </span>
                      ) : (
                        String(cell)
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {note && (
        <div className="mt-3 text-xs text-[var(--muted-foreground)] leading-relaxed">
          {note}
        </div>
      )}
    </VizFrame>
  );
}
