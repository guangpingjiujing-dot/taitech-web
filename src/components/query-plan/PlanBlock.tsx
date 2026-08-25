import type { ExplainResult } from "@/lib/query-plan/types";
import { renderPlan } from "@/lib/query-plan/render";
import { naiveSelfTimes, nodeLabel, selfTimes } from "@/lib/query-plan/analyze";
import { cn } from "@/lib/utils";
import { CAPTURE_META } from "@/content/query-plan/capture";

/**
 * 行番号つきのコードブロック。
 *
 * **本文が「上から N 行目」と言うなら、読者が数えずに済む形で出す。**
 * 行番号は本文側の `lineOf()`（`render.ts`）と**同じ描画結果**を分割して振るので、
 * 本文の数字と画面の数字がずれない。
 *
 * - 行番号列は `select-none` + 別要素。範囲選択でコピーしても本文に混ざらない
 * - 横スクロールしても行番号が残るよう `sticky left-0`
 */
export function NumberedCode({ text, className }: { text: string; className?: string }) {
  const lines = text.split("\n");
  return (
    <div
      className={cn(
        "flex overflow-x-auto border border-[var(--border)] bg-[var(--muted)]/40 font-mono text-[13px] leading-relaxed",
        className,
      )}
    >
      <div
        aria-hidden
        className="sticky left-0 shrink-0 select-none border-r border-[var(--border)] bg-[var(--muted)]/40 py-4 pl-3 pr-2 text-right tabular-nums text-[var(--muted-foreground)]"
      >
        {lines.map((_, i) => (
          <div key={i}>{i + 1}</div>
        ))}
      </div>
      <pre className="min-w-0 py-4 pl-4 pr-4">
        <code>{text}</code>
      </pre>
    </div>
  );
}

/**
 * 実行計画をそのまま見せるブロック。
 *
 * **中身は `EXPLAIN (FORMAT JSON)` から描画している**（`src/lib/query-plan/render.ts`）。
 * テキストを別に持つと、計画を採り直したときに本文と食い違うため。
 *
 * `prose-jp` の中で使うと `pre` に prose の余白が乗るので `not-prose` で包む。
 */
export function PlanBlock({
  plan,
  caption,
  hideBuffers = true,
}: {
  plan: ExplainResult;
  caption?: string;
  /** STEP 1 のページでは `Buffers:` が情報過多になるので既定で隠す */
  hideBuffers?: boolean;
}) {
  return (
    <div className="not-prose my-6">
      <NumberedCode text={renderPlan(plan, { hideBuffers })} />
      {/* ★ 採取版・採取日は caption に手で書かせない。書き漏らしたブロックができる
          （06-content-review.md S7）。全ブロックに必ず付ける */}
      <p className="mt-2 text-xs leading-relaxed text-[var(--muted-foreground)]">
        {caption ? (
          <>
            {caption}
            <br />
          </>
        ) : null}
        <span className="tabular-nums">{CAPTURE_META}</span>
      </p>
    </div>
  );
}

const ms = (v: number) => `${v.toFixed(1)}ms`;
const pct = (v: number) => `${(v * 100).toFixed(1)}%`;

/**
 * 「上端の数字だけ拾って引き算する」実演を**計画から生成する**。
 *
 * 親 1 + 子 n の浅い計画専用（`find-bottleneck` の 3 ノードの練習）。
 * **数字を本文に手で書かないため**にある。手で書くと採り直したときに
 * 下の `SelfTimeTable` とだけ食い違う（05-implementation-review.md A-1 と同じ壊れ方）。
 */
export function SubtractionSketch({ plan }: { plan: ExplainResult }) {
  const root = plan.Plan;
  const kids = root.Plans ?? [];
  const t = (n: (typeof kids)[number]) => (n["Actual Total Time"] ?? 0).toFixed(3);
  const pad = (s: string) => s.padEnd(12);

  const tree = [
    `${pad(nodeLabel(root))} ${t(root)}      ← いちばん上`,
    ...kids.map((k) => `  ${pad(nodeLabel(k))} ${t(k)}`),
  ].join("\n");

  const sum = kids.reduce((a, k) => a + (k["Actual Total Time"] ?? 0), 0);
  const self = (root["Actual Total Time"] ?? 0) - sum;
  const formula =
    `${nodeLabel(root)} の自分の時間 = ${t(root)} - (` +
    kids.map((k) => t(k)).join(" + ") +
    `) = ${self.toFixed(3)}`;

  return (
    <div className="not-prose my-6 space-y-4">
      <pre className="overflow-x-auto border border-[var(--border)] bg-[var(--muted)]/40 p-4 text-[13px] leading-relaxed">
        <code>{tree}</code>
      </pre>
      <pre className="overflow-x-auto border border-[var(--border)] bg-[var(--muted)]/40 p-4 text-[13px] leading-relaxed">
        <code>{formula}</code>
      </pre>
    </div>
  );
}

/**
 * 全ノードの「自分の時間」を降順に並べた表。`find-bottleneck` のサイン 1 の中身。
 *
 * **`naive` を付けると、`loops` を掛けずに引き算した場合（＝素朴に読んだときの誤答）を
 * 並べて出す。** 1 回の掛け算で順位が入れ替わることを、読者が同じ画面で確認できる。
 */
export function SelfTimeTable({
  plan,
  naive = false,
  limit = 6,
  highlight,
}: {
  plan: ExplainResult;
  naive?: boolean;
  limit?: number;
  /**
   * 順位が `limit` の外でも**必ず 1 行出す**ノード。
   *
   * ★ 本文が「1 位と最下位が入れ替わった」と言うなら、**最下位も画面に出す**。
   *   旗艦では誤答側の真犯人が 10 ノード中 10 位（0.005ms）で、
   *   `limit={5}` だと入れ替わりの片側が見えなかった（06-content-review.md P1）。
   */
  highlight?: RegExp;
}) {
  const all = [...selfTimes(plan)].sort((a, b) => b.self - a.self);
  const naiveAll = naive ? [...naiveSelfTimes(plan)].sort((a, b) => b.self - a.self) : null;
  const rows = all.slice(0, limit);
  const naiveRows = naiveAll ? naiveAll.slice(0, limit) : null;

  /** `limit` から外れた注目ノードを、順位つきで拾う */
  const outlier = (list: typeof all) => {
    if (!highlight) return null;
    const i = list.findIndex((r) => highlight.test(r.label));
    return i < 0 || i < limit ? null : { row: list[i], rank: i + 1, total: list.length };
  };

  const table = (
    title: string,
    list: typeof rows,
    showLoops: boolean,
    extra: ReturnType<typeof outlier>,
  ) => (
    <div className="min-w-0">
      <div className="mb-2 text-xs font-bold text-[var(--muted-foreground)]">{title}</div>
      <table className="w-full border-collapse text-[13px]">
        <thead>
          <tr className="border-b border-[var(--border-strong)] text-left">
            <th className="py-1.5 pr-2 font-bold">ノード</th>
            <th className="py-1.5 pr-2 text-right font-bold">自分の時間</th>
            {showLoops ? <th className="py-1.5 text-right font-bold">loops</th> : null}
          </tr>
        </thead>
        <tbody>
          {list.map((r, i) => (
            <tr key={`${r.label}-${i}`} className="border-b border-[var(--border)]">
              <td className="py-1.5 pr-2 [overflow-wrap:anywhere]">
                {i === 0 ? <strong>{r.label}</strong> : r.label}
              </td>
              <td className="py-1.5 pr-2 text-right tabular-nums">
                {ms(r.self)}
                <span className="ml-1 text-[var(--muted-foreground)]">({pct(r.share)})</span>
              </td>
              {showLoops ? (
                <td className="py-1.5 text-right tabular-nums text-[var(--muted-foreground)]">
                  {r.node["Actual Loops"] ?? 1}
                </td>
              ) : null}
            </tr>
          ))}
          {extra ? (
            <>
              <tr className="border-b border-[var(--border)]">
                <td
                  colSpan={showLoops ? 3 : 2}
                  className="py-1 text-center text-[var(--muted-foreground)]"
                >
                  ⋮
                </td>
              </tr>
              <tr className="border-b border-[var(--border)]">
                <td className="py-1.5 pr-2 [overflow-wrap:anywhere]">
                  {extra.row.label}
                  <span className="ml-1 text-[var(--muted-foreground)]">
                    （{extra.rank} / {extra.total} 位）
                  </span>
                </td>
                <td className="py-1.5 pr-2 text-right tabular-nums">
                  {ms(extra.row.self)}
                  <span className="ml-1 text-[var(--muted-foreground)]">
                    ({pct(extra.row.share)})
                  </span>
                </td>
                {showLoops ? (
                  <td className="py-1.5 text-right tabular-nums text-[var(--muted-foreground)]">
                    {extra.row.node["Actual Loops"] ?? 1}
                  </td>
                ) : null}
              </tr>
            </>
          ) : null}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="not-prose my-6">
      {naiveRows && naiveAll ? (
        <div className="grid gap-6 md:grid-cols-2">
          {table("loops を掛けずに引き算した場合（誤答）", naiveRows, false, outlier(naiveAll))}
          {table("loops を掛けて引き算した場合（正しい）", rows, true, outlier(all))}
        </div>
      ) : (
        table("自分の時間が大きい順", rows, true, outlier(all))
      )}
    </div>
  );
}
