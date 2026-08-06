import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { TranspileComparison } from "@/components/fe/TranspileComparison";
import { AffiliateBooks } from "@/components/cta/AffiliateBooks";
import { FeSidebar } from "@/components/fe/FeSidebar";
import { FePlaygroundJsonLd } from "@/components/seo/JsonLd";
import { sections } from "@/content/sections";
import { site } from "@/lib/site";

const PAGE_TITLE = "基本情報の擬似言語を Python / TypeScript に変換";
const PAGE_DESCRIPTION =
  "基本情報技術者試験の擬似言語コードを Python と TypeScript に同時変換し、3 言語を横並びで比較できるツール。配列の添字 (1 始まり vs 0 始まり) や for ループの書き方の違いを目で見て確認できる。";

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  alternates: { canonical: "/fe/transpile" },
  openGraph: {
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    url: "/fe/transpile",
  },
  twitter: {
    card: "summary_large_image",
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
  },
};

const feSection = sections.fe;

export default function TranspilePage() {
  return (
    <div className="py-8 lg:py-12">
      <FePlaygroundJsonLd
        path="/fe/transpile"
        name="擬似言語 → Python / TypeScript 変換ツール"
        description={PAGE_DESCRIPTION}
        breadcrumb={[
          { name: "ホーム", item: site.url },
          { name: feSection.shortLabel, item: `${site.url}${feSection.path}` },
          { name: "Python / TypeScript 変換", item: `${site.url}/fe/transpile` },
        ]}
      />
      <Container size="wide">
        <div className="grid gap-8 2xl:gap-10 2xl:grid-cols-[minmax(0,1fr)_15rem]">
          <div className="min-w-0">
            <Breadcrumb
              className="mb-6"
              items={[
                { href: "/", label: "ホーム" },
                { href: feSection.path, label: "擬似言語 実行シミュレーター" },
                { label: "多言語横並び比較" },
              ]}
            />
            <header className="mb-6">
              <Eyebrow>擬似言語 → Python / TypeScript</Eyebrow>
              <h1 className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-[var(--foreground)]">
                擬似言語を実在の言語に変換して読み比べる
              </h1>
              <p className="mt-3 max-w-3xl text-sm sm:text-base text-[var(--muted-foreground)] leading-relaxed">
                擬似言語コードを書くと、Python と TypeScript
                のコードが即座に横並びで表示されます。「知っている言語で書くとどうなるか」
                を見比べることで、擬似言語の各構文が何を意味しているかを直感的に掴めます。
              </p>
            </header>

            <TranspileComparison />

            <section className="mt-16 max-w-3xl space-y-6">
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
                変換で気をつけているポイント
              </h2>
              <div>
                <h3 className="text-lg font-bold">
                  配列の添字は自動的に -1 されます
                </h3>
                <p className="mt-2 text-sm leading-relaxed">
                  基本情報の擬似言語では配列の添字は 1 始まりですが、Python も
                  TypeScript も 0 始まりです。変換結果では{" "}
                  <code className="rounded bg-[var(--muted)] px-1.5 py-0.5 font-mono text-xs">
                    arr[i - 1]
                  </code>{" "}
                  のように <code>-1</code> が自動的に付き、コメントで理由を明示します。
                  「なぜ -1 されているのか?」を疑問に持ったところが理解のスタート地点です。
                </p>
              </div>
              <div>
                <h3 className="text-lg font-bold">for ループの終了条件</h3>
                <p className="mt-2 text-sm leading-relaxed">
                  擬似言語の「〜まで」は終了値を含みます (1 から n まで → 1〜n
                  の n 回)。Python の <code>range(1, n + 1)</code> や TypeScript の{" "}
                  <code>i &lt;= n</code> はこの意味に合わせて変換されます。
                </p>
              </div>
              <div>
                <h3 className="text-lg font-bold">
                  比較演算子 <code>=</code> は <code>==</code>{" "}
                  / <code>===</code> に
                </h3>
                <p className="mt-2 text-sm leading-relaxed">
                  擬似言語の <code>=</code> は「等しい」の比較です。代入は{" "}
                  <code>←</code> なので混乱しませんが、Python では{" "}
                  <code>==</code>、TypeScript では{" "}
                  <code>===</code> に翻訳される点を意識すると、実言語での書き換えがスムーズです。
                </p>
              </div>
            </section>

            <div className="max-w-3xl">
              <AffiliateBooks
                topicSlug="fe-transpile"
                domain="fe"
                limit={3}
                heading="擬似言語をもっと読み解く（おすすめ書籍）"
              />
            </div>

            <section
              aria-labelledby="transpile-next"
              className="mt-16 max-w-3xl rounded-lg border border-[var(--border)] bg-[var(--card)] p-5"
            >
              <h2 id="transpile-next" className="text-sm font-bold">
                次に進む
              </h2>
              <ul className="mt-3 grid gap-2 sm:grid-cols-3">
                {[
                  {
                    href: "/fe",
                    label: "実行シミュレーターへ",
                    hint: "一行ずつ実行して変数を追う",
                  },
                  {
                    href: "/fe/lessons",
                    label: "構文別レッスンへ",
                    hint: "6 本の解説を順に読む",
                  },
                  {
                    href: "/fe/quiz",
                    label: "練習問題へ",
                    hint: "出力を当てられるか試す",
                  },
                ].map((a) => (
                  <li key={a.href}>
                    <Link
                      href={a.href}
                      className="group block rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 hover:border-[var(--border-strong)] hover:bg-[var(--muted)]/60 transition-colors"
                    >
                      <div className="text-sm font-semibold group-hover:underline underline-offset-4">
                        {a.label} →
                      </div>
                      <div className="mt-0.5 text-xs text-[var(--muted-foreground)] leading-tight">
                        {a.hint}
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          </div>

          <FeSidebar topicSlug="fe-transpile" from="2xl" />
        </div>
      </Container>
    </div>
  );
}
