import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { ExternalLink } from "@/components/ui/ExternalLink";
import { Suspense } from "react";
import { Playground } from "@/components/fe/Playground";
import { PlaygroundDeepLink } from "@/components/fe/PlaygroundDeepLink";
import { AffiliateBooks } from "@/components/cta/AffiliateBooks";
import { FeSidebar } from "@/components/fe/FeSidebar";
import { FAQ } from "@/components/layout/FAQ";
import { FePlaygroundJsonLd } from "@/components/seo/JsonLd";
import { sections } from "@/content/sections";
import { site } from "@/lib/site";
import { feLessons } from "@/content/fe/lessons";
import { feQuizzes } from "@/content/fe/quiz";
import { primarySources } from "@/content/primary-sources";

const sectionMeta = sections.fe;

const PAGE_PATH = "/fe/algorithm";
const PAGE_TITLE = "基本情報技術者試験の擬似言語 実行シミュレーター";
const PAGE_DESCRIPTION =
  "基本情報技術者試験 (FE) 科目B で出題される擬似言語をその場で書いて、1 行ずつ実行して変数の変化を可視化し、Python / TypeScript に変換して読み比べることができる無料の学習ツール。";

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  alternates: { canonical: PAGE_PATH },
  openGraph: {
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    url: PAGE_PATH,
  },
  twitter: {
    card: "summary_large_image",
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
  },
};

const FAQ_ITEMS = [
  /*
   * **先頭 2 問は「悩みの質問」**。ツールの仕様の質問より先に、検索や AI に
   * 実際に打たれる不安（未経験でも解けるのか / 読めないのをどう直すか）へ答える。
   * AEO / LLMO で引用されるのはこの形の Q&A。
   */
  {
    q: "プログラミング未経験でも、科目B の擬似言語は読めるようになりますか？",
    a: "なります。擬似言語は特定のプログラミング言語ではなく、試験のためだけに定義された表記なので、実務経験の有無で差はつきません。差がつくのは、変数・条件分岐・繰り返し・配列・関数という 5 つの動きを頭の中で正しく追えるかどうかだけです。ここでは一行ずつ実行して変数の値の変化を表示するので、その 5 つを目で見て確かめられます。",
  },
  {
    q: "擬似言語のコードが読めません。どうすればわかりやすくなりますか？",
    a: "コード全体をいきなり理解しようとせず、変数の値を 1 行ごとに書き出して追ってください。読めない原因のほとんどは文法ではなく、繰り返しの中で値がどう変わるかを追いきれないことです。このシミュレーターの「一行ずつ実行」は、まさにその手作業を自動でやるものです。手が止まった構文があれば、その構文のレッスンだけを読めば足ります。",
  },
  {
    q: "この実行シミュレーターはどんなツールですか？",
    a: "基本情報技術者試験 (FE) 科目B で使われる擬似言語を、その場で書いて実行し、一行ずつ進めながら変数の変化と出力を可視化できる無料の学習ツールです。Python / TypeScript への変換もワンボタンで行えます。",
  },
  {
    q: "対応している擬似言語の仕様はどれですか？",
    a: "IPA が公表している「試験で使用する情報技術に関する用語・プログラム言語など Ver.5.1」の基本情報技術者試験 (FE) 部分に準拠しています。応用情報 (AP) 追加構文とオブジェクト指向 (クラス構文) は現時点で非対応です。",
  },
  {
    q: "配列の添字は 0 始まりですか？1 始まりですか？",
    a: "基本情報の擬似言語は 1 始まりです。この実行シミュレーターでも 1 始まりで動作し、Python / TypeScript に変換する際は自動的に -1 が付与されコメントで理由が明示されます。",
  },
  {
    q: "サーバに送信されますか？",
    a: "いいえ。コードの解析・実行・変換はすべてブラウザ内で完結し、サーバには送信されません。書いたコードはブラウザの localStorage 相当にのみ残ります。",
  },
];

export default function FeTopPage() {
  return (
    <div className="py-8 lg:py-12">
      {/* name に `sectionMeta.label` を渡さないこと。`/fe` がハブになったので
          label は「基本情報技術者試験 対策ツール」であり、このツールの名前ではない
          (docs/wip/20260815-fe-sql/01-implementation-design.md §2-3) */}
      <FePlaygroundJsonLd
        path={PAGE_PATH}
        name={PAGE_TITLE}
        description={PAGE_DESCRIPTION}
        breadcrumb={[
          { name: "ホーム", item: site.url },
          { name: sectionMeta.shortLabel, item: `${site.url}${sectionMeta.path}` },
          { name: "擬似言語 実行シミュレーター", item: `${site.url}${PAGE_PATH}` },
        ]}
        faq={FAQ_ITEMS}
      />
      <Container size="wide">
        <div className="grid gap-8 xl:gap-10 xl:grid-cols-[minmax(0,1fr)_15rem]">
          <div className="min-w-0">
            <header className="mb-6">
              <Eyebrow>基本情報技術者試験</Eyebrow>
              <h1 className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-[var(--foreground)]">
                擬似言語をブラウザで動かせる 実行シミュレーター
              </h1>
              <div
                className="mt-3 max-w-3xl text-sm sm:text-base text-[var(--muted-foreground)] leading-relaxed space-y-2"
                style={{ textWrap: "pretty" }}
              >
                <p>科目B (プログラミング問題) の擬似言語をその場で書いて実行できます。</p>
                <p>
                  一行ずつ実行して変数の変化を追い、Python / TypeScript に変換して読み比べられます。
                </p>
                <p className="text-xs text-[var(--muted-foreground)]">
                  IPA 公表の<ExternalLink href={primarySources.ipaPseudoLanguage.url}>擬似言語仕様 Ver.5.1</ExternalLink>（PDF）の基本情報技術者試験 (FE) 部分に準拠。
                </p>
              </div>
            </header>

            {/* Playground 自体は SSR して prerender HTML に markup を残す。
                ?code= / ?from= の読み取りだけを Suspense 配下の client に閉じ込める
                (server の searchParams で受けるとこのページが Dynamic になる) */}
            <Playground>
              <Suspense fallback={null}>
                <PlaygroundDeepLink />
              </Suspense>
            </Playground>

            <section className="mt-16 max-w-3xl">
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
                擬似言語 (基本情報 科目B) とは
              </h2>
              <div
                className="mt-4 space-y-4 text-[var(--foreground)] leading-relaxed"
                style={{ textWrap: "pretty" }}
              >
                <p>
                  基本情報技術者試験の科目 B では、特定のプログラミング言語ではなく、IPA
                  が定義した独自の「擬似言語」でアルゴリズムが出題されます。
                </p>
                <p>
                  C や Java のような厳密な文法ではなく、日本語混じりの読みやすい記法で書かれます。
                  初学者でも「何をしているか」を追いやすいのが特徴です。
                </p>
                <p>
                  しかし紙面で追うだけでは、変数の値がどう変化するか、ループが何回まわるか、
                  関数呼び出しでスタックがどう積まれるか、といった<strong>動的な挙動</strong>が掴みにくい面があります。
                </p>
                <p>
                  このツールはその「動き」を可視化して、擬似言語のコードが実行時に何をしているかを直感的に理解するためのものです。
                </p>
              </div>

              <h3 className="mt-10 text-lg font-bold tracking-tight">
                主要構文の全体像
              </h3>
              <p
                className="mt-2 text-sm text-[var(--muted-foreground)]"
                style={{ textWrap: "pretty" }}
              >
                IPA の<ExternalLink href={primarySources.ipaPseudoLanguage.url}>公式仕様書</ExternalLink>（{primarySources.ipaPseudoLanguage.label}・PDF）の表記に沿った、主要な構文をまとめます。
              </p>
              <div className="mt-4 overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-[var(--border)] text-left text-xs uppercase tracking-wider text-[var(--muted-foreground)]">
                      <th className="py-2 pr-3 font-semibold">構文</th>
                      <th className="py-2 pr-3 font-semibold">記述例</th>
                      <th className="py-2 font-semibold">意味</th>
                    </tr>
                  </thead>
                  <tbody className="align-top">
                    {SYNTAX_TABLE.map((row) => (
                      <tr
                        key={row.name}
                        className="border-b border-[var(--border)]"
                      >
                        <td className="py-2 pr-3 whitespace-nowrap font-semibold">
                          {row.name}
                        </td>
                        <td className="py-2 pr-3">
                          <code className="whitespace-pre-wrap rounded bg-[var(--muted)] px-1.5 py-0.5 font-mono text-xs">
                            {row.example}
                          </code>
                        </td>
                        <td
                          className="py-2 text-[var(--muted-foreground)]"
                          style={{ textWrap: "pretty" }}
                        >
                          {row.meaning}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p
                className="mt-4 text-sm text-[var(--muted-foreground)]"
                style={{ textWrap: "pretty" }}
              >
                配列は必ず 1 番目から始まります (0 始まりではありません)。
                Python / TypeScript に変換する際は自動的に <code>-1</code>{" "}
                が付与され、注釈コメントも生成されるので違いを直感的に確認できます。
              </p>
            </section>

            <section className="mt-16 max-w-3xl">
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
                もっと詳しく — 構文別レッスン
              </h2>
              <p className="mt-3 text-sm text-[var(--muted-foreground)]">
                各構文の詳しい解説と、埋め込みエディタで動かせる例題を用意しています。
              </p>
              <ul className="mt-6 grid gap-3 sm:grid-cols-2">
                {feLessons.map((l) => (
                  <li key={l.slug}>
                    <Link
                      href={`/fe/algorithm/lessons/${l.slug}`}
                      className="block rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 hover:border-[var(--border-strong)] hover:bg-[var(--muted)]/40 transition-colors"
                    >
                      <div className="text-xs text-[var(--muted-foreground)]">
                        レッスン {l.order}
                      </div>
                      <div className="mt-1 font-semibold">{l.shortTitle}</div>
                      <p
                        className="mt-2 text-xs text-[var(--muted-foreground)] leading-relaxed"
                        style={{ textWrap: "pretty" }}
                      >
                        {l.cardSummary}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
              <p className="mt-6 text-sm text-[var(--muted-foreground)]">
                <Link
                  href="/fe/algorithm/lessons"
                  className="underline underline-offset-4 hover:opacity-80"
                >
                  レッスン一覧を開く →
                </Link>
              </p>
            </section>

            <section className="mt-16 max-w-3xl">
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
                読めるようになったら — 練習問題 {feQuizzes.length} 問
              </h2>
              <p
                className="mt-3 text-sm text-[var(--muted-foreground)] leading-relaxed"
                style={{ textWrap: "pretty" }}
              >
                コードを目で追って出力を答える 4 択のオリジナル問題です。
                解答すると解説と、そのコードを実行シミュレーターで開くリンクが出ます。
              </p>
              <ul className="mt-6 grid gap-3 sm:grid-cols-2">
                {feQuizzes.slice(0, 4).map((q) => (
                  <li key={q.slug}>
                    <Link
                      href={`/fe/algorithm/quiz/${q.slug}`}
                      className="block h-full rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 hover:border-[var(--border-strong)] hover:bg-[var(--muted)]/40 transition-colors"
                    >
                      <div className="text-xs text-[var(--muted-foreground)]">
                        第 {q.order} 問
                      </div>
                      <div className="mt-1 font-semibold">{q.shortTitle}</div>
                      <p
                        className="mt-2 text-xs text-[var(--muted-foreground)] leading-relaxed"
                        style={{ textWrap: "pretty" }}
                      >
                        {q.challenge}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
              <p className="mt-6 text-sm text-[var(--muted-foreground)]">
                <Link
                  href="/fe/algorithm/quiz"
                  className="underline underline-offset-4 hover:opacity-80"
                >
                  練習問題一覧を開く（全 {feQuizzes.length} 問）→
                </Link>
              </p>
            </section>

            <section className="mt-16 max-w-3xl">
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
                さらに深く比較したい
              </h2>
              <p
                className="mt-3 text-sm text-[var(--foreground)] leading-relaxed"
                style={{ textWrap: "pretty" }}
              >
                擬似言語と Python / TypeScript を並べて読み比べたい場合は、
                <Link
                  href="/fe/algorithm/transpile"
                  className="underline underline-offset-4 hover:opacity-80"
                >
                  多言語横並び比較ツール
                </Link>
                を用意しています。3 言語同時ビューで、構文ごとの差分を目で追えます。
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

const SYNTAX_TABLE = [
  {
    name: "変数宣言",
    example: "整数型: x ← 0",
    meaning: "型を明示して初期値を与える。← は代入を表す",
  },
  {
    name: "条件分岐",
    example:
      "if (x > 0) then\n  ...\nelseif (...)\n  ...\nelse\n  ...\nendif",
    meaning: "条件によって処理を分岐する",
  },
  {
    name: "繰り返し (while)",
    example: "while (条件)\n  ...\nendwhile",
    meaning: "条件が真の間くり返す",
  },
  {
    name: "繰り返し (for)",
    example: "for (i を 1 から n まで 1 ずつ増やす)\n  ...\nendfor",
    meaning: "回数を指定してくり返す (1 始まり、n を含む)",
  },
  {
    name: "配列",
    example: "整数型の配列: arr ← {1, 2, 3}",
    meaning: "複数の値をまとめて扱う。添字は 1 始まり",
  },
  {
    name: "関数定義",
    example: "○整数型: name(整数型: a)\n  return a",
    meaning: "○ から始めて関数を定義。手続き (戻り値なし) は型を省略",
  },
];

