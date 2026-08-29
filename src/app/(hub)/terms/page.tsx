import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { ArticleMeta } from "@/components/layout/ArticleMeta";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "利用規約",
  description: `${site.name}の利用規約`,
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <Container size="narrow" className="py-12 md:py-16">
      <article className="prose-jp max-w-none">
        <h1>利用規約</h1>
        {/* 規約系は著者ではなく改定日が要る。名義は運営者なので著者行は出さない */}
        <ArticleMeta
          path="/terms"
          className="not-prose"
          showAuthor={false}
          dateLabel="最終改定"
        />
        <p>
          本規約は、{site.name}（以下「本サイト」）の利用条件を定めるものです。ユーザーは本サイトを利用することにより、本規約に同意したものとみなします。
        </p>

        <h2>1. 著作権</h2>
        <p>
          本サイトの図解・アニメーション・文章等のコンテンツの著作権は、特に明示のない限り運営者に帰属します。
          個人での学習・引用は自由に行っていただけますが、無断での複製・改変・商用転載は禁止します。引用する場合は出典としてリンクを明記してください。
        </p>

        <h2>2. リンクについて</h2>
        <p>
          本サイトへのリンクは自由です。事前連絡は不要ですが、可能であれば教えていただけると嬉しいです。
        </p>

        <h2>3. 禁止事項</h2>
        <ul>
          <li>本サイトのコンテンツを無断で複製・転載・改変する行為</li>
          <li>本サイトのサーバーに過度な負荷を掛ける行為</li>
          <li>その他、運営を妨害する行為</li>
        </ul>

        <h2>4. 免責事項</h2>
        <p>
          本サイトのコンテンツはできる限り正確を期していますが、その完全性・正確性・有用性を保証するものではありません。内容を実務に適用した結果生じたいかなる損害についても、運営者は責任を負いません。
        </p>

        <h2>5. 規約の変更</h2>
        <p>
          本規約は事前告知なく変更されることがあります。変更後の規約は本ページ掲載時点から効力を有します。
        </p>
      </article>
    </Container>
  );
}
