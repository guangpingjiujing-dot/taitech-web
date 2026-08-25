import { VizFrame } from "@/components/viz/VizFrame";

/**
 * 3 つの結合方式が「どちらを何回読むか」を 1 枚で見せる図。
 *
 * **なぜ図が要るか**: `join-nodes` は 3 方式を文章だけで説明していて、
 * `loops` が付く理由（＝外側の行数だけ内側を引き直す）が像を結ばない（レビュー指摘）。
 * `Nested Loop` の事故はこの図の「矢印の本数」がそのまま `loops` になる、が分かれば腑に落ちる。
 *
 * 描き方の方針は `ScanDiagram.tsx` と同じ（CSS 変数で描く / モバイルは横スクロール）。
 */

type Variant = "nested-loop" | "hash" | "merge";

const OUTER = ["A-1", "A-2", "A-3"];
const INNER = ["B-1", "B-2", "B-3", "B-4"];

const ROW_H = 30;
const ROW_W = 86;
const LX = 30; // 外側の列
const RX = 400; // 内側の列

const rowY = (i: number, top: number) => top + i * ROW_H;

function Rows({
  items,
  x,
  top,
  label,
  emphasis,
}: {
  items: string[];
  x: number;
  top: number;
  label: string;
  emphasis?: number[];
}) {
  return (
    <g>
      <text x={x} y={top - 10} fontSize="11" fill="var(--muted-foreground)">
        {label}
      </text>
      {items.map((t, i) => {
        const on = emphasis?.includes(i);
        return (
          <g key={t}>
            <rect
              x={x}
              y={rowY(i, top)}
              width={ROW_W}
              height={ROW_H - 6}
              fill={on ? "var(--primary-soft)" : "var(--card)"}
              stroke={on ? "var(--foreground)" : "var(--border)"}
              strokeWidth={on ? 1.6 : 1}
            />
            <text
              x={x + ROW_W / 2}
              y={rowY(i, top) + 16}
              textAnchor="middle"
              fontSize="12"
              fontFamily="monospace"
              fill="var(--foreground)"
            >
              {t}
            </text>
          </g>
        );
      })}
    </g>
  );
}

function Arrow({
  x1,
  y1,
  x2,
  y2,
  label,
}: {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  label?: string;
}) {
  const a = (Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI - 90;
  return (
    <g>
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="var(--foreground)" strokeWidth="1.3" />
      <polygon
        points={`${x2},${y2} ${x2 - 4},${y2 - 8} ${x2 + 4},${y2 - 8}`}
        fill="var(--foreground)"
        transform={`rotate(${a} ${x2} ${y2})`}
      />
      {label ? (
        <text
          x={(x1 + x2) / 2}
          y={(y1 + y2) / 2 - 5}
          textAnchor="middle"
          fontSize="10"
          fill="var(--muted-foreground)"
        >
          {label}
        </text>
      ) : null}
    </g>
  );
}

const VARIANTS: Record<
  Variant,
  { title: string; height: number; note: string; legend: React.ReactNode }
> = {
  "nested-loop": {
    title: "Nested Loop — 外側 1 行につき、内側を 1 回引き直す",
    height: 192,
    note: "矢印の本数 = 内側を引いた回数 = loops。1 回で何行返るかは別の話",
    legend: (
      <>
        <strong>矢印の本数がそのまま <code>loops</code>。</strong>
        外側が 3 行なら 3 回、25 万行なら 25 万回。
        <strong>外側の見積りが外れると、この本数がまるごと外れる</strong>ので事故になる。
        <strong>3 本とも同じ入口に入る</strong>のが Nested Loop の特徴で、
        内側を<strong>毎回引き直している</strong>（Merge Join のように前へ進むのではない）。
        内側にインデックスがあって、外側が少ないときだけ安い。
        図は仕組みの模式で、実際の回数は計画の <code>loops</code> に出る。
      </>
    ),
  },
  hash: {
    title: "Hash Join — 先に片側でハッシュ表を作り、もう片側を流す",
    height: 225,
    note: "内側は 1 回だけ読む。外側も 1 回だけ流す（各 1 パス）",
    legend: (
      <>
        <strong>内側を全部読み終わるまで 1 行も返せない</strong>ので、開始が遅い。
        そのかわり内側を読み直さないので、
        <strong>両側とも行数が多いときに強い</strong>。
        ハッシュ表がメモリに乗らないと分割され、<code>Batches</code> が 2 以上になる。
      </>
    ),
  },
  merge: {
    title: "Merge Join — 両側を前から突き合わせて、一緒に進む",
    height: 200,
    note: "両側とも 1 回ずつ、前から順に読むだけ",
    legend: (
      <>
        <strong>両側がキー順に並んでいることが前提。</strong>
        並んでいれば読み直しも突き合わせ表も要らない。
        インデックスを順に辿れば並んだ状態で取れるので、そのときに選ばれやすい。
        <strong>並べ直しが必要なら、その費用が上乗せされる。</strong>
      </>
    ),
  },
};

export function JoinDiagram({ variant }: { variant: Variant }) {
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
          {variant === "nested-loop" ? (
            <>
              {/*
               * ★ 矢印を「外側の i 行目 → 内側の i 行目」で結んではいけない。
               *   1 対 1 のマッチに見えて Merge Join の絵と区別が付かなくなるうえ、
               *   このページが真下に出している計画（外側 1 行に内側 4 行）とも食い違う。
               *   Nested Loop の本質は**毎回同じ入口を引き直す**ことなので、
               *   3 本の矢印を 1 つの箱に収束させる。
               */}
              <Rows items={OUTER} x={LX} top={40} label="外側（1 行ずつ取り出す）" />
              {OUTER.map((_, i) => (
                <path
                  key={i}
                  d={`M ${LX + ROW_W + 4} ${rowY(i, 40) + 12} H 150 V 92 H 244`}
                  fill="none"
                  stroke="var(--foreground)"
                  strokeWidth="1.3"
                />
              ))}
              <polygon points="252,92 244,88 244,96" fill="var(--foreground)" />
              {OUTER.map((t, i) => (
                <text
                  key={t}
                  x={158}
                  y={rowY(i, 40) + 8}
                  fontSize="10"
                  fill="var(--muted-foreground)"
                >
                  {`${i + 1} 回目: ${t} で検索`}
                </text>
              ))}

              {/* 内側は「行の列」ではなく 1 つの入口。ここへ毎回戻る */}
              <text x={254} y={44} fontSize="11" fill="var(--muted-foreground)">
                内側 — 毎回ここを引き直す
              </text>
              <rect
                x={254}
                y={54}
                width={168}
                height={76}
                fill="var(--card)"
                stroke="var(--foreground)"
                strokeWidth="1.6"
              />
              <text
                x={338}
                y={80}
                textAnchor="middle"
                fontSize="12"
                fontFamily="monospace"
                fontWeight="700"
                fill="var(--foreground)"
              >
                インデックス
              </text>
              <line x1={254} y1={92} x2={422} y2={92} stroke="var(--border)" />
              <text
                x={338}
                y={114}
                textAnchor="middle"
                fontSize="12"
                fontFamily="monospace"
                fill="var(--muted-foreground)"
              >
                内側テーブル
              </text>

              <Arrow x1={426} y1={92} x2={456} y2={92} />
              <text x={462} y={60} fontSize="11" fill="var(--muted-foreground)">
                1 回で返る行
              </text>
              {[0, 1].map((i) => (
                <rect
                  key={i}
                  x={462}
                  y={70 + i * 24}
                  width={80}
                  height={18}
                  fill="var(--primary-soft)"
                  stroke="var(--foreground)"
                  strokeWidth="1"
                />
              ))}
              <text x={462} y={136} fontSize="10" fill="var(--muted-foreground)">
                0 行のことも
              </text>
              <text x={462} y={149} fontSize="10" fill="var(--muted-foreground)">
                複数行のことも
              </text>

              <text x={LX} y={178} fontSize="11" fill="var(--muted-foreground)">
                内側は毎回はじめから検索し直す。前回の続きからにはならない
              </text>
            </>
          ) : null}

          {variant === "hash" ? (
            <>
              <Rows items={INNER} x={LX} top={40} label="1. 内側を全部読む" />
              <Arrow x1={LX + ROW_W + 4} y1={95} x2={210} y2={95} label="ハッシュ表を作る" />
              <rect
                x={220}
                y={40}
                width={120}
                height={110}
                fill="var(--card)"
                stroke="var(--foreground)"
                strokeWidth="1.6"
              />
              <text x={280} y={58} textAnchor="middle" fontSize="11" fill="var(--muted-foreground)">
                ハッシュ表
              </text>
              {INNER.map((t, i) => (
                <text
                  key={t}
                  x={280}
                  y={78 + i * 18}
                  textAnchor="middle"
                  fontSize="11"
                  fontFamily="monospace"
                  fill="var(--foreground)"
                >
                  {`bucket${i} → ${t}`}
                </text>
              ))}
              <Rows items={OUTER} x={RX} top={40} label="2. 外側を 1 行ずつ流す" />
              {OUTER.map((_, i) => (
                <Arrow
                  key={i}
                  x1={RX - 6}
                  y1={rowY(i, 40) + 12}
                  x2={346}
                  y2={rowY(i, 40) + 12}
                />
              ))}
              <text x={LX} y={190} fontSize="11" fill="var(--muted-foreground)">
                内側は 1 回読むだけ。外側の行数が増えても読み直さない
              </text>
              <text x={LX} y={210} fontSize="11" fill="var(--muted-foreground)">
                ただし表ができるまで 1 行も返せない（開始が遅い）
              </text>
            </>
          ) : null}

          {variant === "merge" ? (
            <>
              <Rows items={["10", "20", "30"]} x={LX} top={40} label="左（キー順に並んでいる）" />
              <Rows items={["10", "20", "30", "40"]} x={RX} top={40} label="右（キー順に並んでいる）" />
              {[0, 1, 2].map((i) => (
                <g key={i}>
                  <line
                    x1={LX + ROW_W + 4}
                    y1={rowY(i, 40) + 12}
                    x2={RX - 6}
                    y2={rowY(i, 40) + 12}
                    stroke="var(--foreground)"
                    strokeWidth="1.3"
                  />
                  <text
                    x={(LX + ROW_W + RX) / 2}
                    y={rowY(i, 40) + 8}
                    textAnchor="middle"
                    fontSize="10"
                    fill="var(--muted-foreground)"
                  >
                    一致
                  </text>
                </g>
              ))}
              {/* ★ 進行方向の矢印は行の「外側」に出す。中央を通すと数字に重なって読めない */}
              <Arrow x1={LX - 14} y1={40} x2={LX - 14} y2={132} />
              <Arrow x1={RX + ROW_W + 14} y1={40} x2={RX + ROW_W + 14} y2={162} />
              <text x={LX} y={185} fontSize="11" fill="var(--muted-foreground)">
                2 つの位置が前へ進むだけ。戻らないし、表も作らない
              </text>
            </>
          ) : null}
        </svg>
      </div>
      <p className="mt-3 text-xs text-[var(--muted-foreground)]">{v.note}</p>
    </VizFrame>
  );
}
