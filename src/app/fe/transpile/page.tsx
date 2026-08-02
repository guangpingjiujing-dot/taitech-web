import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { TranspileComparison } from "@/components/fe/TranspileComparison";
import { FePlaygroundJsonLd } from "@/components/seo/JsonLd";
import { sections } from "@/content/sections";
import { site } from "@/lib/site";

const PAGE_TITLE =
  "基本情報の擬似言語を Python / TypeScript に変換して比較する｜taitech.dev";
const PAGE_DESCRIPTION =
  "基本情報技術者試験の擬似言語コードを Python と TypeScript に同時変換し、3 言語を横並びで比較できるツール。配列の添字 (1 始まり vs 0 始まり) や for ループの書き方の違いを目で見て確認できる。";

export const metadata: Metadata = {
  title: { absolute: PAGE_TITLE },
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
        <div className="mb-4">
          <BackToPlayground />
        </div>
        <header className="mb-6">
          <p className="text-xs font-semibold tracking-wider uppercase text-[var(--muted-foreground)]">
            擬似言語 → Python / TypeScript
          </p>
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

        <div className="mt-16">
          <BackToPlayground />
        </div>
      </Container>
    </div>
  );
}

function BackToPlayground() {
  return (
    <Link
      href="/fe"
      className="inline-flex items-center gap-2 rounded-md border border-[var(--foreground)] px-4 py-2 text-sm font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--foreground)] hover:text-[var(--background)]"
    >
      <span aria-hidden>←</span>
      実行シミュレーターに戻る
    </Link>
  );
}
