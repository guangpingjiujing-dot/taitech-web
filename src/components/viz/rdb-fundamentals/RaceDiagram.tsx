import { VizFrame } from "@/components/viz/VizFrame";
import { cn } from "@/lib/utils";

export type RaceStep = {
  /** 相対時間 (絶対値ではなく順序のためのソート key) */
  time: number;
  /** どのアクター (index into actors 配列) の操作か */
  actor: number;
  /** 操作の表示テキスト */
  action: string;
  /** true なら問題発生地点として強調 */
  isProblem?: boolean;
  /** 補足の値表示 (例: "在庫=1", "在庫=0") */
  value?: string;
};

export type RaceDiagramProps = {
  title: string;
  actors: string[];
  steps: RaceStep[];
  outcome: string;
  legend?: React.ReactNode;
};

/**
 * 「2 人 (or N 人) が同時に操作した結果」の時系列を可視化する。
 * 縦軸が時間、横軸がアクター (レーン)。各ステップは対応するレーンにボックスとして描画。
 * atomicity / concurrency ページで使う。
 */
export function RaceDiagram({
  title,
  actors,
  steps,
  outcome,
  legend,
}: RaceDiagramProps) {
  const sorted = [...steps].sort((a, b) => a.time - b.time);

  return (
    <VizFrame title={title} legend={legend}>
      <div className="overflow-x-auto">
        <div
          className="grid gap-2"
          style={{
            gridTemplateColumns: `4rem repeat(${actors.length}, minmax(10rem, 1fr))`,
          }}
        >
          {/* Header row */}
          <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted-foreground)]">
            時間
          </div>
          {actors.map((a, i) => (
            <div
              key={i}
              className="border-b-2 border-[var(--foreground)] pb-1 text-center text-xs font-bold text-[var(--foreground)]"
            >
              {a}
            </div>
          ))}

          {/* Rows */}
          {sorted.map((s, i) => (
            <StepRow
              key={i}
              step={s}
              actorCount={actors.length}
              index={i + 1}
            />
          ))}
        </div>
      </div>

      <div className="mt-4 border-t border-[var(--border)] pt-3">
        <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted-foreground)]">
          結末
        </div>
        <div className="mt-1 text-sm font-bold text-[var(--wrong)]">
          {outcome}
        </div>
      </div>
    </VizFrame>
  );
}

function StepRow({
  step,
  actorCount,
  index,
}: {
  step: RaceStep;
  actorCount: number;
  index: number;
}) {
  return (
    <>
      <div className="pt-2 font-mono text-xs text-[var(--muted-foreground)]">
        t{index}
      </div>
      {Array.from({ length: actorCount }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "min-h-[2.5rem] border px-3 py-2 text-xs",
            step.actor === i
              ? step.isProblem
                ? "border-[var(--wrong)] bg-[var(--wrong-soft)] text-[var(--foreground)]"
                : "border-[var(--border-strong)] bg-[var(--card)] text-[var(--foreground)]"
              : "border-dashed border-[var(--border)] bg-transparent",
          )}
        >
          {step.actor === i && (
            <>
              <div className="font-bold">{step.action}</div>
              {step.value && (
                <div className="mt-0.5 font-mono text-[10px] text-[var(--muted-foreground)]">
                  {step.value}
                </div>
              )}
            </>
          )}
        </div>
      ))}
    </>
  );
}
