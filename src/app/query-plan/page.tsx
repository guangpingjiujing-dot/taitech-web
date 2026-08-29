import Link from "next/link";
import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { ArticleMeta } from "@/components/layout/ArticleMeta";
import { LevelBadge } from "@/components/ui/Badge";
import { MentorCTA } from "@/components/cta/MentorCTA";
import { AffiliateBooks } from "@/components/cta/AffiliateBooks";
import { FAQ } from "@/components/layout/FAQ";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { DefinitionBox } from "@/components/layout/DefinitionBox";
import { SectionHubJsonLd } from "@/components/seo/JsonLd";
import { NumberedCode, PlanBlock } from "@/components/query-plan/PlanBlock";
import { CaptureEnv, HeroQuery } from "@/components/query-plan/HeroQuery";
import { HERO_SEED_SQL } from "@/content/query-plan/sql/hero-seed";
import { sections } from "@/content/sections";
import { queryPlanTopicsInOrder } from "@/content/topics";
import heroJson from "@/content/query-plan/plans/hero-plan.json";
import type { ExplainJson } from "@/lib/query-plan/types";
import { lineOf } from "@/lib/query-plan/render";

const sectionMeta = sections["query-plan"];
const hero = (heroJson as unknown as ExplainJson)[0];

/* ★ 描画設定と行番号は必ずセットで使う。片方だけ変えると本文の行番号がずれる */
const HERO_HIDE_BUFFERS = true;
/** 本文が指す「真犯人」の行番号。手で書かず計画から引く（render.ts の lineOf を参照） */
const CULPRIT_LINE = lineOf(hero, /Index Scan using order_items_order_id_idx/, {
  hideBuffers: HERO_HIDE_BUFFERS,
});

const PAGE_TITLE =
  "実行計画（EXPLAIN）の読み方｜この計画のどこが遅いか、指せますか";
const PAGE_DESCRIPTION =
  "PostgreSQL の実行計画を、読み方の初歩から「遅い原因のノードを指せる」ところまで。木構造の読み順・cost と rows の意味・loops が 1 回あたりの平均であることを押さえたうえで、本物の 2 秒かかる計画を最後まで解き切る。実出力と再現用 SQL つき。";

const FLAGSHIP_DEFINITION =
  "実行計画とは、SQL が「何が欲しいか」しか書いていないのに対して、データベースが「どうやって取るか」を決めた手順書であり、木構造で表現される。同じ結果を返す取り方が複数あるとき、オプティマイザが統計情報をもとにコストを見積もって 1 つを選ぶ。";

export const metadata: Metadata = {
  title: { absolute: PAGE_TITLE },
  description: PAGE_DESCRIPTION,
  alternates: { canonical: sectionMeta.path },
  openGraph: {
    title: PAGE_TITLE,
    description: "本物の実行計画を最初に出す。読み終わったとき、それが読めている。",
    url: sectionMeta.path,
  },
  twitter: {
    card: "summary_large_image",
    title: PAGE_TITLE,
    description: "本物の実行計画を最初に出す。読み終わったとき、それが読めている。",
  },
};

const STAGES = [
  {
    key: "read",
    label: "読めるようになる",
    lead: "記号の意味も読む順番も分からない状態から、木を内側から読めるところまで。",
  },
  {
    key: "find",
    label: "原因を指せるようになる",
    lead: "読めるようになった人が、どのノードが遅いのかを手順で特定できるところまで。",
  },
  {
    key: "deep",
    label: "数字の出どころが分かる",
    lead: "犯人が分かった人が、なぜ DB がその数字を出したのかまで遡る。",
  },
] as const;

const faq = [
  {
    q: "実行計画はどこから読むのですか？",
    a: "上からではなく、インデントがいちばん深い行から読みます。矢印（->）が付いた行が子ノードで、親は子の結果を受け取ってから動きます。いちばん上の行が最後に実行されます。",
  },
  {
    q: "cost の単位は秒ですか？",
    a: "秒ではありません。ページを 1 枚順に読む手間を 1.0 とした相対値です。実行時間と桁を比べても意味がないので、cost どうし・時間どうしで比べます。",
  },
  {
    q: "actual time が小さいのに、そのノードが遅いことはありますか？",
    a: "あります。loops が 1 より大きいノードでは 1 回あたりの平均が表示されるので、総量に戻すには loops を掛けます。表示が 0.005ms でも 25 万回まわっていれば 1.25 秒です。",
  },
];

export default function QueryPlanHub() {
  const topics = queryPlanTopicsInOrder();

  return (
    <Container size="wide" className="py-10 md:py-14">
      <SectionHubJsonLd section="query-plan" faq={faq} flagshipDefinition={FLAGSHIP_DEFINITION} />
      <Breadcrumb
        className="mb-6"
        items={[{ href: "/", label: "ホーム" }, { label: sectionMeta.shortLabel }]}
      />

      <Eyebrow>実行計画の読み方</Eyebrow>
      <h1 className="mt-3 text-3xl md:text-4xl font-bold leading-tight">
        この実行計画の、どこが遅いか指せますか。
      </h1>

      <ArticleMeta path="/query-plan" className="mt-3" />

      <div className="prose-jp mt-8 max-w-none">
        <p>
          まず、<strong>これがそのクエリです。</strong>読めると思います。
        </p>
      </div>

      <HeroQuery />

      <div className="prose-jp max-w-none">
        <p>
          そして下が、このクエリの実行計画です。実際に
          <strong>2.16 秒かかっています。</strong>
          遅い理由はこの中に全部書いてあります。ただし
          <strong>読み方を知らないと、1 行も取り出せません。</strong>
        </p>
      </div>

      {/* 冒頭では解説しない。「読めない」ことを体験してもらう場所 */}
      <PlanBlock
        plan={hero}
        hideBuffers={HERO_HIDE_BUFFERS}
        caption="採取環境と再現用 SQL はこのページの末尾にあります。"
      />

      <div className="prose-jp max-w-none">
        <p>
          このセクションを読み終えると、<strong>この計画が読めます。</strong>
          さらに、<strong>2.16 秒のうち 1.25 秒を持っているノードがどれか</strong>を、
          自分で指せるようになります。
        </p>
        <p>
          先に答えだけ言っておくと、
          <strong>真犯人は上から {CULPRIT_LINE} 行目</strong>にいます。
          そして素朴に読むと、そのノードは
          <strong>全ノード中いちばん軽く見えます</strong>（
          <code>actual time=0.005..0.005</code> と書いてあるので）。
          なぜそう見えてしまうのかが、このセクションの中心にある話です。
        </p>

        <h2>読み方を知らないと詰まるのは、記事が想定しているより手前</h2>
        <p>
          実行計画の解説はたくさんありますが、多くは「
          <code>Seq Scan</code> は遅い」から始まります。実際に読者が詰まるのはその手前です。
        </p>
        <ul>
          <li>
            <strong>形式そのものが未知。</strong>インデントが木構造だと知らなければ、
            どこから読むのかすら分かりません（「上から順に実行される」が最頻出の誤読です）
          </li>
          <li>
            <strong>数字の単位が独特。</strong>
            <code>cost</code> は秒ではありません。<code>actual time</code> は 2 つの数字で、
            しかも <code>loops</code> があるときは 1 回あたりの平均です
          </li>
          <li>
            <strong>そもそも打ち方が分からない。</strong>
            psql を触ったことがない場合、GUI クライアントや ORM からどう出すのかで止まります
          </li>
        </ul>
        <p>
          このセクションは<strong>そこから始めます。</strong>
        </p>
      </div>

      {/* ★ 手書きの div にしない。SectionHubJsonLd が speakable で
          [data-speakable="definition"] を指すので、DefinitionBox を経由しないと
          構造化データが DOM のどこも指さない状態になる（06-content-review.md S1） */}
      <DefinitionBox className="not-prose mt-12" label="実行計画とは">
        {FLAGSHIP_DEFINITION}
      </DefinitionBox>

      <div className="mt-14">
        <h2 className="text-2xl font-bold">読めるようになるまでの地図</h2>
        <div className="mt-8 space-y-10">
          {STAGES.map((stage, si) => (
            <section key={stage.key}>
              <div className="flex items-baseline gap-3">
                <span className="text-sm font-bold text-[var(--muted-foreground)] tabular-nums">
                  STEP {si + 1}
                </span>
                <h3 className="text-lg font-bold">{stage.label}</h3>
              </div>
              <p className="mt-1 text-sm text-[var(--muted-foreground)]">{stage.lead}</p>
              <ul className="mt-4 grid gap-3 md:grid-cols-2">
                {topics
                  .filter((t) => t.stage === stage.key)
                  .map((t) => (
                    <li key={t.slug}>
                      <Link
                        href={t.path}
                        className="group block h-full border border-[var(--border)] bg-[var(--card)] p-4 hover:bg-[var(--muted)]/60 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <LevelBadge level={t.level} />
                          <span className="text-sm font-bold group-hover:underline underline-offset-4">
                            {t.shortTitle}
                          </span>
                        </div>
                        <p className="mt-2 text-[13px] leading-relaxed text-[var(--muted-foreground)]">
                          {t.summary}
                        </p>
                      </Link>
                    </li>
                  ))}
              </ul>
            </section>
          ))}
        </div>
      </div>

      <div className="prose-jp mt-14 max-w-none">
        <h2>遅いクエリを渡されたときの手順</h2>
        <p>
          結論だけ先に置いておきます。詳しい実演は
          <Link href="/query-plan/find-bottleneck">遅いノードの見つけ方</Link>にあります。
        </p>
        <ol>
          <li>
            <code>EXPLAIN (ANALYZE)</code> を打つ（
            <strong>SELECT 以外で打つと本当に更新される</strong>ので注意）
          </li>
          <li>
            各ノードの <code>actual time</code> の上端に <code>loops</code> を掛けて、
            そこから子の合計を引く。これがそのノードの<strong>自分の時間</strong>
          </li>
          <li>全ノードを自分の時間で降順に並べる</li>
          <li>
            見積り <code>rows</code> の <strong>10 倍以上</strong>の行が実際に返っているノードを探す。
            そこが根本原因の候補
          </li>
          <li>
            <code>Rows Removed by Filter</code> が大きければ、その分は読む必要のなかった行
          </li>
        </ol>
        <p>
          この手順は<strong>絶対値ではなく比率で読むように</strong>できています。
          同じクエリでも実行時間はキャッシュの状態で何倍も動くので、
          「何 ms かかったか」より「どのノードが何割を持っているか」のほうが安定するためです。
        </p>
      </div>

      <div className="prose-jp mt-14 max-w-none">
        <h2>付録: 手元で同じ計画を出す</h2>
        <p>
          このセクションが出している計画は<strong>すべて実出力</strong>です。
          題材のデータを作る SQL を全文載せておくので、同じものを手元で再現できます。
          <strong>Docker があれば 2 分で始められます。</strong>
        </p>
      </div>

      <div className="not-prose my-6">
        <pre className="overflow-x-auto border border-[var(--border)] bg-[var(--muted)]/40 p-4 text-[13px] leading-relaxed">
          <code>{`docker run -d --name qp -e POSTGRES_PASSWORD=qp -p 55432:5432 postgres:18
psql -h localhost -p 55432 -U postgres`}</code>
        </pre>
      </div>

      <details className="not-prose my-6 border border-[var(--border)] p-4">
        <summary className="cursor-pointer text-sm font-bold">
          題材のデータを作る SQL（全文・約 1 分 20 秒 / 3.5GB）
        </summary>
        <NumberedCode text={HERO_SEED_SQL} className="mt-4" />
      </details>

      <CaptureEnv className="my-6" />

      <FAQ items={faq} />
      <AffiliateBooks topicSlug="find-bottleneck" />
      <MentorCTA />
    </Container>
  );
}
