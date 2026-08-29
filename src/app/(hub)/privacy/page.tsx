import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { ArticleMeta } from "@/components/layout/ArticleMeta";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "プライバシーポリシー",
  description: `${site.name}のプライバシーポリシー`,
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <Container size="narrow" className="py-12 md:py-16">
      <article className="prose-jp max-w-none">
        <h1>プライバシーポリシー</h1>
        {/* 規約系は著者ではなく改定日が要る。名義は運営者なので著者行は出さない */}
        <ArticleMeta
          path="/privacy"
          className="not-prose"
          showAuthor={false}
          dateLabel="最終改定"
        />
        <p>
          {site.name}
          （以下「本サイト」といいます）における個人情報の取り扱い、および利用するサービスについて明記します。
        </p>

        <h2>1. 個人情報の取得</h2>
        <p>
          本サイトはユーザー登録機能を提供していません。お問い合わせフォーム経由でご連絡いただいた場合、返信のためにメールアドレスを一時的に利用します。
        </p>

        <h2>2. アクセス解析ツールの使用</h2>
        <p>
          本サイトは Google Analytics 4 および Vercel Analytics を用いてアクセス状況を分析しています。
          これらのツールはCookieを用いて匿名の利用データを収集しますが、個人を特定する情報は含まれません。
          Google Analytics のデータ収集は、ブラウザのCookie無効化により拒否できます。
        </p>

        <h2>3. アフィリエイトプログラムについて</h2>
        <p>
          本サイトはAmazon.co.jpアソシエイト・プログラムに参加しています。当ページに含まれる商品リンクを経由して購入された場合、当サイト運営者が紹介料を受け取ることがあります。
          その他、A8.netやもしもアフィリエイト等のプログラムを利用する場合があります。
        </p>

        <h2>4. 広告配信について</h2>
        <p>
          本サイトは将来的にGoogle AdSense等の第三者広告を配信する可能性があります。第三者配信の広告サービスはユーザーの興味に応じた広告を表示するためにCookieを使用することがあります。Cookie設定は各ブラウザの設定から無効化できます。
        </p>

        <h2>5. 免責事項</h2>
        <p>
          本サイトのコンテンツはできる限り正確を期していますが、その完全性・正確性・有用性を保証するものではありません。内容の利用によって生じたいかなる損害についても、運営者は責任を負いません。
        </p>

        <h2>6. プライバシーポリシーの変更</h2>
        <p>
          本ポリシーは事前告知なく変更される場合があります。変更後の内容は本ページ掲載時点から適用されるものとします。
        </p>

        <h2>7. お問い合わせ先</h2>
        <p>
          本ポリシーに関するお問い合わせは <a href="/contact">お問い合わせページ</a> よりご連絡ください。
        </p>
      </article>
    </Container>
  );
}
