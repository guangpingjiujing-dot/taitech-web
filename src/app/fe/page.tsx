import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { AffiliateBooks } from "@/components/cta/AffiliateBooks";
import { FeSidebar } from "@/components/fe/FeSidebar";
import { FAQ } from "@/components/layout/FAQ";
import { FeHubJsonLd } from "@/components/seo/JsonLd";
import { sections } from "@/content/sections";
import { feLessons } from "@/content/fe/lessons";
import { feQuizzes } from "@/content/fe/quiz";

const sectionMeta = sections.fe;

const PAGE_TITLE = sectionMeta.metaTitle ?? sectionMeta.label;
const PAGE_DESCRIPTION = sectionMeta.metaDescription ?? sectionMeta.description;

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  alternates: { canonical: sectionMeta.path },
  openGraph: {
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    url: sectionMeta.path,
  },
  twitter: {
    card: "summary_large_image",
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
  },
};

/**
 * ハブに並べるツール。**SQL 実行シミュレーター (/fe/sql) を足すときはここに 1 件追加する**
 * (docs/wip/20260815-fe-sql/00-overview.md §5-3)。JSON-LD の hasPart もこの配列から組む。
 */
const TOOLS = [
  {
    key: "algorithm",
    path: "/fe/algorithm",
    eyebrow: "科目 B",
    name: "擬似言語 実行シミュレーター",
    description:
      "科目 B のアルゴリズム問題で使われる擬似言語を、その場で書いて実行できる。一行ずつ進めて変数の変化と出力を目で追える。",
    bullets: [
      "一行ずつ実行して変数の変化を可視化",
      `構文別レッスン ${feLessons.length} 本 (変数 / if / while / for / 配列 / 関数)`,
      `オリジナル練習問題 ${feQuizzes.length} 問 (解説つき)`,
      "Python / TypeScript に変換して読み比べ",
    ],
    links: [
      { href: "/fe/algorithm/lessons", label: "構文別レッスン" },
      { href: "/fe/algorithm/quiz", label: "練習問題を解く" },
      { href: "/fe/algorithm/transpile", label: "多言語横並び比較" },
    ],
  },
  {
    key: "sql",
    path: "/fe/sql",
    eyebrow: "科目 A",
    name: "SQL 実行シミュレーター",
    description:
      "データベース分野の SQL をその場で実行できる。FROM → WHERE → GROUP BY → HAVING → SELECT の評価順に、それぞれの時点の表を 1 つずつ見られる。",
    bullets: [
      "評価順に中間の表を 1 段階ずつ表示",
      "WHERE と HAVING の違いをグループ単位で確認",
      "INSERT / UPDATE / DELETE は実行前後の差分で表示",
      "制約違反はどの行が引っかかったかを表上で明示",
    ],
    links: [
      { href: "/fe/sql/lessons", label: "SQL レッスン" },
      { href: "/fe/sql/quiz", label: "SQL 練習問題を解く" },
    ],
  },
] as const;

const FAQ_ITEMS = [
  {
    q: "このページのツールは無料ですか？",
    a: "はい。すべて無料で、会員登録も不要です。コードの解析・実行・変換はすべてブラウザ内で完結し、サーバには送信されません。",
  },
  {
    q: "基本情報技術者試験の科目 A と科目 B は何が違いますか？",
    a: "科目 A は 90 分・60 問の四肢択一で、テクノロジ系・マネジメント系・ストラテジ系を幅広く問います。科目 B は 100 分・20 問で、アルゴリズムとプログラミング (約 8 割) と情報セキュリティ (約 2 割) に絞られます。擬似言語が出るのは科目 B です。",
  },
  {
    q: "合格には何割とればよいですか？",
    a: "科目 A・科目 B とも 1,000 点満点で 600 点以上が合格基準です。ただし採点は IRT (項目応答理論) 方式なので、単純に 6 割正答すれば合格というわけではありません。",
  },
  {
    q: "いつ受験できますか？",
    a: "CBT 方式による通年実施です。試験会場の空き枠を予約する形なので、自分の準備状況に合わせて受験日を決められます。",
  },
];

export default function FeHubPage() {
  return (
    <div className="py-8 lg:py-12">
      <FeHubJsonLd
        path={sectionMeta.path}
        name={sectionMeta.label}
        description={PAGE_DESCRIPTION}
        tools={TOOLS.map((t) => ({
          name: t.name,
          path: t.path,
          description: t.description,
        }))}
        faq={FAQ_ITEMS}
      />
      <Container size="wide">
        <div className="grid gap-8 xl:gap-10 xl:grid-cols-[minmax(0,1fr)_15rem]">
          <div className="min-w-0">
            <header className="mb-10 max-w-3xl">
              <Eyebrow>基本情報技術者試験</Eyebrow>
              <h1 className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-[var(--foreground)]">
                基本情報技術者試験を、動かして対策する
              </h1>
              <div
                className="mt-3 text-sm sm:text-base text-[var(--muted-foreground)] leading-relaxed space-y-2"
                style={{ textWrap: "pretty" }}
              >
                <p>
                  紙の上で追うだけでは掴みにくい「動き」を、ブラウザ上で実際に動かして確かめられる学習ツールを置いています。
                </p>
                <p>すべて無料・登録不要で、処理はブラウザ内で完結します。</p>
              </div>
            </header>

            <section>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
                ツール
              </h2>
              <div className="mt-6 grid gap-6 md:grid-cols-2">
                {TOOLS.map((t) => (
                  <article
                    key={t.key}
                    /* min-w-0 が無いと grid item の min-content が本文の全長になり
                       (globals.css の word-break: keep-all)、モバイルで横に溢れる */
                    className="flex min-w-0 flex-col border border-[var(--border)] p-6 md:p-8"
                  >
                    <Eyebrow size="compact" as="div">
                      {t.eyebrow}
                    </Eyebrow>
                    <h3 className="mt-2 text-xl font-bold tracking-tight [overflow-wrap:anywhere]">
                      {t.name}
                    </h3>
                    <p
                      className="mt-3 text-sm text-[var(--muted-foreground)] leading-relaxed [overflow-wrap:anywhere]"
                      style={{ textWrap: "pretty" }}
                    >
                      {t.description}
                    </p>
                    <ul className="mt-5 space-y-1.5 text-sm">
                      {t.bullets.map((b) => (
                        <li key={b} className="flex gap-2">
                          <span className="text-[var(--muted-foreground)]">
                            —
                          </span>
                          <span className="min-w-0 [overflow-wrap:anywhere]">
                            {b}
                          </span>
                        </li>
                      ))}
                    </ul>
                    <div className="mt-6 flex-1" />
                    <Link
                      href={t.path}
                      className="mt-6 inline-flex items-center gap-2 bg-[var(--foreground)] text-white px-5 py-2.5 text-sm font-bold hover:bg-[#262626] self-start"
                    >
                      このツールを開く →
                    </Link>
                    <ul className="mt-5 space-y-1 text-sm text-[var(--muted-foreground)]">
                      {t.links.map((l) => (
                        <li key={l.href}>
                          <Link
                            href={l.href}
                            className="hover:text-[var(--foreground)] hover:underline underline-offset-4"
                          >
                            {l.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </article>
                ))}
              </div>
            </section>

            <section className="mt-16 max-w-3xl">
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
                試験の構成
              </h2>
              <p
                className="mt-3 text-sm text-[var(--muted-foreground)] leading-relaxed"
                style={{ textWrap: "pretty" }}
              >
                CBT 方式による通年実施で、科目 A と科目 B を同じ日に続けて受験します。
              </p>
              <div className="mt-4 overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-[var(--border)] text-left text-xs uppercase tracking-wider text-[var(--muted-foreground)]">
                      <th className="py-2 pr-3 font-semibold">科目</th>
                      <th className="py-2 pr-3 font-semibold">時間 / 問数</th>
                      <th className="py-2 font-semibold">出題範囲</th>
                    </tr>
                  </thead>
                  <tbody className="align-top">
                    <tr className="border-b border-[var(--border)]">
                      <td className="py-2 pr-3 whitespace-nowrap font-semibold">
                        科目 A
                      </td>
                      <td className="py-2 pr-3 whitespace-nowrap">
                        90 分 / 60 問
                      </td>
                      <td
                        className="py-2 text-[var(--muted-foreground)]"
                        style={{ textWrap: "pretty" }}
                      >
                        テクノロジ系・マネジメント系・ストラテジ系の四肢択一。データベース分野の SQL もここに出る
                      </td>
                    </tr>
                    <tr className="border-b border-[var(--border)]">
                      <td className="py-2 pr-3 whitespace-nowrap font-semibold">
                        科目 B
                      </td>
                      <td className="py-2 pr-3 whitespace-nowrap">
                        100 分 / 20 問
                      </td>
                      <td
                        className="py-2 text-[var(--muted-foreground)]"
                        style={{ textWrap: "pretty" }}
                      >
                        アルゴリズムとプログラミング (約 8 割) と情報セキュリティ (約 2 割)。擬似言語が使われる
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p
                className="mt-4 text-sm text-[var(--muted-foreground)]"
                style={{ textWrap: "pretty" }}
              >
                合格基準は科目 A・科目 B とも 1,000 点満点で 600 点以上。採点は IRT
                (項目応答理論) 方式なので、単純な正答率とは一致しません。
              </p>
            </section>

            <section className="mt-16 max-w-3xl">
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
                データベース分野を深く学ぶ
              </h2>
              <p
                className="mt-3 text-sm text-[var(--foreground)] leading-relaxed"
                style={{ textWrap: "pretty" }}
              >
                科目 A のデータベース分野は、
                <Link
                  href="/data-modeling/normalization/why"
                  className="underline underline-offset-4 hover:opacity-80"
                >
                  正規化
                </Link>
                と
                <Link
                  href="/data-modeling/er-diagram"
                  className="underline underline-offset-4 hover:opacity-80"
                >
                  ER 図
                </Link>
                が頻出です。試験対策の枠を超えて仕組みから理解したい場合は、
                <Link
                  href="/why-need-rdb"
                  className="underline underline-offset-4 hover:opacity-80"
                >
                  もしもこの世界に RDB がなかったら
                </Link>
                から読むと、制約やトランザクションが何のために存在するのかが掴めます。
              </p>
            </section>

            <div className="max-w-3xl">
              <FAQ items={FAQ_ITEMS} />
            </div>

            <div className="max-w-3xl">
              <AffiliateBooks
                topicSlug="fe-playground"
                domain="fe"
                heading="試験対策に使える書籍"
              />
            </div>
          </div>

          <FeSidebar topicSlug="fe-playground" from="xl" />
        </div>
      </Container>
    </div>
  );
}
