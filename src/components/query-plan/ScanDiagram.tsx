import { VizFrame } from "@/components/viz/VizFrame";

/**
 * 4 つのスキャン方式が「どのページを、どの順で、何回読むか」を 1 枚で見せる図。
 *
 * **なぜ図が要るか**: `scan-nodes` は 4 方式を文章だけで説明していて、
 * 「インデックスを辿ってからテーブルに行く」「位置を集めてから読む」という
 * **手順の違い**が読者の頭の中で像を結ばない（レビュー指摘）。
 * 違いはすべて**アクセスの順序と回数**なので、図が本質的に効く。
 *
 * ★ 既存の `src/components/viz/*` は SVG 内が `#0a0a0a` 固定でダークテーマに追随しない。
 *   ここは `var(--foreground)` 等の CSS 変数で描く。新規はこちらに寄せる。
 *
 * ★ モバイルでは `min-w` + 外側 `overflow-x-auto` で図だけ横スクロールさせる。
 *   `w-full` で縮めると 11px の文字が読めなくなり、
 *   E2E の「body が横スクロールしない」も外側で吸収できる。
 */

type Variant = "seq" | "index" | "index-only" | "bitmap";

const PAGES = 8;
const PX = 40; // ページ列の左端
const PW = 48; // ページの幅
const PGAP = 60; // ページの間隔
const pageX = (i: number) => PX + i * PGAP;
const pageCx = (i: number) => pageX(i) + PW / 2;

/** 該当行があるページ（0 始まり）。インデックスの 3 エントリの飛び先でもある */
const HIT_PAGES = [2, 6, 2];

const VARIANTS: Record<
  Variant,
  { title: string; height: number; note: string; legend: React.ReactNode }
> = {
  seq: {
    title: "Seq Scan — 先頭から最後まで、順に読む",
    height: 135,
    note: "読んだページ: 8 / 8（該当行が 2 ページ分でも、全部読む）",
    legend: (
      <>
        インデックスを見ないので、<strong>どのページに該当行があるか分からない</strong>。
        だから全部読んで、読んでから条件で捨てる。
        <strong>ページを順に読むので 1 ページあたりは速い。</strong>
      </>
    ),
  },
  index: {
    title: "Index Scan — 1 件見つけるたびに、そのページへ飛ぶ",
    height: 230,
    note: "読んだページ: 3 回（3 ページ目を 2 回読んでいる）",
    legend: (
      <>
        インデックスはキー順に並んでいるので、<strong>飛び先のページ順はバラバラ</strong>になる。
        同じページに何度も戻ることもある。
        <strong>該当行が増えるほど、この往復が増える。</strong>
      </>
    ),
  },
  "index-only": {
    title: "Index Only Scan — テーブルを 1 回も読まない",
    height: 230,
    note: "読んだページ: 0（必要な値がインデックスに入っている）",
    legend: (
      <>
        欲しい列が<strong>全部インデックスに入っている</strong>ときだけ選ばれる。
        テーブル本体へ行かないので、いちばん速い形。
        これを狙って作るのがカバリングインデックス。
      </>
    ),
  },
  bitmap: {
    title: "Bitmap Heap Scan — 位置を集めてから、ページ順に読む",
    height: 300,
    note: "読んだページ: 2（重複が消え、左から右へ 1 回ずつ）",
    legend: (
      <>
        飛び先をいったん<strong>ページ単位で集めてから</strong>読むので、
        往復と重複が消える。<strong>減っているのは往復の回数</strong>で、
        該当行がテーブル全体に散らばっていれば<strong>読むページ数自体は減らない</strong>。
      </>
    ),
  },
};

function PageRow({ y, read, hits }: { y: number; read: number[]; hits: number[] }) {
  return (
    <g>
      <text x={PX} y={y - 10} fontSize="11" fill="var(--muted-foreground)">
        テーブル（8 ページ）
      </text>
      {Array.from({ length: PAGES }, (_, i) => {
        const isRead = read.includes(i);
        const isHit = hits.includes(i);
        return (
          <g key={i}>
            <rect
              x={pageX(i)}
              y={y}
              width={PW}
              height={40}
              fill={isRead ? "var(--primary-soft)" : "var(--card)"}
              stroke={isRead ? "var(--foreground)" : "var(--border)"}
              strokeWidth={isRead ? 1.6 : 1}
            />
            <text
              x={pageCx(i)}
              y={y + 25}
              textAnchor="middle"
              fontSize="12"
              fontFamily="monospace"
              fill={isRead ? "var(--foreground)" : "var(--muted-foreground)"}
            >
              {i + 1}
            </text>
            {isHit ? (
              <circle cx={pageCx(i)} cy={y + 34} r="3" fill="var(--foreground)" />
            ) : null}
          </g>
        );
      })}
    </g>
  );
}

/** インデックスの箱。3 エントリがキー順に並んでいる */
function IndexBox({ y, withValue }: { y: number; withValue?: boolean }) {
  const w = 280;
  const cell = w / 3;
  return (
    <g>
      <text x={PX} y={y - 10} fontSize="11" fill="var(--muted-foreground)">
        インデックス（キー順に並んでいる）
      </text>
      <rect
        x={PX}
        y={y}
        width={w}
        height={40}
        fill="var(--card)"
        stroke="var(--foreground)"
        strokeWidth="1.6"
      />
      {[0, 1, 2].map((i) => (
        <g key={i}>
          {i > 0 ? (
            <line
              x1={PX + cell * i}
              y1={y}
              x2={PX + cell * i}
              y2={y + 40}
              stroke="var(--border)"
            />
          ) : null}
          <text
            x={PX + cell * (i + 0.5)}
            y={y + (withValue ? 18 : 25)}
            textAnchor="middle"
            fontSize="12"
            fontFamily="monospace"
            fill="var(--foreground)"
          >
            {["k=12", "k=34", "k=56"][i]}
          </text>
          {withValue ? (
            <text
              x={PX + cell * (i + 0.5)}
              y={y + 32}
              textAnchor="middle"
              fontSize="11"
              fontFamily="monospace"
              fill="var(--muted-foreground)"
            >
              {["+ 東京", "+ 大阪", "+ 福岡"][i]}
            </text>
          ) : null}
        </g>
      ))}
    </g>
  );
}

function Arrow({
  x1,
  y1,
  x2,
  y2,
  label,
  dim,
}: {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  /** ★ 矢印の**始点側**に置く。中点に置くと、交差する矢印どうしでラベルが入れ替わって見える */
  label?: string;
  dim?: boolean;
}) {
  const stroke = dim ? "var(--border-strong)" : "var(--foreground)";
  return (
    <g>
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={stroke} strokeWidth="1.4" />
      <polygon
        points={`${x2},${y2} ${x2 - 4},${y2 - 8} ${x2 + 4},${y2 - 8}`}
        fill={stroke}
        transform={`rotate(${(Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI - 90} ${x2} ${y2})`}
      />
      {label ? (
        <>
          <rect x={x1 - 20} y={y1 + 3} width={40} height={14} fill="var(--card)" />
          <text x={x1} y={y1 + 14} textAnchor="middle" fontSize="10" fill="var(--muted-foreground)">
            {label}
          </text>
        </>
      ) : null}
    </g>
  );
}

/**
 * 矢印が背後を通る位置に置くステップ見出し。
 * **下に地の色を敷く**ことで、線と重なっても読める（レビュー指摘）。
 */
function StepLabel({ x, y, width, children }: { x: number; y: number; width: number; children: string }) {
  return (
    <g>
      <rect x={x - 3} y={y - 11} width={width} height={15} fill="var(--card)" />
      <text x={x} y={y} fontSize="11" fill="var(--muted-foreground)">
        {children}
      </text>
    </g>
  );
}

const indexCellCx = (i: number) => PX + (280 / 3) * (i + 0.5);

export function ScanDiagram({ variant }: { variant: Variant }) {
  const v = VARIANTS[variant];

  return (
    <VizFrame title={v.title} legend={v.legend}>
      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 560 ${v.height}`}
          className="h-auto w-full min-w-[520px]"
          role="img"
          aria-label={`${v.title}。${v.note}`}
        >
          {variant === "seq" ? (
            <>
              <PageRow y={30} read={[0, 1, 2, 3, 4, 5, 6, 7]} hits={HIT_PAGES} />
              <line
                x1={PX}
                y1={95}
                x2={pageX(7) + PW}
                y2={95}
                stroke="var(--foreground)"
                strokeWidth="1.4"
              />
              <polygon
                points={`${pageX(7) + PW},95 ${pageX(7) + PW - 8},91 ${pageX(7) + PW - 8},99`}
                fill="var(--foreground)"
              />
              <text x={PX} y={118} fontSize="11" fill="var(--muted-foreground)">
                左から右へ、1 回のまとまった読み取り
              </text>
            </>
          ) : null}

          {variant === "index" ? (
            <>
              <IndexBox y={30} />
              {HIT_PAGES.map((p, i) => (
                <Arrow
                  key={i}
                  x1={indexCellCx(i)}
                  y1={72}
                  x2={pageCx(p)}
                  y2={148}
                  label={`${i + 1} 回目`}
                />
              ))}
              <PageRow y={150} read={[2, 6]} hits={HIT_PAGES} />
              <text x={PX} y={215} fontSize="11" fill="var(--muted-foreground)">
                3 ページ目 → 7 ページ目 → 3 ページ目。行ったり来たりしている
              </text>
            </>
          ) : null}

          {variant === "index-only" ? (
            <>
              <IndexBox y={30} withValue />
              <text
                x={PX + 300}
                y={56}
                fontSize="12"
                fill="var(--foreground)"
                fontWeight="700"
              >
                値まで入っている
              </text>
              <line
                x1={PX + 140}
                y1={78}
                x2={PX + 140}
                y2={140}
                stroke="var(--border-strong)"
                strokeWidth="1.4"
                strokeDasharray="5 4"
              />
              <g stroke="var(--foreground)" strokeWidth="2">
                <line x1={PX + 130} y1={100} x2={PX + 150} y2={120} />
                <line x1={PX + 150} y1={100} x2={PX + 130} y2={120} />
              </g>
              <text x={PX + 160} y={115} fontSize="12" fill="var(--foreground)">
                テーブルへは行かない
              </text>
              <PageRow y={150} read={[]} hits={HIT_PAGES} />
              <text x={PX} y={215} fontSize="11" fill="var(--muted-foreground)">
                Heap Fetches: 0 が「1 回も触っていない」印
              </text>
            </>
          ) : null}

          {variant === "bitmap" ? (
            <>
              <IndexBox y={30} />
              {HIT_PAGES.map((p, i) => (
                <Arrow
                  key={i}
                  x1={indexCellCx(i)}
                  y1={72}
                  x2={pageCx(p)}
                  y2={118}
                  dim
                />
              ))}
              <StepLabel x={PX} y={104} width={200}>
                1. 該当ページを集める（ビットマップ）
              </StepLabel>
              {Array.from({ length: PAGES }, (_, i) => {
                const on = HIT_PAGES.includes(i);
                return (
                  <g key={i}>
                    <rect
                      x={pageX(i)}
                      y={120}
                      width={PW}
                      height={26}
                      fill={on ? "var(--foreground)" : "var(--card)"}
                      stroke={on ? "var(--foreground)" : "var(--border)"}
                    />
                    <text
                      x={pageCx(i)}
                      y={138}
                      textAnchor="middle"
                      fontSize="12"
                      fontFamily="monospace"
                      fill={on ? "var(--primary-foreground)" : "var(--muted-foreground)"}
                    >
                      {on ? "1" : "0"}
                    </text>
                  </g>
                );
              })}
              <StepLabel x={PX} y={172} width={266}>
                2. 立っているページだけを、左から右へ 1 回ずつ読む
              </StepLabel>
              {[2, 6].map((p) => (
                <Arrow key={p} x1={pageCx(p)} y1={148} x2={pageCx(p)} y2={218} />
              ))}
              <PageRow y={220} read={[2, 6]} hits={HIT_PAGES} />
              <text x={PX} y={285} fontSize="11" fill="var(--muted-foreground)">
                同じページへ 2 回行っていたのが 1 回になった
              </text>
            </>
          ) : null}
        </svg>
      </div>
      <p className="mt-3 text-xs text-[var(--muted-foreground)]">
        <span aria-hidden>●</span> が条件に合う行。{v.note}
      </p>
    </VizFrame>
  );
}
