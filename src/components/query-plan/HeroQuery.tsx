import Link from "next/link";
import { NumberedCode } from "@/components/query-plan/PlanBlock";
import { CAPTURE } from "@/content/query-plan/capture";

/**
 * 旗艦の計画を出しているクエリ本体と、その採取環境。
 *
 * **なぜコンポーネントにするか**: ハブと `find-bottleneck` の 2 箇所で出すため
 * （AGENTS.md「新しいセクション追加時に UI パーツをコピペしない」）。
 * SQL 文字列を 2 箇所に持つと、採り直したときに片方だけ腐る。
 */

/** `capture/hero-seed.sql` の EXPLAIN 対象と同一。**手で書き換えない** */
export const HERO_SQL = `SELECT c.name, count(*), sum(i.price * i.qty) AS total
FROM customers c
JOIN orders o      ON o.customer_code = c.code
JOIN order_items i ON i.order_id = o.id
WHERE o.status = 'shipped'
  AND o.ordered_at >= '2026-07-01'
  AND o.channel = 'web'
  AND o.payment = 'card'
  AND i.qty = 3
GROUP BY c.name
ORDER BY total DESC
LIMIT 10;`;

/**
 * 計画の前に置く。**「読める SQL」と「読めない計画」の落差**を見せるのが役目なので、
 * 計画より先に出す（05-implementation-review.md F-3）。
 */
export function HeroQuery() {
  return (
    <div className="not-prose my-6">
      <NumberedCode text={HERO_SQL} />
      <p className="mt-2 text-xs text-[var(--muted-foreground)]">
        やっていることは「7 月以降の web / カード決済で発送済みの注文から、数量 3
        の明細を集めて、顧客ごとの売上上位 10 件」。SQL としては素直な部類。
      </p>
    </div>
  );
}

/**
 * 採取環境。**並列と JIT を切っていることを必ず書く**（00-overview.md §7）。
 * 既定設定のまま打つと `Gather` / `Parallel Seq Scan` が入り、
 * `loops` が「ワーカー間の平均」という別の意味で出て、STEP 1 の読者が最も混乱する。
 */
export function CaptureEnv({ className = "" }: { className?: string }) {
  return (
    <div className={`not-prose border border-[var(--border)] p-5 ${className}`}>
      <div className="text-xs font-bold tracking-wider uppercase text-[var(--muted-foreground)]">
        採取環境
      </div>
      <div className="mt-3 text-[14px] leading-relaxed">
        <p>
          {CAPTURE.version}（<code>postgres:18</code> 公式イメージ / 設定は既定値）。
          <strong>{CAPTURE.date} 採取。</strong>
          計画ごとにコンテナを再起動して 5 回まわし、中央値の run を載せています。
        </p>
        <p className="mt-3">
          <strong>次の 2 つだけ既定から変えています。</strong>
        </p>
      </div>
      <pre className="mt-2 overflow-x-auto bg-[var(--muted)]/40 p-3 text-[13px]">
        <code>{`SET max_parallel_workers_per_gather = 0;
SET jit = off;`}</code>
      </pre>
      <ul className="mt-3 space-y-2 text-[14px] leading-relaxed">
        <li>
          <strong>並列を切っている理由</strong> —
          既定のままだと <code>Gather</code> / <code>Parallel Seq Scan</code> が入り、
          <code>loops=2</code> が<strong>ワーカー間の平均</strong>という
          <strong>別の意味</strong>で現れます。このセクションが教える
          「<code>loops</code> は繰り返し回数」と衝突するので切っています
        </li>
        <li>
          <strong>JIT を切っている理由</strong> — 計画の末尾に JIT
          のブロックが増えるだけで、読み方の話には要らないためです
        </li>
      </ul>
      <p className="mt-3 text-[14px] leading-relaxed">
        <strong>手元で同じ計画を出すときも、この 2 行を先に打ってください。</strong>
        打たないと形が変わります。実行時間の絶対値はマシンとキャッシュの状態で
        何倍も動くので、
        <Link href="/query-plan/find-bottleneck">比率で読む</Link>のが前提です。
      </p>
    </div>
  );
}
