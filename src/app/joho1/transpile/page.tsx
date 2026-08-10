import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { AffiliateBooks } from "@/components/cta/AffiliateBooks";
import { Joho1TranspileComparison } from "@/components/joho1/Joho1TranspileComparison";
import { Joho1Sidebar } from "@/components/joho1/Joho1Sidebar";
import { Joho1PageJsonLd } from "@/components/seo/JsonLd";
import { sections } from "@/content/sections";
import { site } from "@/lib/site";

const PAGE_TITLE = "情報Iのプログラム表記と Python を横に並べて読み比べる";
const PAGE_DESCRIPTION =
  "大学入学共通テスト「情報I」のプログラム表記を書くと、同じ処理の Python が即座に横に表示される。授業で書いた Python と試験に出る書き方の対応を、繰り返し・配列・添字の -1 まで含めて目で確認できる。";

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  alternates: { canonical: "/joho1/transpile" },
  openGraph: {
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    url: "/joho1/transpile",
  },
  twitter: {
    card: "summary_large_image",
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
  },
};

const sectionMeta = sections.joho1;

export default function Joho1TranspilePage() {
  return (
    <>
      <Joho1PageJsonLd
        path="/joho1/transpile"
        name="情報I プログラム表記 → Python 変換ツール"
        description={PAGE_DESCRIPTION}
        keywords={[
          "共通テスト",
          "情報I",
          "情報1",
          "プログラム表記",
          "Python",
          "変換",
          "対応表",
        ]}
        learningResourceType="Simulation"
        breadcrumb={[
          { name: "ホーム", item: site.url },
          {
            name: sectionMeta.shortLabel,
            item: `${site.url}${sectionMeta.path}`,
          },
          { name: "Python との読み比べ", item: `${site.url}/joho1/transpile` },
        ]}
      />
      <Container size="wide" className="py-8 md:py-12">
        <div className="grid gap-8 2xl:gap-10 2xl:grid-cols-[minmax(0,1fr)_15rem]">
          <div className="min-w-0">
            <Breadcrumb
              className="mb-6"
              items={[
                { href: "/", label: "ホーム" },
                { href: sectionMeta.path, label: "情報I プログラム表記" },
                { label: "Python との読み比べ" },
              ]}
            />

            <header className="mb-6 max-w-3xl">
              <Eyebrow>大学入学共通テスト「情報I」— プログラム表記</Eyebrow>
              <h1 className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight">
                プログラム表記と Python を並べて読む
              </h1>
              <p
                className="mt-3 text-sm sm:text-base text-[var(--muted-foreground)] leading-relaxed"
                style={{ textWrap: "pretty" }}
              >
                左にプログラム表記を書くと、同じ処理の Python が右に出ます。
                授業で Python を書いてきた人にとっては、
                <strong>すでに知っている処理が試験ではどう書かれるのか</strong>
                を確かめるのがいちばん速い入り口です。
              </p>
            </header>

            <Joho1TranspileComparison />

            <section className="mt-16 max-w-3xl">
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
                変換で気をつけているところ
              </h2>

              <h3 className="mt-8 text-lg font-bold">
                添字は「1 始まりの問題のときだけ」-1 されます
              </h3>
              <p
                className="mt-2 text-sm sm:text-base text-[var(--muted-foreground)] leading-relaxed"
                style={{ textWrap: "pretty" }}
              >
                Python のリストは必ず 0 から始まります。一方、共通テストのプログラム表記では
                添字が 0 から始まるか 1 から始まるかが問題文のなかで宣言され、
                実際に同じ年度の本試験と追試験で違っていました。
                だからこのページには基点の切り替えがあり、1 始まりを選んだときだけ
                <code>A[i]</code> が <code>A[i - 1]</code> になります。
                自動で -1 する仕様だと思い込まないでください。
              </p>

              <h3 className="mt-8 text-lg font-bold">
                表示する() は print(…, sep=&quot;&quot;) になります
              </h3>
              <p
                className="mt-2 text-sm sm:text-base text-[var(--muted-foreground)] leading-relaxed"
                style={{ textWrap: "pretty" }}
              >
                <code>表示する</code> は渡した値を区切らずにつなげて表示します。
                Python の <code>print</code> は既定で値の間に空白を入れるので、
                そのままでは出力が変わってしまいます。
                同じ結果にするために <code>sep=&quot;&quot;</code> を付けています。
              </p>

              <h3 className="mt-8 text-lg font-bold">
                「〜まで」は終わりの値を含むので range に +1 します
              </h3>
              <p
                className="mt-2 text-sm sm:text-base text-[var(--muted-foreground)] leading-relaxed"
                style={{ textWrap: "pretty" }}
              >
                <code>i を 1 から 5 まで</code> は 5 も実行しますが、Python の{" "}
                <code>range(1, 5)</code> は 4 で止まります。
                この 1 のずれは、Python に慣れているほど間違えやすいところです。
                変換結果が <code>range(1, 5 + 1, 1)</code> と冗長な形で出るのは、
                どこで +1 したのかを見えるようにするためです。
              </p>

              <h3 className="mt-8 text-lg font-bold">
                関数は問題ごとに与えられるものです
              </h3>
              <p
                className="mt-2 text-sm sm:text-base text-[var(--muted-foreground)] leading-relaxed"
                style={{ textWrap: "pretty" }}
              >
                <code>要素数</code> は <code>len</code>、<code>最大値</code> は{" "}
                <code>max</code> に対応しますが、これは
                <strong>この 2 つが実際に出題されたから</strong>
                であって、決まった対応表があるわけではありません。
                プログラム表記には固定の組み込み関数がなく、使える関数は問題文の
                【関数の説明】で毎回与えられます。
                対応表を覚えるのではなく、その場で読む練習をしてください。
              </p>
            </section>

            <p className="mt-10 max-w-3xl text-sm text-[var(--muted-foreground)]">
              1 行ずつ動かして変数の変化を見たいときは{" "}
              <Link
                href={sectionMeta.path}
                className="underline underline-offset-4 hover:opacity-80"
              >
                実行シミュレーター
              </Link>
              、記法そのものを確認したいときは{" "}
              <Link
                href="/joho1/lessons"
                className="underline underline-offset-4 hover:opacity-80"
              >
                構文別レッスン
              </Link>{" "}
              へ。
            </p>

            <div className="max-w-3xl">
              <AffiliateBooks
                topicSlug="joho1-transpile"
                domain="joho1"
                limit={3}
                heading="共通テスト 情報I の対策書（おすすめ書籍）"
              />
            </div>
          </div>

          <Joho1Sidebar topicSlug="joho1-transpile" from="2xl" />
        </div>
      </Container>
    </>
  );
}
