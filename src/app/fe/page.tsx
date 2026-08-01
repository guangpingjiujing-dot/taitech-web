import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Playground } from "@/components/fe/Playground";
import { FePlaygroundJsonLd } from "@/components/seo/JsonLd";
import { sections } from "@/content/sections";
import { site } from "@/lib/site";

const sectionMeta = sections.fe;

const PAGE_TITLE =
  "基本情報技術者試験の擬似言語をブラウザで実行できる Playground｜taitech.dev";
const PAGE_DESCRIPTION =
  "基本情報技術者試験 (FE) 科目B で出題される擬似言語をその場で書いて、1文ずつステップ実行して変数の変化を可視化し、Python / TypeScript に変換して読み比べることができる無料の学習ツール。";

export const metadata: Metadata = {
  title: { absolute: PAGE_TITLE },
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

const FAQ = [
  {
    q: "この Playground はどんなツールですか？",
    a: "基本情報技術者試験 (FE) 科目B で使われる擬似言語を、その場で書いて実行し、変数の変化や呼び出しスタックを可視化できる無料の学習ツールです。Python / TypeScript への変換もワンボタンで行えます。",
  },
  {
    q: "対応している擬似言語の仕様はどれですか？",
    a: "IPA が公表している「試験で使用する情報技術に関する用語・プログラム言語など Ver.5.1」の基本情報技術者試験 (FE) 部分に準拠しています。応用情報 (AP) 追加構文とオブジェクト指向 (クラス構文) は現時点で非対応です。",
  },
  {
    q: "配列の添字は 0 始まりですか？1 始まりですか？",
    a: "基本情報の擬似言語は 1 始まりです。この Playground でも 1 始まりで動作し、Python / TypeScript に変換する際は自動的に -1 が付与されコメントで理由が明示されます。",
  },
  {
    q: "サーバに送信されますか？",
    a: "いいえ。コードの解析・実行・変換はすべてブラウザ内で完結し、サーバには送信されません。書いたコードはブラウザの localStorage 相当にのみ残ります。",
  },
];

export default function FeTopPage() {
  return (
    <div className="py-8 lg:py-12">
      <FePlaygroundJsonLd
        path={sectionMeta.path}
        name={sectionMeta.label}
        description={PAGE_DESCRIPTION}
        breadcrumb={[
          { name: "ホーム", item: site.url },
          { name: sectionMeta.shortLabel, item: `${site.url}${sectionMeta.path}` },
        ]}
        faq={FAQ}
      />
      <Container size="wide">
        <header className="mb-6">
          <p className="text-xs font-semibold tracking-wider uppercase text-[var(--muted-foreground)]">
            基本情報技術者試験
          </p>
          <h1 className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-[var(--foreground)]">
            擬似言語をブラウザで実行できる Playground
          </h1>
          <p className="mt-3 max-w-3xl text-sm sm:text-base text-[var(--muted-foreground)] leading-relaxed">
            科目B (プログラミング問題) で使われる擬似言語を、その場で書いて・1文ずつステップ実行して変数の変化を目で追い・Python / TypeScript
            に変換して読み比べることができます。IPA
            公表の擬似言語仕様 Ver.5.1 (FE 部分) に準拠。
          </p>
        </header>

        <Playground />

        <section className="mt-16 max-w-3xl">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
            擬似言語 (基本情報 科目B) とは
          </h2>
          <div className="mt-4 space-y-4 text-[var(--foreground)] leading-relaxed">
            <p>
              基本情報技術者試験の科目B では、特定のプログラミング言語ではなく IPA
              が定義した独自の「擬似言語」でアルゴリズムが出題されます。C や Java
              のような文法ではなく、日本語混じりの読みやすい記法で書かれており、
              初学者でも「何をしているか」を追いやすいのが特徴です。
            </p>
            <p>
              しかし紙面で追うだけでは、変数の値がどう変化するか・ループが何回まわるか・
              関数呼び出しでスタックがどう積まれるかといった<strong>動的な挙動</strong>
              が掴みにくい面があります。本 Playground はその「動き」を可視化して、
              擬似言語のコードが実行時に何をしているかを直感的に理解するためのツールです。
            </p>
          </div>

          <h3 className="mt-8 text-lg font-bold tracking-tight">
            主要構文の全体像
          </h3>
          <ul className="mt-3 space-y-2 text-sm leading-relaxed text-[var(--foreground)]">
            <li>
              <code className="rounded bg-[var(--muted)] px-1.5 py-0.5 font-mono text-xs">
                整数型: x ← 0
              </code>{" "}
              — 変数宣言と代入。型を明示して初期値を与えます
            </li>
            <li>
              <code className="rounded bg-[var(--muted)] px-1.5 py-0.5 font-mono text-xs">
                if (x &gt; 0) then / elseif / else / endif
              </code>{" "}
              — 条件分岐
            </li>
            <li>
              <code className="rounded bg-[var(--muted)] px-1.5 py-0.5 font-mono text-xs">
                while (条件) ... endwhile
              </code>{" "}
              — 繰り返し (条件が真の間)
            </li>
            <li>
              <code className="rounded bg-[var(--muted)] px-1.5 py-0.5 font-mono text-xs">
                for (i を 1 から n まで 1 ずつ増やす) ... endfor
              </code>{" "}
              — 繰り返し (回数指定)
            </li>
            <li>
              <code className="rounded bg-[var(--muted)] px-1.5 py-0.5 font-mono text-xs">
                整数型の配列: arr ← &#123;1, 2, 3&#125;
              </code>{" "}
              — 配列 (1 始まり)
            </li>
            <li>
              <code className="rounded bg-[var(--muted)] px-1.5 py-0.5 font-mono text-xs">
                ○整数型: name(...)
              </code>{" "}
              — 関数定義 (○ は関数/手続きの目印)
            </li>
          </ul>
          <p className="mt-4 text-sm text-[var(--muted-foreground)]">
            配列は必ず 1 番目から始まります (0 始まりではありません)。この Playground
            では Python / TypeScript に変換する際に自動的に <code>-1</code>{" "}
            が付与され、注釈コメントも生成されるので違いを直感的に確認できます。
          </p>
        </section>

        <section className="mt-16 max-w-3xl">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
            もっと詳しく — 構文別レッスン
          </h2>
          <p className="mt-3 text-sm text-[var(--muted-foreground)]">
            各構文の詳しい解説と例題を用意しています (順次公開予定)。
          </p>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2">
            {LESSON_CARDS.map((l) => (
              <li key={l.slug}>
                <div className="block rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 opacity-60">
                  <div className="font-semibold">{l.title}</div>
                  <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                    {l.description}
                  </p>
                  <div className="mt-2 text-xs text-[var(--muted-foreground)]">
                    準備中
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-16 max-w-3xl">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
            さらに深く比較したい
          </h2>
          <p className="mt-3 text-sm text-[var(--foreground)] leading-relaxed">
            擬似言語と Python / TypeScript を横並びで比較したい場合は{" "}
            <Link
              href="/fe/transpile"
              className="underline underline-offset-4 hover:opacity-80"
            >
              /fe/transpile
            </Link>{" "}
            で 3 言語同時ビューを開けます。
          </p>
        </section>
      </Container>
    </div>
  );
}

const LESSON_CARDS = [
  {
    slug: "variable",
    title: "変数と型",
    description: "整数型 / 実数型 / 文字列型 / 論理型 と代入 (←)",
  },
  {
    slug: "if",
    title: "条件分岐 (if / elseif / else)",
    description: "if 文の書き方と、複数条件の組み合わせ方",
  },
  {
    slug: "while",
    title: "繰り返し (while)",
    description: "条件が真の間くり返す構文と、無限ループの避け方",
  },
  {
    slug: "for",
    title: "繰り返し (for)",
    description: "「〜から〜まで〜ずつ増やす」形の使い方と境界条件",
  },
  {
    slug: "array",
    title: "配列",
    description: "配列宣言・要素アクセス。基本情報の配列は1始まり",
  },
  {
    slug: "function",
    title: "関数と手続き",
    description: "○ から始まる関数/手続き定義と引数の渡し方",
  },
];
