import Link from "next/link";
import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { LevelBadge } from "@/components/ui/Badge";
import { MentorCTA } from "@/components/cta/MentorCTA";
import { AffiliateBooks } from "@/components/cta/AffiliateBooks";
import { FAQ } from "@/components/layout/FAQ";
import { CategoryHubJsonLd } from "@/components/seo/JsonLd";
import { sections, dataModelingCategories } from "@/content/sections";
import { dataModelingTopicsIn } from "@/content/topics";
import { AnomalyList } from "@/components/viz/er/AnomalyList";

const category = dataModelingCategories["er-diagram"];
const sectionMeta = sections["data-modeling"];

const PAGE_TITLE = "変なER図｜あなたには、この ER 図の異常さがわかりますか？";
const PAGE_DESCRIPTION =
  "明らかにおかしい架空 EC サイトの ER 図の間違い探しから、エンティティ・関連・カーディナリティ・弱エンティティ・記法まで、ER 図の読み方を身近な例え (EC サイト・学校・会社) で体系的に学べる図解サイト。";

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  alternates: { canonical: category.path },
  openGraph: {
    title: PAGE_TITLE,
    description:
      "9 つの明らかにおかしい箇所を数えながら、ER 図の基礎を身近な例で理解する。",
    url: category.path,
  },
  twitter: {
    card: "summary_large_image",
    title: PAGE_TITLE,
    description:
      "9 つの明らかにおかしい箇所を数えながら、ER 図の基礎を身近な例で理解する。",
  },
};

const LEARNING_ORDER = [
  "entity",
  "relationship",
  "cardinality",
  "optionality",
  "many-to-many",
  "weak-entity",
  "notation",
] as const;

const faq = [
  {
    q: "変なER図とは何ですか？",
    a: "実世界に落とし込むと明らかに機能不全になる架空の ER 図を教材化したものです。ER 図の読み方を「間違い探し」で学ぶための構成で、9 つの意図的な違和感を仕込んでいます。",
  },
  {
    q: "ER 図の書き方の基本は？",
    a: "実世界を「エンティティ (箱)」と「関連 (線)」の 2 種類だけで表現します。線の端にカーディナリティ (多重度) と参加制約 (必須/任意) の記号を付けて、その関係が「何個の何と結び付くか」を規定します。",
  },
  {
    q: "弱エンティティと強エンティティの違いは？",
    a: "強エンティティは自前の主キーだけで一意に識別できるエンティティ (例: 注文)。弱エンティティは親エンティティのキーを借りて初めて識別できるエンティティ (例: 注文明細)。親を消したら子が意味を持たなくなる関係が目印です。",
  },
  {
    q: "ER 図の記法にはどんな種類がありますか？",
    a: "現代の作図ツールの既定は IE 記法 (crow's foot)、防衛・官公庁系で IDEF1X、学術文献で Chen 記法が使われます。同じ ER 図を 3 記法で描き分けた対応表は 記法比較ページ を参照してください。",
  },
];

export default function ErDiagramHub() {
  const topics = dataModelingTopicsIn("er-diagram");
  const ordered = LEARNING_ORDER.map(
    (slug) => topics.find((t) => t.slug === slug)!,
  );

  return (
    <div
      data-theme="weird-er"
      className="bg-[var(--background)] text-[var(--foreground)] min-h-screen"
    >
      <CategoryHubJsonLd category="er-diagram" faq={faq} />

      <section className="border-b border-[var(--border)]">
        <Container size="wide" className="py-10 md:py-14">
          <nav
            aria-label="パンくず"
            className="text-xs text-[var(--muted-foreground)]"
          >
            <Link href="/" className="hover:text-[var(--foreground)]">
              ホーム
            </Link>
            <span className="mx-2">/</span>
            <Link href={sectionMeta.path} className="hover:text-[var(--foreground)]">
              {sectionMeta.shortLabel}
            </Link>
            <span className="mx-2">/</span>
            <span>{category.label}</span>
          </nav>

          <div className="mt-6 max-w-3xl">
            <h1 className="font-serif text-4xl md:text-6xl font-bold tracking-tight leading-none">
              変なER図
              <span className="mt-4 block font-sans text-base md:text-xl text-[var(--muted-foreground)] font-normal tracking-wide">
                あなたには、この ER 図の異常さがわかりますか？
              </span>
            </h1>
            <p className="mt-8 text-base md:text-lg text-[var(--foreground)]/90 leading-relaxed">
              下に、明らかにおかしい ER 図が 1 枚あります。仕込まれているのは 9 つの違和感。
            </p>
            <p className="mt-4 text-base md:text-lg text-[var(--foreground)]/90 leading-relaxed">
              「なんとなく変」で止まっていた感覚を、ER 図の概念で 1 つずつ言語化していきましょう。
            </p>
          </div>

          <p
            data-speakable="definition"
            className="sr-only"
          >
            ER 図 (Entity-Relationship Diagram) とは、実世界を「エンティティ (実体)」と「関連 (リレーションシップ)」の 2 種類の抽象単位で表現する図式手法であり、リレーショナルデータベース設計における概念モデルの標準的記法である。
          </p>

          <div className="mt-10">
            <AnomalyList />
          </div>
        </Container>
      </section>

      <section className="border-b border-[var(--border)]">
        <Container size="wide" className="py-12 md:py-16">
          <h2 className="mb-2 text-xl md:text-2xl font-bold tracking-tight">
            ER 図の基本を体系的に学ぶ
          </h2>
          <p className="mb-8 text-sm text-[var(--muted-foreground)] leading-relaxed">
            推奨する学習順序で並べています。各違和感の解説から辿ってきた場合は、
            該当ページだけ拾い読みしても構いません。
          </p>
          <ul className="divide-y divide-[var(--border)] border-y border-[var(--border)]">
            {ordered.map((t, i) => (
              <li key={t.slug}>
                <Link
                  href={t.path}
                  className="group flex items-start justify-between gap-4 py-5 px-2 -mx-2 hover:bg-[var(--muted)]/60 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-3 flex-wrap">
                      <span className="text-[10px] font-bold text-[var(--muted-foreground)] font-mono">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span className="text-lg font-bold group-hover:underline underline-offset-4">
                        {t.shortTitle}
                      </span>
                      <span className="text-sm text-[var(--muted-foreground)]">
                        {t.title}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-[var(--muted-foreground)] leading-relaxed line-clamp-2">
                      {t.summary}
                    </p>
                  </div>
                  <LevelBadge level={t.level} />
                </Link>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      <section className="border-b border-[var(--border)]">
        <Container size="wide" className="py-12 md:py-16">
          <h2 className="mb-2 text-xl md:text-2xl font-bold tracking-tight">
            レビュー時のコピペ用チェックリスト
          </h2>
          <p className="mb-6 text-sm text-[var(--muted-foreground)] leading-relaxed">
            9 つの違和感を汎化した項目。Slack や PR の ER 図レビューで貼って、上から順に潰していく。
          </p>
          <div className="rounded border border-[var(--border-strong)] bg-[var(--card)] p-5">
            <pre className="text-xs md:text-sm leading-relaxed whitespace-pre-wrap font-mono">{`### ER 図レビュー チェックリスト
- [ ] エンティティの粒度は適切か (属性に複数値・JSON が入っていないか)
- [ ] 主キーは適切か (全エンティティに 1 つ以上宣言、代理/自然キーの使い分けは統一されているか)
- [ ] 関連に役割名が付いているか (特に同エンティティ間に複数の関連があるとき)
- [ ] 自己参照 (再帰関連) の方向と役割名が明示されているか
- [ ] カーディナリティが実世界の業務ルールと一致しているか
- [ ] 参加制約 (必須/任意) が明示され矛盾がないか
- [ ] 多対多は連関実体に分解されているか
- [ ] 弱エンティティは親エンティティと識別関係で繋がっているか
- [ ] 図全体で記法が統一されているか
`}</pre>
          </div>
        </Container>
      </section>

      <Container size="wide" className="py-12">
        <FAQ items={faq} />
      </Container>

      <Container size="wide" className="pt-4 pb-16">
        <AffiliateBooks topicSlug="entity" />
      </Container>

      <Container size="wide" className="pt-4 pb-16">
        <MentorCTA />
      </Container>
    </div>
  );
}
