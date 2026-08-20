"use client";

import { useState } from "react";
import { VizFrame } from "@/components/viz/VizFrame";
import { RaceLanes, type RaceStep } from "./RaceDiagram";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import {
  ISOLATION_LEVELS,
  isolationScenarios,
  occursAtLevel,
  type IsolationLevel,
  type IsolationScenario,
  type StockRow,
} from "./isolation-scenarios";

/**
 * トランザクション分離レベルのステップ実行ビジュアライザ。
 *
 * **自動再生はしない** (`FullScanViz` は useEffect で自動送りしているが、ここは手動のみ)。
 * 操作モデルは `HashViz` と同じで、`step` を -1 から始めて `stepOnce()` で 1 つずつ進める。
 *
 * 見せたいのは「T1 に見えているもの」と「確定済みのデータ」のズレなので、
 * この 2 つを必ず並べて出す。分離レベルを変えると **同じ操作列のまま見え方だけが変わる**。
 */
export function IsolationLevelViz() {
  const [scenarioKey, setScenarioKey] = useState(isolationScenarios[0].key);
  const [level, setLevel] = useState<IsolationLevel>("READ UNCOMMITTED");
  const [step, setStep] = useState(-1);

  const scenario =
    isolationScenarios.find((s) => s.key === scenarioKey) ??
    isolationScenarios[0];
  const lastIndex = scenario.steps.length - 1;
  const canAdvance = step < lastIndex;
  const occurs = occursAtLevel(scenario, level);

  const switchScenario = (key: IsolationScenario["key"]) => {
    setScenarioKey(key);
    setStep(-1);
  };

  const switchLevel = (next: IsolationLevel) => {
    setLevel(next);
    setStep(-1);
  };

  const current = step >= 0 ? scenario.steps[step] : null;
  const committed = current ? current.committed : scenario.initial;

  // 直近の観測ステップ (到達済みのもの) を探す。到達後は結果を出したままにする。
  const observedStep = scenario.steps
    .slice(0, step + 1)
    .reverse()
    .find((s) => s.observe);
  const observed = observedStep?.observe;

  const lanes: RaceStep[] = scenario.steps
    .slice(0, step + 1)
    .map((s, i) => ({
      time: i,
      actor: s.actor,
      action: s.label,
      value: s.sql,
      isProblem: Boolean(s.observe) && occurs,
    }));

  return (
    <VizFrame
      title="分離レベル別 ステップ実行"
      controls={
        <div className="flex flex-col gap-3">
          <Selector
            label="異常"
            options={isolationScenarios.map((s) => ({
              key: s.key,
              label: s.label,
            }))}
            active={scenarioKey}
            onSelect={(k) => switchScenario(k as IsolationScenario["key"])}
          />
          <Selector
            label="分離レベル"
            options={ISOLATION_LEVELS.map((l) => ({ key: l, label: l }))}
            active={level}
            onSelect={(k) => switchLevel(k as IsolationLevel)}
            mono
          />
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={() => setStep(step + 1)} disabled={!canAdvance}>
              次のステップ
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setStep(-1)}
              disabled={step === -1}
            >
              最初から
            </Button>
            <span className="font-mono text-xs text-[var(--muted-foreground)]">
              {step + 1} / {scenario.steps.length}
            </span>
          </div>
        </div>
      }
      legend={
        <>
          <strong>{scenario.anomaly}</strong> — {scenario.summary}{" "}
          SQL 標準の定義では <strong>{scenario.occursAt.join(" / ")}</strong> で起こりうる。
          実際の DBMS はこれより強く防ぐことがある (本文の「標準と実装は違う」を参照)。
        </>
      }
    >
      {step === -1 ? (
        <p className="text-sm text-[var(--muted-foreground)]">
          「次のステップ」を押すと、T1 と T2 の操作が 1 つずつ進む。
          分離レベルを切り替えると、<strong>同じ操作列のまま T1 の見え方だけが変わる</strong>。
        </p>
      ) : (
        <RaceLanes actors={["T1 (自分)", "T2 (他人)"]} steps={lanes} />
      )}

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <TablePane
          title="T1 から見えているもの"
          rows={observed ? (occurs ? observed.anomaly : observed.prevented) : null}
          placeholder="まだ読んでいない"
          highlight={Boolean(observed) && occurs}
        />
        <TablePane title="確定済みのデータ" rows={committed} />
      </div>

      {observed && (
        <div
          className={cn(
            "mt-4 border-l-2 px-3 py-2 text-sm",
            occurs
              ? "border-[var(--wrong)] bg-[var(--wrong-soft)]"
              : "border-[var(--correct)] bg-[var(--correct-soft)]",
          )}
        >
          <div className="font-bold">
            {occurs
              ? `${scenario.anomaly} が起きた`
              : `${scenario.anomaly} は起きない`}
          </div>
          <p className="mt-1">
            {occurs ? observed.anomalyNote : observed.preventedNote}
          </p>
        </div>
      )}
    </VizFrame>
  );
}

function Selector({
  label,
  options,
  active,
  onSelect,
  mono,
}: {
  label: string;
  options: { key: string; label: string }[];
  active: string;
  onSelect: (key: string) => void;
  mono?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted-foreground)]">
        {label}
      </span>
      {options.map((o) => (
        <button
          key={o.key}
          type="button"
          onClick={() => onSelect(o.key)}
          aria-pressed={active === o.key}
          className={cn(
            "cursor-pointer border px-2 py-1 text-xs transition-colors",
            mono && "font-mono text-[10px]",
            active === o.key
              ? "border-[var(--foreground)] bg-[var(--foreground)] text-[var(--primary-foreground)]"
              : "border-[var(--border-strong)] bg-[var(--card)] text-[var(--foreground)] hover:bg-[var(--muted)]",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function TablePane({
  title,
  rows,
  placeholder,
  highlight,
}: {
  title: string;
  rows: StockRow[] | null;
  placeholder?: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        "border",
        highlight
          ? "border-[var(--wrong)]"
          : "border-[var(--border-strong)]",
      )}
    >
      <div className="border-b border-[var(--border)] bg-[var(--muted)] px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-[var(--muted-foreground)]">
        {title}
      </div>
      {rows === null ? (
        <p className="px-3 py-4 text-xs text-[var(--muted-foreground)]">
          {placeholder}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="border-b border-[var(--border)]">
                <Th>id</Th>
                <Th>item</Th>
                <Th>qty</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-[var(--border)] last:border-0">
                  <Td>{r.id}</Td>
                  <Td>{r.item}</Td>
                  <Td>{r.qty}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-3 py-1.5 text-left font-mono text-[10px] font-bold text-[var(--muted-foreground)]">
      {children}
    </th>
  );
}

function Td({ children }: { children: React.ReactNode }) {
  return <td className="px-3 py-1.5 font-mono">{children}</td>;
}
