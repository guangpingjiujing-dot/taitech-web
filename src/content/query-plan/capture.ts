/**
 * すべての実行計画の採取条件。**採り直したらここだけ直す。**
 *
 * このセクションの一次情報性（「実測しか載せない」）は、
 * **どの版で・いつ・どんな設定で測ったか**が計画と一緒に出ていて初めて成立する。
 * `PlanBlock` の `caption` に手で書いていたときは、載っているブロックと
 * 載っていないブロックが混在していた（06-content-review.md S7）。
 * いまは `PlanBlock` が全ブロックに自動で付けるので、書き漏らしが起きない。
 */
export const CAPTURE = {
  version: "PostgreSQL 18.6",
  date: "2026-08-22",
  /** 既定から変えた設定。`CaptureEnv` が理由まで説明している */
  settings: "並列・JIT は OFF",
} as const;

/** 計画ブロックの下に必ず出る 1 行 */
export const CAPTURE_META = `${CAPTURE.version} / ${CAPTURE.date} 採取 / ${CAPTURE.settings}`;
